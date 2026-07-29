import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { runMigrations, type Exec } from './migrate';
import { makeProxyCallback, type ExecWithChanges } from './client';
import * as schema from './schema';

let testDz: ReturnType<typeof drizzle>;

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, getDrizzle: () => testDz };
});

async function makeTestDb() {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  const exec: ExecWithChanges = async (sql, params = []) => {
    const rows = (db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []) as unknown[][];
    return { rows, changes: db.changes() as number };
  };
  const execRows: Exec = async (sql, params, method) => (await exec(sql, params ?? [], method ?? 'all')).rows;
  await runMigrations(execRows);
  return drizzle(makeProxyCallback(exec), { schema });
}

import {
  logFood,
  getEntriesForDay,
  deleteFoodEntry,
  getEntriesSince,
  totalsOf,
  averageKcalPerLoggedDay,
  localDayBounds,
} from './nutrition';

const AT = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h, 0, 0, 0);

describe('logFood / getEntriesForDay', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('writes an entry a fresh read still sees', async () => {
    const created = await logFood(
      { name: 'Greek yoghurt', mealSlot: 'breakfast', kcal: 180, proteinG: 20 },
      AT(2026, 6, 28),
    );
    const back = await getEntriesForDay(AT(2026, 6, 28));
    expect(back).toHaveLength(1);
    expect(back[0]).toMatchObject({ id: created.id, name: 'Greek yoghurt', kcal: 180, proteinG: 20 });
  });

  it('a quick-add has no food item behind it, and that is a valid entry not a broken one', async () => {
    const created = await logFood(
      { name: 'Dinner out, rough guess', mealSlot: 'dinner', kcal: 900, proteinG: 40 },
      AT(2026, 6, 28),
    );
    expect(created.foodItemId).toBeNull();
    expect(created.quantityGrams).toBeNull();
  });

  it('keeps the quantity as entered rather than back-converting it', async () => {
    const created = await logFood(
      { name: 'Chicken breast', mealSlot: 'lunch', kcal: 330, proteinG: 62, quantityLabel: '2 palms' },
      AT(2026, 6, 28),
    );
    expect(created.quantityLabel).toBe('2 palms');
    expect(created.quantityGrams).toBeNull();
  });

  // A food day is a LOCAL day — you eat breakfast at 8am wherever you are.
  it('scopes to the local day, not to UTC', async () => {
    await logFood({ name: 'Late snack', mealSlot: 'snack', kcal: 200, proteinG: 5 }, AT(2026, 6, 28, 23));
    await logFood({ name: 'Early breakfast', mealSlot: 'breakfast', kcal: 300, proteinG: 20 }, AT(2026, 6, 29, 1));

    expect(await getEntriesForDay(AT(2026, 6, 28))).toHaveLength(1);
    expect(await getEntriesForDay(AT(2026, 6, 29))).toHaveLength(1);
  });

  it('bounds a local day at local midnight on both sides', () => {
    const { start, end } = localDayBounds(AT(2026, 6, 28));
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(end).getHours()).toBe(0);
    expect(new Date(end).getDate()).toBe(29);
  });

  it('returns meals oldest first, so a day reads in the order it happened', async () => {
    await logFood({ name: 'Dinner', mealSlot: 'dinner', kcal: 700, proteinG: 40 }, AT(2026, 6, 28, 19));
    await logFood({ name: 'Breakfast', mealSlot: 'breakfast', kcal: 400, proteinG: 25 }, AT(2026, 6, 28, 8));
    const day = await getEntriesForDay(AT(2026, 6, 28));
    expect(day.map((e) => e.name)).toEqual(['Breakfast', 'Dinner']);
  });

  it('soft-deletes, so a removed entry stops counting without vanishing from the log', async () => {
    const created = await logFood({ name: 'Mistake', mealSlot: 'snack', kcal: 500, proteinG: 0 }, AT(2026, 6, 28));
    await deleteFoodEntry(created.id, AT(2026, 6, 28, 13));

    expect(await getEntriesForDay(AT(2026, 6, 28))).toHaveLength(0);
    const raw = await testDz.select().from(schema.foodLogEntries);
    expect(raw).toHaveLength(1);
    expect(raw[0].deletedAt).not.toBeNull();
  });
});

describe('totals and averages', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('sums a day, treating missing carbs and fat as zero rather than NaN', () => {
    const totals = totalsOf([
      { kcal: 180, proteinG: 20, carbsG: 12, fatG: 1 },
      { kcal: 330, proteinG: 62, carbsG: null, fatG: null },
    ] as never);
    expect(totals).toEqual({ kcal: 510, proteinG: 82, carbsG: 12, fatG: 1 });
  });

  it('returns null rather than zero when nothing has been logged', () => {
    expect(averageKcalPerLoggedDay([])).toBeNull();
  });

  // The number that leads the day view. Dividing by 7 when three days were
  // logged reports a deficit nobody ate.
  it('averages over days that were actually logged, not over the calendar window', async () => {
    await logFood({ name: 'a', mealSlot: 'breakfast', kcal: 2000, proteinG: 100 }, AT(2026, 6, 26));
    await logFood({ name: 'b', mealSlot: 'breakfast', kcal: 3000, proteinG: 100 }, AT(2026, 6, 27));

    const entries = await getEntriesSince(localDayBounds(AT(2026, 6, 21)).start);
    const avg = averageKcalPerLoggedDay(entries);
    expect(avg).toEqual({ kcal: 2500, days: 2 });
  });

  it('adds up several entries on the same day before averaging', async () => {
    await logFood({ name: 'a', mealSlot: 'breakfast', kcal: 500, proteinG: 30 }, AT(2026, 6, 26, 8));
    await logFood({ name: 'b', mealSlot: 'lunch', kcal: 700, proteinG: 40 }, AT(2026, 6, 26, 13));
    const entries = await getEntriesSince(localDayBounds(AT(2026, 6, 20)).start);
    expect(averageKcalPerLoggedDay(entries)).toEqual({ kcal: 1200, days: 1 });
  });
});

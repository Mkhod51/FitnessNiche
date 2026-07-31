import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { runMigrations, type Exec } from '../db/migrate';
import { makeProxyCallback, type ExecWithChanges } from '../db/client';
import * as schema from '../db/schema';

let testDz: ReturnType<typeof drizzle>;
vi.mock('../db/client', async () => {
  const actual = await vi.importActual<typeof import('../db/client')>('../db/client');
  return { ...actual, getDrizzle: () => testDz };
});
import { saveFoodItem, getRecentFoods, searchFoodLocal, getCommonFoods } from './local';
import { logFood } from '../db/nutrition';
import type { FoodItemDraft } from './types';

function offDraft(overrides: Partial<FoodItemDraft> = {}): FoodItemDraft {
  return {
    source: 'off',
    name: 'Skyr',
    barcode: '1',
    kcalPer100g: 62,
    proteinGPer100g: 11,
    carbsGPer100g: 4,
    fatGPer100g: 0.2,
    ...overrides,
  };
}

async function makeTestDb() {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  const exec: ExecWithChanges = async (sql, params = []) => {
    const rows = (db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []) as unknown[][];
    return { rows, changes: db.changes() as number };
  };
  const execRows: Exec = async (sql, p, m) => (await exec(sql, p ?? [], m ?? 'all')).rows;
  await runMigrations(execRows);
  return drizzle(makeProxyCallback(exec), { schema });
}

describe('food_items cache', () => {
  beforeEach(async () => { testDz = await makeTestDb(); });

  it('saves an OFF draft and reads it back', async () => {
    const saved = await saveFoodItem(offDraft());
    expect(saved.id).toBeTruthy();
    expect((await searchFoodLocal('skyr'))[0]).toMatchObject({ name: 'Skyr', source: 'off' });
  });

  it('rejects an incomplete OFF draft instead of persisting missing macros as zeroes', async () => {
    const incomplete = { ...offDraft(), carbsGPer100g: undefined } as unknown as FoodItemDraft;

    await expect(saveFoodItem(incomplete)).rejects.toThrow(/carbs and fat/i);
    expect(await searchFoodLocal('skyr')).toEqual([]);
  });

  it('upserts by barcode instead of duplicating', async () => {
    await saveFoodItem(offDraft());
    await saveFoodItem(offDraft({ name: 'Skyr Plain' }));
    expect((await searchFoodLocal('skyr'))).toHaveLength(1);
  });

  it('recents are the food_items behind recently-logged entries, newest first, deduped', async () => {
    const oats = await saveFoodItem(offDraft({ name: 'Oats', barcode: 'A', kcalPer100g: 380, proteinGPer100g: 13, carbsGPer100g: 68, fatGPer100g: 7 }));
    const chicken = await saveFoodItem(offDraft({ name: 'Chicken', barcode: 'B', kcalPer100g: 165, proteinGPer100g: 31, carbsGPer100g: 0, fatGPer100g: 3.6 }));
    await logFood({ name: 'Oats', mealSlot: 'breakfast', kcal: 300, proteinG: 10, foodItemId: oats.id }, new Date(2026, 6, 28, 8));
    await logFood({ name: 'Chicken', mealSlot: 'dinner', kcal: 330, proteinG: 62, foodItemId: chicken.id }, new Date(2026, 6, 28, 19));
    const recents = await getRecentFoods();
    expect(recents.map((f) => f.name)).toEqual(['Chicken', 'Oats']);
  });

  it('common foods are the CoFID rows', async () => {
    await testDz.insert(schema.foodItems).values({
      id: 'eggs-boiled', source: 'cofid', name: 'Eggs, boiled',
      kcalPer100g: 131, proteinGPer100g: 13, carbsGPer100g: 0, fatGPer100g: 9,
      updatedAt: '2026-07-30T00:00:00.000Z',
    });
    expect((await getCommonFoods()).map((f) => f.name)).toEqual(['Eggs, boiled']);
  });
});

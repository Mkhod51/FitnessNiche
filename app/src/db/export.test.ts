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
  // getUser() opens the store itself by design, so initDb has to be stubbed —
  // otherwise it reaches for a Worker that jsdom does not have.
  return { ...actual, getDrizzle: () => testDz, initDb: async () => 'opfs-sahpool' };
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

import { exportEverything, exportFilename, deleteEverything } from './export';
import { recordConsent, getUser, LOCAL_USER_ID } from './user';
import { logSet, startWorkout } from './workouts';
import { logWeight } from './weights';
import { logFood } from './nutrition';

/** The catalogue is normally seeded by initDb, which is stubbed out here. */
async function seedCatalogue() {
  await testDz
    .insert(schema.exercises)
    .values({
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      modality: 'barbell',
      isCompound: true,
      contributions: { chest: 1 },
    })
    .run();
}

async function seedSomeUserData() {
  await seedCatalogue();
  await recordConsent();
  await startWorkout('Push day');
  await logSet({ exerciseId: 'barbell-bench-press', weightKg: 100, reps: 5, rir: 2 });
  await logWeight(78.4);
  await logFood({ name: 'Oats', mealSlot: 'breakfast', kcal: 340, proteinG: 11 });
}

describe('exportEverything — GR-5 data-subject access', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('includes every table the user actually contributed to', async () => {
    await seedSomeUserData();
    const out = await exportEverything();

    expect(out.users).toHaveLength(1);
    expect(out.workouts).toHaveLength(1);
    expect(out.sets).toHaveLength(1);
    expect(out.weights).toHaveLength(1);
    expect(out.foodLogEntries).toHaveLength(1);
    expect(out.adviceEvents).toEqual([]);
  });

  // Catalogue data shipped with the app is not something the user told us, and
  // padding an export people may need to read is not a kindness.
  it('leaves out the exercise catalogue', async () => {
    await seedSomeUserData();
    expect(Object.keys(await exportEverything())).not.toContain('exercises');
  });

  it('round-trips as JSON, since that is what actually gets handed over', async () => {
    await seedSomeUserData();
    const json = JSON.stringify(await exportEverything());
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).sets[0].weightKg).toBe(100);
  });

  it('names the file by date so successive exports do not overwrite', () => {
    expect(exportFilename(new Date(2026, 6, 29))).toBe('myostat-export-2026-07-29.json');
  });
});

describe('deleteEverything — GR-5 erasure means erasure', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  // Everything else in this app soft-deletes. This is the one place that is
  // wrong: a right-to-erasure answered with deleted_at = now has erased nothing
  // and would resurrect on the next sync pull.
  it('removes the rows rather than marking them deleted', async () => {
    await seedSomeUserData();
    await deleteEverything();

    expect(await testDz.select().from(schema.sets)).toHaveLength(0);
    expect(await testDz.select().from(schema.workouts)).toHaveLength(0);
    expect(await testDz.select().from(schema.weights)).toHaveLength(0);
    expect(await testDz.select().from(schema.foodLogEntries)).toHaveLength(0);
  });

  it('leaves the app bootable, with consent cleared so logging is gated again', async () => {
    await seedSomeUserData();
    expect((await getUser()).consentedAt).not.toBeNull();

    await deleteEverything();

    const fresh = await getUser();
    expect(fresh.id).toBe(LOCAL_USER_ID);
    expect(fresh.consentedAt).toBeNull();
    expect(fresh.goal).toBe('maintain');
  });

  it('leaves the exercise catalogue intact — it is not the user\'s data to erase', async () => {
    await seedSomeUserData();
    const before = await testDz.select().from(schema.exercises);
    expect(before.length).toBeGreaterThan(0); // otherwise this proves nothing
    await deleteEverything();
    expect(await testDz.select().from(schema.exercises)).toHaveLength(before.length);
  });
});

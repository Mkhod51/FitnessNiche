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

import { exportEverything, exportFilename, exportSetsCsv, exportCsvFilename, csvCell, deleteEverything } from './export';
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

describe('exportSetsCsv — the training log, and only that', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
    await seedSomeUserData();
  });

  it('writes a header and one row per live set, with the exercise named', async () => {
    const csv = await exportSetsCsv();
    const lines = csv.split('\n');
    expect(lines[0]).toBe('performed_at,exercise,weight_kg,reps,rir,set_type');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Barbell Bench Press');
    expect(lines[1]).toContain('100');
  });

  // FR-LOG-1 keeps "not recorded" distinct from zero everywhere else, and a CSV
  // that writes 0 for an unrecorded RIR invents a value the lifter never gave.
  it('leaves an unrecorded RIR empty rather than writing zero', async () => {
    await logSet({ exerciseId: 'barbell-bench-press', weightKg: 60, reps: 8, rir: null });
    const row = (await exportSetsCsv()).split('\n').find((l) => l.includes(',60,'))!;
    expect(row).toMatch(/,60,8,,working$/);
  });

  // Tested directly rather than through a logged set, because the CSV resolves
  // names from the SEED_EXERCISES constant and not from the exercises table —
  // nothing in the app reads that table (OPEN-QUESTIONS Q3), so inserting a
  // comma-laden row into it would prove nothing about this code path.
  //
  // An unescaped comma silently shifts every later column, and the result still
  // looks like valid data to whatever opens the file next.
  it('quotes fields that would otherwise shift the columns', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('Row, Bent-Over')).toBe('"Row, Bent-Over"');
    expect(csvCell('Pendlay "row"')).toBe('"Pendlay ""row"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('omits soft-deleted sets', async () => {
    const before = (await exportSetsCsv()).split('\n').length;
    await testDz.update(schema.sets).set({ deletedAt: new Date().toISOString() }).run();
    expect((await exportSetsCsv()).split('\n')).toHaveLength(before - 1);
  });

  it('names the csv distinctly from the json export', () => {
    const d = new Date('2026-08-03T12:00:00');
    expect(exportCsvFilename(d)).toBe('myostat-export-2026-08-03-sets.csv');
    expect(exportFilename(d)).toBe('myostat-export-2026-08-03.json');
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

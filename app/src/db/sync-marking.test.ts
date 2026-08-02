// The sync queue is fed here, not in the UI: every write to a sync'd table
// (users, workouts, sets, weights, advice_events, food_log_entries) must mark
// itself pending, or a logged set that never leaves the device is a silent
// NFR-1 failure. Real sqlite engine, same mocked-getDrizzle seam as
// workouts.test.ts. Inserts assert the row is queued; updates/deletes first
// clear the queue entry, then assert the write re-marks it — proving the
// UPDATE path marks, not just the prior INSERT.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { and, eq, isNotNull } from 'drizzle-orm';
import { runMigrations, type Exec } from './migrate';
import { makeProxyCallback, type ExecWithChanges } from './client';
import * as schema from './schema';

let testDz: ReturnType<typeof drizzle>;

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  // getUser() opens the store itself before reading, so the boot has to be
  // stubbed too — same reason user.test.ts stubs it.
  return { ...actual, getDrizzle: () => testDz, initDb: async () => 'memory-fallback' as const };
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

// Imported after the mock above is set up (vi.mock is hoisted by vitest).
import { startWorkout, finishWorkout, renameWorkout, logSet } from './workouts';
import { logWeight } from './weights';
import { logFood, deleteFoodEntry } from './nutrition';
import { recordAdviceShown, suppressClaim } from './advice-events';
import { getUser, recordConsent, updateProfile, setCalorieTarget, LOCAL_USER_ID } from './user';
import { clearPending } from '../sync/queue';

const NOW = new Date('2026-07-30T10:00:00.000Z');

async function pendingIds(table: string): Promise<string[]> {
  const rows = await testDz
    .select({ id: schema.syncMeta.rowId })
    .from(schema.syncMeta)
    .where(and(eq(schema.syncMeta.tableName, table), isNotNull(schema.syncMeta.pendingSince)));
  return rows.map((r) => r.id);
}

async function isPending(table: string, id: string): Promise<boolean> {
  return (await pendingIds(table)).includes(id);
}

describe('every sync\'d write marks itself pending', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('a new workout is queued', async () => {
    const w = await startWorkout('Legs', NOW);
    expect(await isPending('workouts', w.id)).toBe(true);
  });

  it('a logged set is queued', async () => {
    const set = await logSet({ exerciseId: 'bench', weightKg: 60, reps: 5, rir: 2 }, NOW);
    expect(await isPending('sets', set.id)).toBe(true);
  });

  it('a logged weight is queued', async () => {
    const w = await logWeight(82.3, NOW);
    expect(await isPending('weights', w.id)).toBe(true);
  });

  it('a logged food entry is queued', async () => {
    const e = await logFood({ name: 'Oats', mealSlot: 'breakfast', kcal: 300, proteinG: 10 }, NOW);
    expect(await isPending('food_log_entries', e.id)).toBe(true);
  });

  it('a shown advice event is queued', async () => {
    const ev = await recordAdviceShown('c-volume-dose-response', 'rule', null, 'hub', NOW);
    expect(await isPending('advice_events', ev.id)).toBe(true);
  });

  // Updates must mark too — an edit that doesn't queue stays stale on every
  // other device forever. Clearing first proves the UPDATE is what re-marks.
  it('finishing a workout re-marks it after the queue was cleared', async () => {
    const w = await startWorkout('Legs', NOW);
    await clearPending('workouts', w.id, NOW);
    expect(await isPending('workouts', w.id)).toBe(false);

    await finishWorkout(w.id, NOW);
    expect(await isPending('workouts', w.id)).toBe(true);
  });

  it('renaming a workout re-marks it', async () => {
    const w = await startWorkout(null, NOW);
    await clearPending('workouts', w.id, NOW);
    await renameWorkout(w.id, 'Push', NOW);
    expect(await isPending('workouts', w.id)).toBe(true);
  });

  it('soft-deleting a food entry re-marks it (the tombstone must travel)', async () => {
    const e = await logFood({ name: 'Oats', mealSlot: 'breakfast', kcal: 300, proteinG: 10 }, NOW);
    await clearPending('food_log_entries', e.id, NOW);
    await deleteFoodEntry(e.id, NOW);
    expect(await isPending('food_log_entries', e.id)).toBe(true);
  });

  it('suppressing a claim re-marks every event carrying it', async () => {
    const ev = await recordAdviceShown('c-protein-timing-distribution-matters', 'rule', null, 'hub', NOW);
    await clearPending('advice_events', ev.id, NOW);
    await suppressClaim('c-protein-timing-distribution-matters', NOW);
    expect(await isPending('advice_events', ev.id)).toBe(true);
  });

  it('recording consent queues the user row', async () => {
    await getUser(); // creates the row without marking
    expect(await isPending('users', LOCAL_USER_ID)).toBe(false);
    await recordConsent();
    expect(await isPending('users', LOCAL_USER_ID)).toBe(true);
  });

  it('updating the profile re-marks the user row', async () => {
    await recordConsent();
    await clearPending('users', LOCAL_USER_ID, NOW);
    await updateProfile({ heightCm: 180 }, NOW);
    expect(await isPending('users', LOCAL_USER_ID)).toBe(true);
  });

  it('setting a calorie target re-marks the user row', async () => {
    await recordConsent();
    await clearPending('users', LOCAL_USER_ID, NOW);
    await setCalorieTarget({ calorieTargetKcal: 2200, proteinTargetG: 150, deficitKcal: 400 }, NOW);
    expect(await isPending('users', LOCAL_USER_ID)).toBe(true);
  });

  // Idempotency: a row edited twice before it syncs keeps its ORIGINAL
  // pendingSince, so a constantly-touched row can't look perpetually fresh
  // and fall behind in age-ordered retry. This is the queue.ts contract,
  // asserted through the write path the user actually takes.
  it('a second edit does not reset pendingSince', async () => {
    const set = await logSet({ exerciseId: 'bench', weightKg: 60, reps: 5, rir: 2 }, NOW);
    const first = await testDz
      .select({ since: schema.syncMeta.pendingSince })
      .from(schema.syncMeta)
      .where(and(eq(schema.syncMeta.tableName, 'sets'), eq(schema.syncMeta.rowId, set.id)))
      .get();

    await logSet({ exerciseId: 'bench', weightKg: 62.5, reps: 5, rir: 2 }, new Date('2026-07-30T10:05:00.000Z'));
    const second = await testDz
      .select({ since: schema.syncMeta.pendingSince })
      .from(schema.syncMeta)
      .where(and(eq(schema.syncMeta.tableName, 'sets'), eq(schema.syncMeta.rowId, set.id)))
      .get();

    expect(second?.since, 'pendingSince must be the original queue time, not the latest edit').toBe(first?.since);
  });
});

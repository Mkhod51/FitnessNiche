// Proves the Task 6 data layer (getOrCreateOpenWorkout / logSet / getLastSetForExercise
// / getTodaysSets) against a REAL sqlite engine, the same seam user.test.ts and
// drizzle-contract.test.ts use — a mocked `getDrizzle()` lets this module (which must
// use the real client.ts getDrizzle() per the task brief) be exercised against an
// in-memory database instead of a live worker.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
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

// Imported after the mock above is set up (vi.mock is hoisted by vitest).
import {
  getOrCreateOpenWorkout,
  findOpenWorkout,
  logSet,
  getLastSetForExercise,
  getTodaysSets,
} from './workouts';
import { LOCAL_USER_ID } from './user';

const BENCH = 'barbell-bench-press';
const SQUAT = 'barbell-back-squat';

describe('getOrCreateOpenWorkout / findOpenWorkout — the lazy-session rule', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('does not create a workout row just by looking for one', async () => {
    const found = await findOpenWorkout(new Date('2026-07-25T10:00:00.000Z'));
    expect(found).toBeUndefined();
    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(0);
  });

  it('creates a workout on the first call, owned by the local user', async () => {
    const now = new Date('2026-07-25T10:00:00.000Z');
    const workout = await getOrCreateOpenWorkout(now);
    expect(workout.userId).toBe(LOCAL_USER_ID);
    expect(workout.deletedAt).toBeNull();

    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(1);
  });

  it('reuses the same workout for a second call later the same day', async () => {
    const morning = new Date('2026-07-25T10:00:00.000Z');
    const evening = new Date('2026-07-25T20:00:00.000Z');

    const first = await getOrCreateOpenWorkout(morning);
    const second = await getOrCreateOpenWorkout(evening);

    expect(second.id).toBe(first.id);
    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(1);
  });

  it('starts a fresh workout when the most recent one was on an earlier calendar day', async () => {
    const yesterday = new Date('2026-07-24T20:00:00.000Z');
    const today = new Date('2026-07-25T09:00:00.000Z');

    const first = await getOrCreateOpenWorkout(yesterday);
    const second = await getOrCreateOpenWorkout(today);

    expect(second.id).not.toBe(first.id);
    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(2);
  });
});

describe('logSet — FR-LOG-4: the write lands in sqlite immediately, and RIR is genuinely optional', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('writes a set that a fresh read (simulating a reload) still sees', async () => {
    const now = new Date('2026-07-25T10:00:00.000Z');
    const created = await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, now);

    // "Reload": nothing in-process is reused except the underlying db itself —
    // same simulated-reload pattern user.test.ts uses for consent.
    const reread = await testDz.select().from(schema.sets).where(eq(schema.sets.id, created.id)).get();
    expect(reread).toBeDefined();
    expect(reread).toMatchObject({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 });
  });

  it('attaches the set to a lazily-created workout, and a second set the same day attaches to the same workout', async () => {
    const now = new Date('2026-07-25T10:00:00.000Z');
    const workoutsBefore = await testDz.select().from(schema.workouts);
    expect(workoutsBefore).toHaveLength(0);

    const first = await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, now);
    const second = await logSet({ exerciseId: SQUAT, weightKg: 80, reps: 5, rir: 1 }, now);

    expect(second.workoutId).toBe(first.workoutId);
    const workoutsAfter = await testDz.select().from(schema.workouts);
    expect(workoutsAfter).toHaveLength(1);
  });

  it('FR-LOG-1: stores a genuinely null RIR when none is given — never defaulted to a number', async () => {
    const created = await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: null }, new Date('2026-07-25T10:00:00.000Z'));
    expect(created.rir).toBeNull();

    const reread = await testDz.select().from(schema.sets).where(eq(schema.sets.id, created.id)).get();
    expect(reread?.rir).toBeNull();
  });
});

describe('getLastSetForExercise — defaults come from the same exercise, never a global last set', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('returns undefined when the exercise has never been logged', async () => {
    expect(await getLastSetForExercise(BENCH)).toBeUndefined();
  });

  it('returns the most recent set for that exercise, ignoring more recent sets of a different exercise', async () => {
    await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-25T09:00:00.000Z'));
    await logSet({ exerciseId: SQUAT, weightKg: 100, reps: 5, rir: 1 }, new Date('2026-07-25T09:05:00.000Z'));
    await logSet({ exerciseId: BENCH, weightKg: 62.5, reps: 5, rir: 1 }, new Date('2026-07-25T09:10:00.000Z'));

    const lastBench = await getLastSetForExercise(BENCH);
    expect(lastBench?.weightKg).toBe(62.5);
    expect(lastBench?.reps).toBe(5);
    expect(lastBench?.rir).toBe(1);

    const lastSquat = await getLastSetForExercise(SQUAT);
    expect(lastSquat?.weightKg).toBe(100);
  });
});

describe('getTodaysSets — enough of the current session to confirm the write landed', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('is empty before anything has been logged today (no workout exists yet)', async () => {
    expect(await getTodaysSets(new Date('2026-07-25T10:00:00.000Z'))).toEqual([]);
  });

  it('returns every set logged in today\'s open workout, most recent first', async () => {
    const now = new Date('2026-07-25T10:00:00.000Z');
    await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-25T09:00:00.000Z'));
    await logSet({ exerciseId: SQUAT, weightKg: 100, reps: 5, rir: 1 }, new Date('2026-07-25T09:05:00.000Z'));

    const sets = await getTodaysSets(now);
    expect(sets).toHaveLength(2);
    expect(sets[0].exerciseId).toBe(SQUAT); // most recent first
    expect(sets[1].exerciseId).toBe(BENCH);
  });

  it('does not carry sets over from a previous day\'s workout', async () => {
    await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-24T09:00:00.000Z'));
    expect(await getTodaysSets(new Date('2026-07-25T10:00:00.000Z'))).toEqual([]);
  });
});

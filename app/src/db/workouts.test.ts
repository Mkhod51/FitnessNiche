// Proves the Task 6 data layer (getOrCreateOpenWorkout / logSet / getLastSetForExercise
// / getOpenSessionSets) against a REAL sqlite engine, the same seam user.test.ts and
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
  startWorkout,
  finishWorkout,
  getRecentWorkouts,
  logSet,
  getLastSetForExercise,
  getOpenSessionSets,
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

  // BEHAVIOUR CHANGED, deliberately. This used to assert that a new calendar
  // day started a fresh workout, because a session was defined as "the most
  // recent workout, if it started today". A session is now defined by
  // finished_at IS NULL, so an unfinished workout stays open across midnight —
  // which is the point. Silently closing someone's session loses the rest of
  // their sets, and NFR-1 does not allow that.
  it('keeps an unfinished workout open across a calendar day boundary, so it can be resumed', async () => {
    const yesterday = new Date('2026-07-24T20:00:00.000Z');
    const today = new Date('2026-07-25T09:00:00.000Z');

    const first = await getOrCreateOpenWorkout(yesterday);
    const second = await getOrCreateOpenWorkout(today);

    expect(second.id).toBe(first.id);
    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(1);
  });

  it('starts a fresh workout once the previous one has been finished', async () => {
    const first = await getOrCreateOpenWorkout(new Date('2026-07-24T20:00:00.000Z'));
    await finishWorkout(first.id, new Date('2026-07-24T21:00:00.000Z'));

    const second = await getOrCreateOpenWorkout(new Date('2026-07-25T09:00:00.000Z'));

    expect(second.id).not.toBe(first.id);
    const all = await testDz.select().from(schema.workouts);
    expect(all).toHaveLength(2);
  });

  it('finds nothing open once the session is finished', async () => {
    const w = await startWorkout('Push day', new Date('2026-07-25T18:00:00.000Z'));
    expect(await findOpenWorkout()).toMatchObject({ id: w.id });

    await finishWorkout(w.id, new Date('2026-07-25T19:00:00.000Z'));
    expect(await findOpenWorkout()).toBeUndefined();
  });

  // NFR-1: an abandoned session is resumable, never silently closed. The app
  // offers resume-or-discard; it does not decide on the user's behalf.
  it('still finds a session abandoned days ago, rather than quietly closing it', async () => {
    const w = await startWorkout('Push day', new Date('2026-07-20T18:00:00.000Z'));
    const found = await findOpenWorkout(new Date('2026-07-25T09:00:00.000Z'));
    expect(found?.id).toBe(w.id);
  });

  it('records the name it was started with, and finishing stamps finishedAt', async () => {
    const w = await startWorkout('Push day', new Date('2026-07-25T18:00:00.000Z'));
    expect(w.name).toBe('Push day');
    expect(w.finishedAt).toBeNull();

    await finishWorkout(w.id, new Date('2026-07-25T19:12:00.000Z'));
    const reread = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, w.id)).get();
    expect(reread?.finishedAt).toBe('2026-07-25T19:12:00.000Z');
  });
});

// The bug this replaces a rule to fix, kept as its own case because it is the
// reason the session model changed at all.
describe('the midnight split', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('keeps a late-night session in one workout when the clock passes midnight', async () => {
    // Built from LOCAL components, not a UTC ISO string. The rule this replaced
    // compared local calendar days, so a UTC literal only crosses local midnight
    // in some timezones — on a +01:00 machine "23:30Z" is already 00:30 the next
    // local day, and the test passed with the bug still present. Fault injection
    // is what caught that: restoring the old rule left this test green.
    const beforeMidnight = new Date(2026, 6, 25, 23, 30, 0);
    const afterMidnight = new Date(2026, 6, 26, 0, 15, 0);

    await startWorkout('Late session', beforeMidnight);
    const first = await logSet({ exerciseId: BENCH, weightKg: 100, reps: 5, rir: 2 }, beforeMidnight);
    const second = await logSet({ exerciseId: SQUAT, weightKg: 140, reps: 5, rir: 2 }, afterMidnight);

    expect(second.workoutId).toBe(first.workoutId);
    const all = await testDz.select().from(schema.workouts);
    expect(all, 'a session must not be split in two by the clock').toHaveLength(1);
  });
});

describe('set type — warm-ups are recorded as such so they can be excluded later', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('defaults to a working set when no type is given', async () => {
    const created = await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-25T10:00:00.000Z'));
    expect(created.setType).toBe('working');
  });

  it('stores a warm-up as a warm-up', async () => {
    const created = await logSet(
      { exerciseId: BENCH, weightKg: 40, reps: 8, rir: null, setType: 'warmup' },
      new Date('2026-07-25T10:00:00.000Z'),
    );
    expect(created.setType).toBe('warmup');

    const reread = await testDz.select().from(schema.sets).where(eq(schema.sets.id, created.id)).get();
    expect(reread?.setType).toBe('warmup');
  });
});

describe('getRecentWorkouts — the "repeat a previous session" list', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('returns finished sessions, most recent first, and never the open one', async () => {
    const a = await startWorkout('Push day', new Date('2026-07-20T18:00:00.000Z'));
    await finishWorkout(a.id, new Date('2026-07-20T19:00:00.000Z'));
    const b = await startWorkout('Pull day', new Date('2026-07-22T18:00:00.000Z'));
    await finishWorkout(b.id, new Date('2026-07-22T19:00:00.000Z'));
    const open = await startWorkout('Legs', new Date('2026-07-25T18:00:00.000Z'));

    const recent = await getRecentWorkouts(5);
    expect(recent.map((w) => w.id)).toEqual([b.id, a.id]);
    expect(recent.map((w) => w.id)).not.toContain(open.id);
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

describe('getOpenSessionSets — enough of the current session to confirm the write landed', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('is empty before anything has been logged today (no workout exists yet)', async () => {
    expect(await getOpenSessionSets(new Date('2026-07-25T10:00:00.000Z'))).toEqual([]);
  });

  it('returns every set logged in today\'s open workout, most recent first', async () => {
    const now = new Date('2026-07-25T10:00:00.000Z');
    await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-25T09:00:00.000Z'));
    await logSet({ exerciseId: SQUAT, weightKg: 100, reps: 5, rir: 1 }, new Date('2026-07-25T09:05:00.000Z'));

    const sets = await getOpenSessionSets(now);
    expect(sets).toHaveLength(2);
    expect(sets[0].exerciseId).toBe(SQUAT); // most recent first
    expect(sets[1].exerciseId).toBe(BENCH);
  });

  // BEHAVIOUR CHANGED with the session model. This used to assert that a new
  // calendar day showed no sets, which was the day-based rule talking. What
  // actually matters is that a *finished* session's sets are not presented as
  // the current one's — the boundary is now finishing, not midnight.
  it('does not carry sets over from a finished workout', async () => {
    const yesterday = new Date('2026-07-24T09:00:00.000Z');
    const first = await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, yesterday);
    await finishWorkout(first.workoutId, new Date('2026-07-24T10:00:00.000Z'));

    expect(await getOpenSessionSets(new Date('2026-07-25T10:00:00.000Z'))).toEqual([]);
  });

  it('does carry sets across midnight while the session is still open', async () => {
    await logSet({ exerciseId: BENCH, weightKg: 60, reps: 5, rir: 2 }, new Date('2026-07-24T23:50:00.000Z'));
    const stillThere = await getOpenSessionSets(new Date('2026-07-25T00:10:00.000Z'));
    expect(stillThere).toHaveLength(1);
  });
});

import { eq, and, isNull, desc } from 'drizzle-orm';
import { getDrizzle } from './client';
import { workouts, sets } from './schema';
import { LOCAL_USER_ID } from './user';

export type Workout = typeof workouts.$inferSelect;
// Named LoggedSet, not Set — `Set` would shadow the built-in collection type
// in every file that imports it.
export type LoggedSet = typeof sets.$inferSelect;

export type SetInput = {
  exerciseId: string;
  weightKg: number;
  reps: number;
  /** FR-LOG-1: RIR is genuinely optional — null means "not recorded", never a default number. */
  rir: number | null;
};

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Session rule (Task 6, resolved ambiguity): there is no explicit "start
 * workout" action. A workout is created lazily by the first *set* of a
 * session — never by merely opening the logging screen (see getTodaysSets
 * below, which must not create one). A session ends implicitly at local
 * midnight: this reuses the user's most recent non-deleted workout if it was
 * started on today's local calendar date, otherwise the next set starts a
 * fresh one. Read-only — never inserts — so callers that just want to know
 * "is there an open session" (e.g. the screen on mount) don't create one.
 */
export async function findOpenWorkout(now: Date = new Date()): Promise<Workout | undefined> {
  const db = getDrizzle();
  const [mostRecent] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, LOCAL_USER_ID), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(1);

  if (mostRecent && isSameLocalDay(new Date(mostRecent.startedAt), now)) return mostRecent;
  return undefined;
}

/** Same rule as findOpenWorkout, but creates a workout row when none is open. */
export async function getOrCreateOpenWorkout(now: Date = new Date()): Promise<Workout> {
  const existing = await findOpenWorkout(now);
  if (existing) return existing;

  const db = getDrizzle();
  const id = crypto.randomUUID();
  const nowIso = now.toISOString();
  await db.insert(workouts).values({ id, userId: LOCAL_USER_ID, startedAt: nowIso, updatedAt: nowIso }).run();

  const created = await db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!created) throw new Error('failed to create workout row');
  return created;
}

/**
 * FR-LOG-4/NFR-1: writes straight to sqlite, no queued React state, nothing
 * to await beyond the local write itself — durable the instant it resolves.
 */
export async function logSet(input: SetInput, now: Date = new Date()): Promise<LoggedSet> {
  const workout = await getOrCreateOpenWorkout(now);
  const db = getDrizzle();
  const id = crypto.randomUUID();
  const nowIso = now.toISOString();

  await db
    .insert(sets)
    .values({
      id,
      workoutId: workout.id,
      exerciseId: input.exerciseId,
      weightKg: input.weightKg,
      reps: input.reps,
      rir: input.rir,
      performedAt: nowIso,
      updatedAt: nowIso,
    })
    .run();

  const created = await db.select().from(sets).where(eq(sets.id, id)).get();
  if (!created) throw new Error('failed to create set row');
  return created;
}

/**
 * Defaults come from the previous set of the SAME exercise (Task 6 resolved
 * ambiguity) — never a global last set — so switching exercise in the picker
 * must re-fetch this, not reuse whatever was already in the fields.
 */
export async function getLastSetForExercise(exerciseId: string): Promise<LoggedSet | undefined> {
  const db = getDrizzle();
  return db
    .select()
    .from(sets)
    .where(and(eq(sets.exerciseId, exerciseId), isNull(sets.deletedAt)))
    .orderBy(desc(sets.performedAt))
    .limit(1)
    .get();
}

async function getSetsForWorkout(workoutId: string): Promise<LoggedSet[]> {
  const db = getDrizzle();
  return db
    .select()
    .from(sets)
    .where(and(eq(sets.workoutId, workoutId), isNull(sets.deletedAt)))
    .orderBy(desc(sets.performedAt));
}

/**
 * Enough of the current session to confirm a write landed (Task 6 scope —
 * not the trends/volume screen, that's Task 7). Read-only: uses
 * findOpenWorkout, so visiting the screen without logging anything never
 * creates a workout row.
 */
export async function getTodaysSets(now: Date = new Date()): Promise<LoggedSet[]> {
  const workout = await findOpenWorkout(now);
  if (!workout) return [];
  return getSetsForWorkout(workout.id);
}

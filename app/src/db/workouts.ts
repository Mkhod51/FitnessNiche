import { eq, and, isNull, isNotNull, desc } from 'drizzle-orm';
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
  /**
   * Warm-up sets must be excluded from weekly volume and from e1RM input.
   * Omitted means a working set — the overwhelmingly common case, and the same
   * default the migration applied to every set logged before this column
   * existed.
   */
  setType?: 'working' | 'warmup';
};

/**
 * A session is open until it is finished — `finished_at IS NULL`, nothing else.
 *
 * This replaced a rule that defined a session as "the most recent workout, if
 * it started on today's local calendar date". That rule had a real bug: a
 * lifter starting at 23:30 had their session silently split into two workouts
 * at midnight, so the second half of their sets landed on a different workout
 * and every per-session number was wrong. Removing the rule removes the bug,
 * rather than special-casing around it.
 *
 * The cost of the new rule is that an abandoned session stays open forever
 * instead of lapsing overnight. That is deliberate: closing someone's session
 * on their behalf discards the sets they have not logged yet, and NFR-1 does
 * not permit losing a write. The UI offers resume-or-discard; the data layer
 * does not decide.
 *
 * Read-only — never inserts — so a caller that only wants to know whether a
 * session is open (a screen on mount) does not create one by asking.
 */
export async function findOpenWorkout(_now: Date = new Date()): Promise<Workout | undefined> {
  const db = getDrizzle();
  const [mostRecent] = await db
    .select()
    .from(workouts)
    .where(
      and(eq(workouts.userId, LOCAL_USER_ID), isNull(workouts.deletedAt), isNull(workouts.finishedAt)),
    )
    .orderBy(desc(workouts.startedAt))
    .limit(1);

  return mostRecent;
}

/** Starts a session explicitly. Always creates — the caller checks findOpenWorkout first. */
export async function startWorkout(name: string | null = null, now: Date = new Date()): Promise<Workout> {
  const db = getDrizzle();
  const id = crypto.randomUUID();
  const nowIso = now.toISOString();
  await db
    .insert(workouts)
    .values({ id, userId: LOCAL_USER_ID, name, startedAt: nowIso, updatedAt: nowIso })
    .run();

  const created = await db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!created) throw new Error('failed to create workout row');
  return created;
}

/** Closes a session. After this it is no longer open, and the next set starts a new one. */
export async function finishWorkout(id: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  const nowIso = now.toISOString();
  await db.update(workouts).set({ finishedAt: nowIso, updatedAt: nowIso }).where(eq(workouts.id, id)).run();
}

/** Names a session. Separate from finishing, so a session can be named while it runs. */
export async function renameWorkout(id: string, name: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  await db
    .update(workouts)
    .set({ name: name.trim() || null, updatedAt: now.toISOString() })
    .where(eq(workouts.id, id))
    .run();
}

/**
 * The exercises a past session contained, in the order they were first worked.
 *
 * This is what "pick up a previous session" actually needs. Carrying only the
 * name across would leave the user re-adding the same five exercises by hand,
 * which is the friction the affordance exists to remove.
 *
 * It reads a workout that genuinely happened rather than a saved template —
 * NG3 rules out programme-template authoring for v1, and this stays the right
 * side of that line because there is nothing to author.
 */
export async function getWorkoutExerciseIds(workoutId: string): Promise<string[]> {
  const rows = await getSetsForWorkout(workoutId);
  const order: string[] = [];
  [...rows]
    .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
    .forEach((s) => {
      if (!order.includes(s.exerciseId)) order.push(s.exerciseId);
    });
  return order;
}

/**
 * Finished sessions, most recent first — the "repeat a previous session" list.
 * Excludes the open one, which the caller resumes rather than repeats.
 *
 * NG3 rules out program-template authoring for v1, so this is deliberately a
 * list of workouts that actually happened, not a routine library.
 */
export async function getRecentWorkouts(limit = 5): Promise<Workout[]> {
  const db = getDrizzle();
  return db
    .select()
    .from(workouts)
    .where(
      and(eq(workouts.userId, LOCAL_USER_ID), isNull(workouts.deletedAt), isNotNull(workouts.finishedAt)),
    )
    .orderBy(desc(workouts.startedAt))
    .limit(limit);
}

/**
 * Same rule as findOpenWorkout, but creates a workout when none is open.
 *
 * Kept as a fallback even though the UI starts sessions explicitly: a set must
 * always be storable (FR-LOG-4/NFR-1), so logging without having pressed start
 * writes the set into a fresh session rather than throwing it away.
 */
export async function getOrCreateOpenWorkout(now: Date = new Date()): Promise<Workout> {
  const existing = await findOpenWorkout(now);
  if (existing) return existing;
  return startWorkout(null, now);
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
      setType: input.setType ?? 'working',
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
 * The sets in the currently open session. Read-only: uses findOpenWorkout, so
 * visiting a screen without logging anything never creates a workout row.
 *
 * Named for the session rather than the day. It was `getTodaysSets` while a
 * session *was* a day; now that a session is "unfinished", one can legitimately
 * span midnight, and a name promising "today" would be wrong exactly when the
 * midnight bug used to bite.
 */
export async function getOpenSessionSets(now: Date = new Date()): Promise<LoggedSet[]> {
  const workout = await findOpenWorkout(now);
  if (!workout) return [];
  return getSetsForWorkout(workout.id);
}

import { eq, and, isNull, isNotNull, desc, gte } from 'drizzle-orm';
import { getDrizzle } from './client';
import { workouts, sets } from './schema';
import { LOCAL_USER_ID } from './user';
import { newId } from './id';
import { markPending } from '../sync/queue';

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
  const id = newId();
  const nowIso = now.toISOString();
  await db
    .insert(workouts)
    .values({ id, userId: LOCAL_USER_ID, name, startedAt: nowIso, updatedAt: nowIso })
    .run();

  const created = await db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!created) throw new Error('failed to create workout row');
  await markPending('workouts', id, now);
  return created;
}

/** Closes a session. After this it is no longer open, and the next set starts a new one. */
export async function finishWorkout(id: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  const nowIso = now.toISOString();
  await db.update(workouts).set({ finishedAt: nowIso, updatedAt: nowIso }).where(eq(workouts.id, id)).run();
  await markPending('workouts', id, now);
}

/** Names a session. Separate from finishing, so a session can be named while it runs. */
export async function renameWorkout(id: string, name: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  await db
    .update(workouts)
    .set({ name: name.trim() || null, updatedAt: now.toISOString() })
    .where(eq(workouts.id, id))
    .run();
  await markPending('workouts', id, now);
}

/**
 * Exercises worked most recently, most recent first — the picker's "recent"
 * section, which is what makes the common case need no typing at all.
 *
 * Reads across every session rather than the open one: the point is the fifteen
 * lifts you actually do, not what you happen to have touched today.
 */
export async function getRecentExerciseIds(limit = 6): Promise<string[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ exerciseId: sets.exerciseId, performedAt: sets.performedAt })
    .from(sets)
    .where(isNull(sets.deletedAt))
    .orderBy(desc(sets.performedAt))
    .limit(200);

  const seen: string[] = [];
  for (const r of rows) {
    if (!seen.includes(r.exerciseId)) seen.push(r.exerciseId);
    if (seen.length >= limit) break;
  }
  return seen;
}

export type TemplateSet = { weightKg: number; reps: number; setType: 'working' | 'warmup' };
export type SessionTemplate = { exerciseId: string; sets: TemplateSet[] }[];

/**
 * A past session's shape — its exercises in the order they were first worked,
 * each with the sets it actually contained.
 *
 * This is what "pick up a previous session" needs. Carrying the name alone
 * leaves you re-adding the same lifts by hand, and carrying only the exercises
 * still leaves you retyping every weight. What you want is last week's session
 * laid out again, unticked, ready to work through and adjust.
 *
 * It reads a workout that genuinely happened rather than a saved template, so
 * it stays the right side of NG3 (no programme-template authoring in v1) —
 * there is nothing here to author.
 */
export async function getWorkoutTemplate(workoutId: string): Promise<SessionTemplate> {
  const rows = [...(await getSetsForWorkout(workoutId))].sort((a, b) =>
    a.performedAt.localeCompare(b.performedAt),
  );

  const out: SessionTemplate = [];
  for (const s of rows) {
    let group = out.find((g) => g.exerciseId === s.exerciseId);
    if (!group) {
      group = { exerciseId: s.exerciseId, sets: [] };
      out.push(group);
    }
    group.sets.push({ weightKg: s.weightKg, reps: s.reps, setType: s.setType });
  }
  return out;
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
  const id = newId();
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
  await markPending('sets', id, now);
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

/**
 * Every non-deleted set performed at or after `sinceIso`, across all workouts.
 *
 * Weekly volume is a rolling window over every session, not today's — which is
 * also why the advice peek can be chosen from real data the moment a session
 * opens, before anything has been logged into it.
 */
export async function getSetsSince(sinceIso: string): Promise<LoggedSet[]> {
  const db = getDrizzle();
  return db
    .select()
    .from(sets)
    .where(and(isNull(sets.deletedAt), gte(sets.performedAt, sinceIso)));
}

/** Whether any non-deleted set exists, including sets outside trend windows. */
export async function hasLoggedSets(): Promise<boolean> {
  const db = getDrizzle();
  const row = await db
    .select({ id: sets.id })
    .from(sets)
    .where(isNull(sets.deletedAt))
    .limit(1)
    .get();
  return row !== undefined;
}

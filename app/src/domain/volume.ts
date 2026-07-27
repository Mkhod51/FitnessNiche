/**
 * volume.ts — weekly hard sets per muscle, fractionally counted.
 *
 * GR-4: this returns population-comparable counts only. It must never compute,
 * infer, or expose an individualized MEV/MRV — the ~10-20 sets/muscle/week
 * range is a population reference to be rendered as such by the caller, not a
 * personal target derived here.
 */

import type { exercises } from '../db/schema';
import type { LoggedSet } from '../db/workouts';

export type ExerciseRow = typeof exercises.$inferSelect;

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

/**
 * Sums each set's exercise contributions into a per-muscle total for the
 * 7-day window starting at `weekStart` (inclusive start, exclusive end).
 * Soft-deleted sets and sets outside the window are excluded. A muscle with
 * no work in the window is absent from the result rather than present as 0.
 */
export function weeklySetsByMuscle(
  loggedSets: LoggedSet[],
  exerciseRows: ExerciseRow[],
  weekStart: string,
): Record<string, number> {
  const exercisesById = new Map(exerciseRows.map((e) => [e.id, e]));
  const windowStart = new Date(weekStart).getTime();
  const windowEnd = windowStart + MS_PER_WEEK;

  const totals: Record<string, number> = {};

  for (const s of loggedSets) {
    if (s.deletedAt) continue;
    const performedAt = new Date(s.performedAt).getTime();
    if (performedAt < windowStart || performedAt >= windowEnd) continue;

    const exercise = exercisesById.get(s.exerciseId);
    if (!exercise) continue;

    for (const [muscle, fraction] of Object.entries(exercise.contributions)) {
      totals[muscle] = (totals[muscle] ?? 0) + fraction;
    }
  }

  return totals;
}

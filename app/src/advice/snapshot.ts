/**
 * snapshot.ts — FR-ADV-4 / AC-3. Where advice stops being static.
 *
 * Until this existed the session snapshot was hand-filled with placeholders —
 * `deficitWeeks: 0`, `weightTrend: 'unknown'`, `e1rmTrend: 'insufficient_data'`
 * — so every claim that predicates on the lifter's own state was permanently
 * unable to fire. The claim base could only ever produce rule-triggered advice.
 * This builds the same snapshot from what the lifter actually logged, which is
 * the whole of the difference between "advice" and "data-earned advice".
 *
 * It is deliberately thin: `reconcile()` owns the judgement and the honesty,
 * this owns the plumbing. Nothing here decides what a trend means.
 */

import { reconcile, type Reconciliation } from '../domain/reconcile';
import { setE1rm } from '../domain/e1rm';
import { weeklySetsByMuscle } from '../domain/volume';
import type { UserStateSnapshot } from './types';
import type { LoggedSet } from '../db/workouts';
import type { WeightReading } from '../db/weights';
import type { ExerciseRow } from '../domain/volume';

const MS_PER_DAY = 86_400_000;

export interface SnapshotSources {
  goal: 'cut' | 'bulk' | 'maintain';
  numbersHidden: boolean;
  /** Null means unknown, never "now" — see 0004_goal_clock.sql. */
  goalStartedAt: string | null;
  weights: WeightReading[];
  /** Every set in the reconciliation window, ascending by performedAt. */
  sets: LoggedSet[];
  exercises: ExerciseRow[];
  proteinPerKg7d: number | null;
  now?: Date;
}

/**
 * One e1RM point per session per exercise, from qualifying sets only.
 *
 * FR-SIG-1 does the filtering inside `setE1rm` — RIR ≤ 3, reps ≤ 10, RIR
 * present — so a non-qualifying set returns null and simply never becomes a
 * point. Grouping by day-and-exercise and taking the best is what makes this a
 * session series rather than a set series: five sets of bench in one session are
 * one observation of that day's strength, not five, and treating them as five
 * would quietly quintuple the apparent sample the regression is fitted on.
 */
export function sessionE1rmPoints(sets: LoggedSet[]): { date: string; e1rm: number }[] {
  const best = new Map<string, { date: string; e1rm: number }>();

  for (const s of sets) {
    if (s.rir === null) continue;
    const value = setE1rm(s.weightKg, s.reps, s.rir);
    if (value === null) continue;

    const day = s.performedAt.slice(0, 10);
    const key = `${day}::${s.exerciseId}`;
    const existing = best.get(key);
    if (!existing || value > existing.e1rm) best.set(key, { date: s.performedAt, e1rm: value });
  }

  return [...best.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * The strongest lift to reconcile against.
 *
 * One exercise, not a pooled average across all of them: e1RM is normalised
 * per-lift as %/week, and averaging a bench trend with a curl trend produces a
 * number that describes neither. The exercise with the most qualifying sessions
 * wins, because that is the one whose regression has the tightest interval —
 * picking the heaviest or the favourite would optimise for drama over
 * resolution.
 */
export function primaryLift(points: Map<string, { date: string; e1rm: number }[]>): string | null {
  let bestId: string | null = null;
  let bestCount = 0;
  for (const [id, series] of points) {
    if (series.length > bestCount) {
      bestCount = series.length;
      bestId = id;
    }
  }
  return bestId;
}

function byExercise(sets: LoggedSet[]): Map<string, { date: string; e1rm: number }[]> {
  const groups = new Map<string, LoggedSet[]>();
  for (const s of sets) {
    const list = groups.get(s.exerciseId) ?? [];
    list.push(s);
    groups.set(s.exerciseId, list);
  }
  const out = new Map<string, { date: string; e1rm: number }[]>();
  for (const [id, list] of groups) {
    const points = sessionE1rmPoints(list);
    if (points.length > 0) out.set(id, points);
  }
  return out;
}

export interface BuiltSnapshot {
  snapshot: UserStateSnapshot;
  reconciliation: Reconciliation;
  /** Which lift the strength half was read from, so the UI can name it. */
  primaryExerciseId: string | null;
}

export function buildSnapshot(sources: SnapshotSources): BuiltSnapshot {
  const now = sources.now ?? new Date();

  const goalWeeks =
    sources.goalStartedAt === null
      ? 0
      : Math.max(0, Math.floor((now.getTime() - new Date(sources.goalStartedAt).getTime()) / MS_PER_DAY / 7));

  const perLift = byExercise(sources.sets);
  const primaryExerciseId = primaryLift(perLift);
  const e1rmPoints = primaryExerciseId ? (perLift.get(primaryExerciseId) ?? []) : [];

  const reconciliation = reconcile({
    goal: sources.goal,
    weights: sources.weights.map((w) => ({ date: w.measuredAt, value: w.valueKg })),
    e1rmPoints,
    goalWeeks,
  });

  const windowStart = new Date(now.getTime() - 7 * MS_PER_DAY).toISOString();

  return {
    primaryExerciseId,
    reconciliation,
    snapshot: {
      goal: sources.goal,
      // Straight from the reconciler, never recomputed here — a second opinion
      // on the same numbers is how two answers to one question get shipped.
      deficitWeeks: reconciliation.deficitWeeks,
      weightTrend: reconciliation.weightTrend,
      e1rmTrend: reconciliation.e1rmTrend,
      weeklySetsByMuscle: weeklySetsByMuscle(sources.sets, sources.exercises, windowStart),
      proteinPerKg7d: sources.proteinPerKg7d,
      numbersHidden: sources.numbersHidden,
    },
  };
}

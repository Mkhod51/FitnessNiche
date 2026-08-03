/**
 * reconcile.ts — FR-SIG-5. The one thing neither incumbent can do.
 *
 * MacroFactor adjusts calories from the weight trend and cannot see whether
 * strength is falling; RP and Hevy see training and not intake. The
 * reconciliation between the two is currently done in the lifter's head, across
 * two subscriptions. This module is that reconciliation.
 *
 * **What makes this more than two overlaid charts (OQ-4).** Two charts show two
 * lines and leave the interaction to the reader. This states the interaction —
 * and, more importantly, states when the interaction *cannot be resolved*. A
 * chart of four noisy sessions still draws a confident-looking line; this
 * returns `unresolved: ['strength']` and refuses the verdict. Naming what it
 * cannot see is the part a chart structurally cannot do.
 *
 * **On thresholds.** GR-4 forbids invented precision, and that constrains this
 * module hard. No rate-of-loss boundary is evidenced anywhere in this repo, so
 * none is invented here: the verdict never rests on "you are losing faster than
 * X kg/week". What it rests on instead is the lifter's OWN regression — a
 * strength trend is only called falling when its 95% interval excludes zero,
 * which is measured, not assumed. The only cutoffs below are data-sufficiency
 * ones (how many readings, over how long), which are claims about evidence
 * available rather than about physiology.
 *
 * Pure: no I/O, no clock, no randomness.
 */

import { ewma, type TrendPoint } from './trends';
import { e1rmTrend } from './e1rm';

const MS_PER_DAY = 86_400_000;

export type Goal = 'cut' | 'bulk' | 'maintain';

export type VerdictId =
  /** The goal is doing what it should, and strength is not being paid for it. */
  | 'on_track'
  /** Cutting, and the strength trend is measurably going backwards. */
  | 'ease_the_deficit'
  /** Cutting, but the scale is not moving — the deficit is not landing. */
  | 'not_landing'
  /** Bulking or maintaining while strength falls: not a deficit problem. */
  | 'strength_falling'
  /** Maintenance, and everything is where it should be. */
  | 'holding_maintenance'
  /** Not enough resolvable signal to say anything honest. */
  | 'unresolved';

/** What the verdict could not see. Machine keys — the UI owns the words. */
export type UnresolvedSignal = 'weight' | 'strength';

export interface ReconcileInput {
  goal: Goal;
  /** Raw bodyweight readings, ascending by date. Smoothed here, never by the caller. */
  weights: TrendPoint[];
  /** Qualifying per-session e1RM points (RIR ≤ 3, reps ≤ 10), ascending. */
  e1rmPoints: { date: string; e1rm: number }[];
  /** How many weeks the current goal has been in force. */
  goalWeeks: number;
}

export interface Reconciliation {
  verdict: VerdictId;
  confidence: 'high' | 'moderate' | 'low';
  /** Snapshot-compatible, so the claim engine reads these directly. */
  weightTrend: 'down_fast' | 'down' | 'flat' | 'up' | 'unknown';
  e1rmTrend: 'up' | 'holding' | 'down' | 'insufficient_data';
  /** Zero unless the goal is actually a cut — the deficit claims predicate on it. */
  deficitWeeks: number;
  unresolved: UnresolvedSignal[];
  /** Measured facts for the "why now" line. Numbers only; never prose. */
  observed: {
    weightKgPerWeek: number | null;
    e1rmPctPerWeek: number | null;
    e1rmCi95: [number, number] | null;
    e1rmWithinNoise: boolean | null;
    windowDays: number;
    weighIns: number;
    e1rmSessions: number;
  };
}

/**
 * Half-life for the bodyweight EWMA. Day-to-day scale readings swing 1-2 kg on
 * water, food and sodium (research: science-based-training-evidence §body-
 * composition), so the smoothing has to be slow enough to outlast that without
 * being so slow it lags a real change by a fortnight.
 */
const WEIGHT_HALF_LIFE_DAYS = 7;

/**
 * The research puts the floor for a meaningful bodyweight trend at 2-4 weeks of
 * smoothed readings. Below the first, a direction is not claimed at all; below
 * the second, it is claimed only at reduced confidence.
 */
const MIN_WINDOW_DAYS = 14;
const CONFIDENT_WINDOW_DAYS = 28;

/** Two readings cannot establish a direction that survives 1-2 kg of daily noise. */
const MIN_WEIGH_INS = 4;
const CONFIDENT_WEIGH_INS = 8;

/**
 * Below this the smoothed series is treated as flat.
 *
 * This is NOT a physiological threshold and carries no claim about what rate is
 * healthy or effective — it is an instrument resolution limit. Daily readings
 * swing 1-2 kg, and a 7-day-half-life EWMA over a fortnight cannot separate a
 * slope this small from that noise, so reporting its sign would be reporting
 * the noise. Named for what it is so it is not mistaken for advice.
 */
const WEIGHT_RESOLUTION_KG_PER_WEEK = 0.1;

function spanDays(dates: string[]): number {
  if (dates.length < 2) return 0;
  const times = dates.map((d) => new Date(d).getTime());
  return (Math.max(...times) - Math.min(...times)) / MS_PER_DAY;
}

/**
 * Slope of the smoothed bodyweight series, in kg/week.
 *
 * Taken end-to-end across the EWMA rather than by regressing the raw readings:
 * the smoothing is what makes the series meaningful in the first place
 * (FR-SIG-4), and the endpoints of a decayed series already carry the whole
 * window's weight.
 */
function smoothedRateKgPerWeek(weights: TrendPoint[]): number | null {
  if (weights.length < MIN_WEIGH_INS) return null;
  const days = spanDays(weights.map((w) => w.date));
  if (days < MIN_WINDOW_DAYS) return null;

  const smoothed = ewma(weights, WEIGHT_HALF_LIFE_DAYS);
  const first = smoothed[0];
  const last = smoothed[smoothed.length - 1];
  const elapsed = (new Date(last.date).getTime() - new Date(first.date).getTime()) / MS_PER_DAY;
  if (elapsed <= 0) return null;

  return ((last.value - first.value) / elapsed) * 7;
}

export function reconcile(input: ReconcileInput): Reconciliation {
  const { goal, weights, e1rmPoints, goalWeeks } = input;
  const unresolved: UnresolvedSignal[] = [];

  // ---- the weight half -----------------------------------------------------
  const kgPerWeek = smoothedRateKgPerWeek(weights);
  let weightTrend: Reconciliation['weightTrend'];
  if (kgPerWeek === null) {
    weightTrend = 'unknown';
    unresolved.push('weight');
  } else if (Math.abs(kgPerWeek) < WEIGHT_RESOLUTION_KG_PER_WEEK) {
    weightTrend = 'flat';
  } else {
    // Never `down_fast`: see the module note. There is no evidenced boundary
    // between "down" and "down too fast", so the app does not pretend to one.
    weightTrend = kgPerWeek < 0 ? 'down' : 'up';
  }

  // ---- the strength half ---------------------------------------------------
  const trend = e1rmTrend(e1rmPoints);
  let e1rm: Reconciliation['e1rmTrend'];
  if (trend === 'insufficient_data') {
    e1rm = 'insufficient_data';
    unresolved.push('strength');
  } else if (trend.withinNoise) {
    // The interval spans zero: no detectable change. That IS "holding", and it
    // is exactly the epistemic footing c-strength-holds-through-a-deficit
    // stands on — a non-significant result, not a demonstrated equivalence.
    e1rm = 'holding';
  } else {
    e1rm = trend.slopePctPerWeek < 0 ? 'down' : 'up';
  }

  // ---- the verdict ---------------------------------------------------------
  // Falling strength outranks everything else it could be paired with: it is
  // the harm, and any other reading would be advice given over the top of it.
  let verdict: VerdictId;
  if (weightTrend === 'unknown' && e1rm === 'insufficient_data') {
    verdict = 'unresolved';
  } else if (e1rm === 'down') {
    verdict = goal === 'cut' ? 'ease_the_deficit' : 'strength_falling';
  } else if (goal === 'cut') {
    // `on_track` is a claim about the INTERACTION — the scale is moving and
    // strength is not paying for it. The second clause needs a resolvable
    // strength trend, so an unresolved one withholds the verdict rather than
    // letting a clean weight line carry it. The caller still gets weightTrend
    // and the observed numbers, so what IS known stays sayable.
    if (weightTrend === 'flat' || weightTrend === 'up') verdict = 'not_landing';
    else if (weightTrend === 'down') verdict = e1rm === 'insufficient_data' ? 'unresolved' : 'on_track';
    else verdict = 'unresolved';
  } else if (goal === 'bulk') {
    if (weightTrend === 'unknown') verdict = 'unresolved';
    else if (weightTrend !== 'up') verdict = 'not_landing';
    else verdict = e1rm === 'insufficient_data' ? 'unresolved' : 'on_track';
  } else {
    if (weightTrend === 'unknown') verdict = 'unresolved';
    else if (weightTrend === 'flat') verdict = e1rm === 'insufficient_data' ? 'unresolved' : 'holding_maintenance';
    else verdict = 'not_landing';
  }

  // ---- confidence ----------------------------------------------------------
  // Tracks the evidence available, never the strength of the verdict. Anything
  // unresolved caps it: a verdict resting on half the picture is not a
  // confident one however clean that half looks.
  const windowDays = Math.max(spanDays(weights.map((w) => w.date)), spanDays(e1rmPoints.map((p) => p.date)));
  let confidence: Reconciliation['confidence'];
  if (unresolved.length > 0) {
    confidence = windowDays >= MIN_WINDOW_DAYS ? 'moderate' : 'low';
  } else if (windowDays >= CONFIDENT_WINDOW_DAYS && weights.length >= CONFIDENT_WEIGH_INS) {
    confidence = 'high';
  } else if (windowDays >= MIN_WINDOW_DAYS) {
    confidence = 'moderate';
  } else {
    confidence = 'low';
  }

  return {
    verdict,
    confidence,
    weightTrend,
    e1rmTrend: e1rm,
    // A bulk has served no time in a deficit, and the deficit claims predicate
    // on this — reporting the goal's age regardless would fire them wrongly.
    deficitWeeks: goal === 'cut' ? goalWeeks : 0,
    unresolved,
    observed: {
      weightKgPerWeek: kgPerWeek,
      e1rmPctPerWeek: trend === 'insufficient_data' ? null : trend.slopePctPerWeek,
      e1rmCi95: trend === 'insufficient_data' ? null : trend.ci95,
      e1rmWithinNoise: trend === 'insufficient_data' ? null : trend.withinNoise,
      windowDays,
      weighIns: weights.length,
      e1rmSessions: e1rmPoints.length,
    },
  };
}

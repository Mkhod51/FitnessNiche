/**
 * trends.ts — smoothing, so a number is allowed to mean something.
 *
 * FR-SIG-4/T3: raw daily bodyweight is never the signal. Day-to-day scale
 * readings swing on hydration, glycogen and gut contents, and the research
 * (science-based-training-evidence.md, §body-composition) finds that
 * real-world biological noise "swamps that instrument precision" — trend data
 * is only usable over roughly a 4-8 week window, and only once smoothed.
 * Pure: no I/O, no date library, no randomness.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TrendPoint {
  date: string;
  value: number;
}

/**
 * Exponentially-weighted moving average over irregularly-spaced readings.
 *
 * The weighting is driven by *elapsed time*, not by array position. People skip
 * weigh-ins, and an index-based EWMA would treat a fortnight's gap exactly like
 * an overnight one — which would make `halfLifeDays` a lie. Using the real gap
 * is what lets the name mean what it says: after `halfLifeDays`, half of the
 * older reading's influence has decayed away.
 *
 * Input is assumed already sorted ascending by date. It is deliberately not
 * sorted defensively here — silently reordering a caller's series would hide a
 * real bug upstream rather than surface it.
 *
 * Output is one point per input point, dates preserved and in input order. No
 * resampling onto a daily grid and no interpolation across gaps: inventing
 * readings the user never took is exactly the fabricated precision GR-4 forbids.
 */
export function ewma(points: TrendPoint[], halfLifeDays: number): TrendPoint[] {
  // A non-positive half-life has no meaning — zero would divide by zero and a
  // negative one would amplify old readings instead of decaying them. Throwing
  // beats returning something that looks like a trend but isn't one.
  if (!(halfLifeDays > 0)) {
    throw new Error(`halfLifeDays must be greater than 0, got ${halfLifeDays}`);
  }
  if (points.length === 0) return [];

  const decayPerDay = Math.LN2 / halfLifeDays;

  // The first reading has nothing prior to blend with, so it is its own
  // smoothed value.
  let smoothed = points[0].value;
  let previousTime = new Date(points[0].date).getTime();
  const out: TrendPoint[] = [{ date: points[0].date, value: smoothed }];

  for (let i = 1; i < points.length; i++) {
    const time = new Date(points[i].date).getTime();
    const deltaDays = (time - previousTime) / MS_PER_DAY;
    // Two readings on the same day give alpha 0, which keeps the earlier
    // smoothed value rather than dividing by a zero gap.
    const alpha = 1 - Math.exp(-Math.max(deltaDays, 0) * decayPerDay);

    smoothed = smoothed + alpha * (points[i].value - smoothed);
    previousTime = time;
    out.push({ date: points[i].date, value: smoothed });
  }

  return out;
}

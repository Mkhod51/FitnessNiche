/**
 * e1rm.ts — the honest 1RM signal.
 *
 * T3/GR-4/FR-SIG-1/FR-SIG-2 (measurement honesty): a single e1RM reading is
 * close to meaningless on its own -- CV ~5-10%, single-test MDC ~10kg squat /
 * ~5.6kg bench (science-based-training-evidence.md §1-2, §5). The only
 * defensible signal is a many-point regression, and even that must be able
 * to admit it can't separate real progress from noise. Pure: no I/O, no date
 * library, no randomness -- same input, same output, always.
 */

// FR-SIG-1: formulas (Epley/Brzycki/Lombardi) hold to ~±5% through 10 reps
// but commonly diverge ±15-20% beyond it (evidence doc §3, "Formula
// divergence by rep count"). RIR self-report is accurate to ~1 rep near
// failure (RIR 0-2) but degrades to >2 reps of error out at RIR 7-10
// (evidence doc §"RIR estimation accuracy"); RIR ≤3 is where that error is
// still small relative to the estimate. Both bounds inclusive per spec.
const MAX_QUALIFYING_REPS = 10;
const MAX_QUALIFYING_RIR = 3;

// Epley's per-rep scaling factor (evidence doc §3).
const EPLEY_DENOMINATOR = 30;

export function setE1rm(weightKg: number, reps: number, rir: number): number | null {
  if (weightKg <= 0 || reps <= 0 || rir < 0) return null;
  if (reps > MAX_QUALIFYING_REPS || rir > MAX_QUALIFYING_RIR) return null;

  // Effective reps = reps performed + reps left in reserve: the total reps
  // the set would have reached at true failure, which is the quantity Epley
  // actually estimates from. Subtracting 1 anchors a true single (reps=1,
  // rir=0) to exactly its own weight -- plain Epley (weight*(1+reps/30))
  // returns weight*31/30 for a single, which is fabricated precision at the
  // one case where the true 1RM is already known exactly.
  const effectiveReps = reps + rir;
  return weightKg * (1 + (effectiveReps - 1) / EPLEY_DENOMINATOR);
}

// A regression only earns its keep once there are enough points for the
// √n noise reduction to matter: the research puts that around n≈8, where
// trend SEM drops to ~1-3.5% of 1RM (evidence doc §5). Two widely-spaced
// readings are exactly the point-to-point comparison the research says
// cannot separate 4-8 weeks of real progress (~0.5-5kg on a 100kg squat)
// from a single-test MDC of ~10kg -- so anything short of that threshold
// is 'insufficient_data', not a confident-looking guess.
const MIN_TREND_POINTS = 8;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Two-tailed 97.5th-percentile Student's t critical values (95% CI), indexed
// by degrees of freedom (df = n - 2 for a simple linear regression slope).
// Standard statistical table values, not a fabricated constant.
const T_TABLE_DF_1_TO_30 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11,
  2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

function tCritical95(df: number): number {
  if (df >= 1 && df <= 30) return T_TABLE_DF_1_TO_30[df - 1];
  // t -> z as df grows; past df=30 the gap to 1.96 is under 1%.
  return 1.96;
}

export function e1rmTrend(
  points: { date: string; e1rm: number }[]
):
  | { slopePctPerWeek: number; ci95: [number, number]; withinNoise: boolean; band: { date: string; lo: number; hi: number }[] }
  | 'insufficient_data' {
  if (points.length < MIN_TREND_POINTS) return 'insufficient_data';

  const n = points.length;
  const x0 = new Date(points[0].date).getTime();
  const xs = points.map((p) => (new Date(p.date).getTime() - x0) / MS_PER_DAY); // days since first point, in input order
  const ys = points.map((p) => p.e1rm);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  const sxx = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  // Every point on the same day -- nothing to regress a slope against.
  if (sxx === 0) return 'insufficient_data';

  const sxy = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
  const slope = sxy / sxx; // kg per day
  const intercept = meanY - slope * meanX; // fitted value at the series' start

  const sse = xs.reduce((sum, x, i) => sum + (ys[i] - (intercept + slope * x)) ** 2, 0);
  const df = n - 2;
  const mse = sse / df;
  const seSlope = Math.sqrt(mse / sxx);
  const t = tCritical95(df);

  // %/week normalises against the fitted starting value so the same absolute
  // kg/week reads differently for a 60kg lift than a 200kg lift -- the whole
  // point of reporting it as a percentage.
  const toPctPerWeek = (kgPerDay: number) => (kgPerDay * 7 * 100) / intercept;

  const slopePctPerWeek = toPctPerWeek(slope);
  const marginPctPerWeek = toPctPerWeek(t * seSlope);
  const ci95: [number, number] = [slopePctPerWeek - marginPctPerWeek, slopePctPerWeek + marginPctPerWeek];

  // FR-SIG-2: the interval spanning zero IS "we cannot tell this apart from
  // no change" -- that's the noise-floor gate the whole module exists for.
  const withinNoise = ci95[0] <= 0 && ci95[1] >= 0;

  // Per-point 95% band for the fitted line (standard OLS prediction-of-the-
  // mean interval), in input order.
  const band = points.map((p, i) => {
    const x = xs[i];
    const fitted = intercept + slope * x;
    const seFit = Math.sqrt(mse * (1 / n + (x - meanX) ** 2 / sxx));
    const margin = t * seFit;
    return { date: p.date, lo: fitted - margin, hi: fitted + margin };
  });

  return { slopePctPerWeek, ci95, withinNoise, band };
}

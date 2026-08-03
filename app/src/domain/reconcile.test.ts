import { describe, it, expect } from 'vitest';
import { reconcile, type ReconcileInput } from './reconcile';

const DAY = 86_400_000;

/** Weigh-ins every `stepDays`, walking from `startKg` by `kgPerWeek`, plus optional noise. */
function weightSeries(
  startKg: number,
  kgPerWeek: number,
  weeks: number,
  { stepDays = 2, noise = 0 }: { stepDays?: number; noise?: number } = {},
): { date: string; value: number }[] {
  const t0 = new Date('2026-05-01T08:00:00.000Z').getTime();
  const out = [];
  for (let d = 0; d <= weeks * 7; d += stepDays) {
    // Deterministic pseudo-noise, so a "noisy" series is still reproducible.
    const wobble = noise === 0 ? 0 : Math.sin(d * 1.7) * noise;
    out.push({ date: new Date(t0 + d * DAY).toISOString(), value: startKg + (kgPerWeek * d) / 7 + wobble });
  }
  return out;
}

/** One qualifying e1RM per session, drifting by `pctPerWeek`. */
function e1rmSeries(startKg: number, pctPerWeek: number, weeks: number, sessionsPerWeek = 3) {
  const t0 = new Date('2026-05-01T10:00:00.000Z').getTime();
  const stepDays = 7 / sessionsPerWeek;
  const out = [];
  for (let d = 0; d <= weeks * 7; d += stepDays) {
    out.push({ date: new Date(t0 + d * DAY).toISOString(), e1rm: startKg * (1 + (pctPerWeek / 100) * (d / 7)) });
  }
  return out;
}

const base: ReconcileInput = {
  goal: 'cut',
  weights: weightSeries(80, -0.4, 8),
  e1rmPoints: e1rmSeries(100, 0, 8),
  goalWeeks: 8,
};

describe('reconcile — the honest half', () => {
  it('refuses a verdict when there is nothing to reconcile', () => {
    const r = reconcile({ goal: 'cut', weights: [], e1rmPoints: [], goalWeeks: 0 });
    expect(r.verdict).toBe('unresolved');
    expect(r.confidence).toBe('low');
    expect(r.unresolved).toEqual(expect.arrayContaining(['weight', 'strength']));
  });

  // The whole point of FR-SIG-2 and T3: below the noise floor the app says so
  // rather than drawing a confident line. A verdict that quietly treats
  // "not enough sessions" as "your strength is fine" is the exact dishonesty
  // this product exists to refuse.
  it('never reports a strength direction it cannot resolve', () => {
    const r = reconcile({ ...base, e1rmPoints: e1rmSeries(100, 0, 1, 2) }); // 3 points, under the regression minimum
    expect(r.e1rmTrend).toBe('insufficient_data');
    expect(r.unresolved).toContain('strength');
    expect(r.observed.e1rmPctPerWeek).toBeNull();
  });

  // "On track" in a cut is a claim about the INTERACTION — the scale is moving
  // and strength is not paying for it. With the strength half unresolvable the
  // second clause is unknown, so the verdict is not available however clean the
  // weight trend looks. Saying it anyway would be the two-overlaid-charts
  // failure OQ-4 names, arriving as a confident sentence instead of a chart.
  it('will not call a cut on track while the strength half is unresolvable', () => {
    const r = reconcile({ ...base, e1rmPoints: e1rmSeries(100, 0, 1, 4) }); // 5 points, under the minimum
    expect(r.e1rmTrend).toBe('insufficient_data');
    expect(r.unresolved).toContain('strength');
    expect(r.verdict).toBe('unresolved');
    // The half it CAN see is still reported, so the UI can say what is known.
    expect(r.weightTrend).toBe('down');
    expect(r.observed.weightKgPerWeek).toBeLessThan(0);
  });

  it('reports weight as unknown when there are too few weigh-ins to smooth', () => {
    const r = reconcile({ ...base, weights: weightSeries(80, -0.4, 0, { stepDays: 2 }) }); // a single reading
    expect(r.weightTrend).toBe('unknown');
    expect(r.unresolved).toContain('weight');
    expect(r.observed.weightKgPerWeek).toBeNull();
  });
});

describe('reconcile — the cut matrix', () => {
  it('calls a cut on track when weight is coming down and strength holds', () => {
    const r = reconcile(base);
    expect(r.weightTrend).toBe('down');
    expect(r.e1rmTrend).toBe('holding');
    expect(r.verdict).toBe('on_track');
    expect(r.unresolved).not.toContain('strength');
  });

  // The failure this engine exists to catch, and the one neither incumbent can
  // see: the scale is moving and the lifter is paying for it in strength.
  it('says to ease the deficit when strength is measurably falling', () => {
    const r = reconcile({ ...base, e1rmPoints: e1rmSeries(100, -1.2, 8) });
    expect(r.e1rmTrend).toBe('down');
    expect(r.verdict).toBe('ease_the_deficit');
  });

  it('says the deficit is not landing when the weight trend is flat', () => {
    const r = reconcile({ ...base, weights: weightSeries(80, 0, 8) });
    expect(r.weightTrend).toBe('flat');
    expect(r.verdict).toBe('not_landing');
  });

  // Strength falling outranks a flat scale: losing strength is the harm, and
  // "your deficit isn't landing" would be the wrong thing to say to someone
  // already going backwards.
  it('ranks falling strength above a flat scale', () => {
    const r = reconcile({
      ...base,
      weights: weightSeries(80, 0, 8),
      e1rmPoints: e1rmSeries(100, -1.2, 8),
    });
    expect(r.verdict).toBe('ease_the_deficit');
  });
});

describe('reconcile — the other goals', () => {
  it('calls a bulk on track when weight is rising and strength is not falling', () => {
    const r = reconcile({ ...base, goal: 'bulk', weights: weightSeries(80, 0.2, 8) });
    expect(r.weightTrend).toBe('up');
    expect(r.verdict).toBe('on_track');
  });

  it('flags a bulk where strength is falling despite the weight going up', () => {
    const r = reconcile({
      ...base,
      goal: 'bulk',
      weights: weightSeries(80, 0.2, 8),
      e1rmPoints: e1rmSeries(100, -1.2, 8),
    });
    expect(r.verdict).toBe('strength_falling');
  });

  it('calls maintenance held when nothing is moving', () => {
    const r = reconcile({ ...base, goal: 'maintain', weights: weightSeries(80, 0, 8) });
    expect(r.verdict).toBe('holding_maintenance');
  });
});

describe('reconcile — confidence tracks the evidence, not the verdict', () => {
  it('is high only with a long, well-populated window', () => {
    expect(reconcile(base).confidence).toBe('high');
  });

  it('drops when the window is too short to smooth a bodyweight trend', () => {
    // The research puts the floor for a meaningful bodyweight trend at 2-4
    // weeks; one week of readings cannot earn "high" however many there are.
    const r = reconcile({
      goal: 'cut',
      weights: weightSeries(80, -0.4, 1, { stepDays: 1 }),
      e1rmPoints: e1rmSeries(100, 0, 1, 8),
      goalWeeks: 1,
    });
    expect(r.confidence).not.toBe('high');
  });

  it('never reports high confidence while something is unresolved', () => {
    const r = reconcile({ ...base, e1rmPoints: [] });
    expect(r.unresolved).toContain('strength');
    expect(r.confidence).not.toBe('high');
  });
});

describe('reconcile — snapshot compatibility', () => {
  // GR-4: `down_fast` needs a rate-of-loss boundary, and no such threshold is
  // evidenced anywhere in this repo. Emitting one would be exactly the invented
  // precision the product refuses, so the value is deliberately never produced.
  it('never emits down_fast, because no evidenced threshold defines it', () => {
    for (const kgPerWeek of [-0.2, -0.5, -1.0, -2.0, -4.0]) {
      const r = reconcile({ ...base, weights: weightSeries(80, kgPerWeek, 8) });
      expect(r.weightTrend).toBe('down');
    }
  });

  it('produces values the claim engine can read directly', () => {
    const r = reconcile(base);
    expect(['down_fast', 'down', 'flat', 'up', 'unknown']).toContain(r.weightTrend);
    expect(['up', 'holding', 'down', 'insufficient_data']).toContain(r.e1rmTrend);
    expect(r.deficitWeeks).toBe(8);
  });

  it('reports deficitWeeks as zero for a goal that is not a cut', () => {
    // `deficitWeeks` is what the deficit claims predicate on, so a bulk must not
    // report time-in-deficit it has not served.
    expect(reconcile({ ...base, goal: 'bulk' }).deficitWeeks).toBe(0);
  });
});

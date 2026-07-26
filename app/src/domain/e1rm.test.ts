import { describe, it, expect } from 'vitest';
import { setE1rm, e1rmTrend } from './e1rm';

// Builds an ISO date string `dayOffset` days after 2026-01-01, without
// pulling in a date library -- native Date is enough for this.
function isoDate(dayOffset: number): string {
  const d = new Date('2026-01-01T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

// A deterministic synthetic e1RM series: a straight-line trend (weeklyKg per
// week) plus a fixed, repeating noise pattern -- no Math.random, so a failing
// test is reproducible and not a flake.
function series(params: {
  n: number;
  spacingDays: number;
  startKg: number;
  weeklyKg: number;
  noise: number[];
}): { date: string; e1rm: number }[] {
  const { n, spacingDays, startKg, weeklyKg, noise } = params;
  return Array.from({ length: n }, (_, i) => {
    const dayOffset = i * spacingDays;
    const trendValue = startKg + (weeklyKg * dayOffset) / 7;
    const e1rm = trendValue + noise[i % noise.length];
    return { date: isoDate(dayOffset), e1rm };
  });
}

describe('setE1rm', () => {
  it('returns null for reps > 10 (formulas diverge ±15-20% beyond 10 reps)', () => {
    expect(setE1rm(100, 11, 0)).toBeNull();
  });

  it('returns null for rir > 3 (RIR self-report degrades past 2 reps of error beyond RIR ~2-3)', () => {
    expect(setE1rm(100, 5, 4)).toBeNull();
  });

  it('returns a number at the reps === 10 boundary (inclusive)', () => {
    const result = setE1rm(100, 10, 0);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });

  it('returns a number at the rir === 3 boundary (inclusive)', () => {
    const result = setE1rm(100, 5, 3);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });

  it('agrees on effective reps: 5 reps @ RIR 0 equals 3 reps @ RIR 2 (both 5 effective reps)', () => {
    // Published Epley on effective reps: 100 * (1 + 5/30) = 116.67, not a shifted
    // variant. Pinned against the literal formula so a future "smoothing" of the
    // curve cannot silently move every estimate while still calling itself Epley.
    const expected = 100 * (1 + 5 / 30);
    expect(expected).toBeCloseTo(116.667, 3);
    expect(setE1rm(100, 5, 0)).toBe(expected);
    expect(setE1rm(100, 3, 2)).toBe(expected);
  });

  it('a true single is its own 1RM exactly', () => {
    // A performed single is measured, not estimated, so it is returned exactly
    // rather than run through Epley (which would report 103.3 for a 100kg single).
    expect(setE1rm(100, 1, 0)).toBe(100);
    expect(setE1rm(62.5, 1, 0)).toBe(62.5);
    // ...and the seam is deliberate: two effective reps is an estimate again.
    expect(setE1rm(100, 2, 0)).toBe(100 * (1 + 2 / 30));
    expect(setE1rm(100, 1, 1)).toBe(100 * (1 + 2 / 30));
  });

  it('rejects zero or negative weight', () => {
    expect(setE1rm(0, 5, 0)).toBeNull();
    expect(setE1rm(-10, 5, 0)).toBeNull();
  });

  it('rejects zero or negative reps', () => {
    expect(setE1rm(100, 0, 0)).toBeNull();
    expect(setE1rm(100, -1, 0)).toBeNull();
  });

  it('rejects negative RIR', () => {
    expect(setE1rm(100, 5, -1)).toBeNull();
  });
});

describe('e1rmTrend', () => {
  it("returns 'insufficient_data' below the minimum point count", () => {
    const points = series({ n: 7, spacingDays: 3, startKg: 100, weeklyKg: 2, noise: [0] });
    expect(e1rmTrend(points)).toBe('insufficient_data');
  });

  it("returns 'insufficient_data' for two widely-spaced readings (point-to-point is exactly what the research says can't distinguish signal from noise)", () => {
    const points = [
      { date: isoDate(0), e1rm: 100 },
      { date: isoDate(56), e1rm: 105 },
    ];
    expect(e1rmTrend(points)).toBe('insufficient_data');
  });

  it('reports a positive slopePctPerWeek for a clean upward series', () => {
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 2, noise: [0] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.slopePctPerWeek).toBeGreaterThan(0);
  });

  it('reports ~0 slopePctPerWeek for a flat series', () => {
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 0, noise: [0] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.slopePctPerWeek).toBeCloseTo(0, 6);
  });

  it('widens the band/ci95 as points get sparser, holding slope and noise pattern fixed', () => {
    const noise = [3, -3, 2, -2];
    const sparse = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 2, noise });
    const dense = series({ n: 24, spacingDays: 3, startKg: 100, weeklyKg: 2, noise });

    const sparseTrend = e1rmTrend(sparse);
    const denseTrend = e1rmTrend(dense);
    if (sparseTrend === 'insufficient_data' || denseTrend === 'insufficient_data') {
      throw new Error('expected both trends to compute');
    }

    const width = (ci: [number, number]) => ci[1] - ci[0];
    expect(width(sparseTrend.ci95)).toBeGreaterThan(width(denseTrend.ci95));
  });

  it('withinNoise is true when the 95% CI spans zero', () => {
    // No underlying trend at all, plus scatter -- the honest read is "can't tell".
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 0, noise: [3, -3, 2, -2] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.ci95[0]).toBeLessThanOrEqual(0);
    expect(trend.ci95[1]).toBeGreaterThanOrEqual(0);
    expect(trend.withinNoise).toBe(true);
  });

  it('withinNoise is false when the 95% CI does not span zero', () => {
    // A strong, low-noise upward trend -- the honest read is "yes, real".
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 10, noise: [0.1, -0.1] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.ci95[0]).toBeGreaterThan(0);
    expect(trend.withinNoise).toBe(false);
  });

  it('reports withinNoise: true for a real but tiny slope relative to its own scatter', () => {
    // A genuine but small underlying trend (0.2 kg/week) buried in scatter far
    // bigger than the trend itself -- exactly the "advanced lifter, 4-8 week
    // window" case the research says a trendline may not resolve.
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 0.2, noise: [4, -4, 3, -3] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.withinNoise).toBe(true);
  });

  it('returns one band entry per input point, in input order', () => {
    const points = series({ n: 8, spacingDays: 3, startKg: 100, weeklyKg: 2, noise: [1, -1] });
    const trend = e1rmTrend(points);
    if (trend === 'insufficient_data') throw new Error('expected a trend');
    expect(trend.band.map((b) => b.date)).toEqual(points.map((p) => p.date));
    for (const b of trend.band) {
      expect(b.hi).toBeGreaterThanOrEqual(b.lo);
    }
  });
});

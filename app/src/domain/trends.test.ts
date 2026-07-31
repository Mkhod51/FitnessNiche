import { describe, it, expect } from 'vitest';
import { ewma } from './trends';

// Builds an ISO date string `dayOffset` days after 2026-01-01, without
// pulling in a date library -- native Date is enough for this (matches
// e1rm.test.ts's isoDate helper).
function isoDate(dayOffset: number): string {
  const d = new Date('2026-01-01T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

describe('ewma', () => {
  it('smooths a constant series to that same constant', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ date: isoDate(i), value: 80 }));
    const smoothed = ewma(points, 7);
    for (const p of smoothed) {
      expect(p.value).toBeCloseTo(80, 9);
    }
  });

  it('attenuates a single spike instead of following it', () => {
    // A steady 80kg series with one 82kg spike on day 5 -- the kind of
    // one-day water/glycogen swing FR-SIG-4 says must not read as signal.
    const points = [
      { date: isoDate(0), value: 80 },
      { date: isoDate(1), value: 80 },
      { date: isoDate(2), value: 80 },
      { date: isoDate(3), value: 80 },
      { date: isoDate(4), value: 80 },
      { date: isoDate(5), value: 82 },
      { date: isoDate(6), value: 80 },
    ];
    const smoothed = ewma(points, 7);
    const priorSmoothed = smoothed[4].value;
    const spikeSmoothed = smoothed[5].value;
    const spikeRaw = points[5].value;

    expect(spikeSmoothed).toBeGreaterThan(priorSmoothed);
    expect(spikeSmoothed).toBeLessThan(spikeRaw);
    // Attenuated, not just "less than" -- it should sit well below the raw
    // spike, not shadow it by a fraction of a gram.
    expect(spikeRaw - spikeSmoothed).toBeGreaterThan((spikeRaw - priorSmoothed) * 0.5);
  });

  it('returns one output per input point, dates preserved and in order', () => {
    const points = [
      { date: isoDate(0), value: 80 },
      { date: isoDate(3), value: 79.5 },
      { date: isoDate(10), value: 81 },
    ];
    const smoothed = ewma(points, 7);
    expect(smoothed.length).toBe(points.length);
    expect(smoothed.map((p) => p.date)).toEqual(points.map((p) => p.date));
  });

  it('tracks the raw series more closely with a shorter half-life than a longer one', () => {
    const points = [
      { date: isoDate(0), value: 80 },
      { date: isoDate(1), value: 80 },
      { date: isoDate(2), value: 80 },
      { date: isoDate(3), value: 84 },
      { date: isoDate(4), value: 80 },
    ];
    const short = ewma(points, 2);
    const long = ewma(points, 21);

    // At the spike, the shorter half-life must sit closer to the raw value
    // than the longer half-life does -- less lag, by construction of a
    // bigger alpha at every fixed gap.
    const spikeRaw = points[3].value;
    const shortGap = Math.abs(spikeRaw - short[3].value);
    const longGap = Math.abs(spikeRaw - long[3].value);
    expect(shortGap).toBeLessThan(longGap);
  });

  it('returns an empty array for empty input', () => {
    expect(ewma([], 7)).toEqual([]);
  });

  it('is time-aware: the same two readings land differently depending on the gap between them, closer to the newer reading as the gap grows', () => {
    const near = ewma(
      [
        { date: isoDate(0), value: 80 },
        { date: isoDate(1), value: 90 },
      ],
      7,
    );
    const far = ewma(
      [
        { date: isoDate(0), value: 80 },
        { date: isoDate(14), value: 90 },
      ],
      7,
    );

    expect(near[1].value).not.toBeCloseTo(far[1].value, 6);
    // The 14-day gap is two full half-lives -- far more of the new reading
    // should have bled through than after a single day.
    expect(far[1].value).toBeGreaterThan(near[1].value);
    // And after two half-lives it should sit far closer to the newer reading
    // than the one-day gap does — a naive index-based EWMA would put these two
    // at exactly the same place.
    expect(90 - far[1].value).toBeLessThan(90 - near[1].value);
  });

  it('throws on a non-positive half-life instead of silently fabricating a trend', () => {
    const points = [{ date: isoDate(0), value: 80 }];
    expect(() => ewma(points, 0)).toThrow();
    expect(() => ewma(points, -7)).toThrow();
  });
});

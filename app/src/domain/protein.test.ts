import { describe, it, expect } from 'vitest';
import { proteinPerKgOnTrainingDays } from './protein';

const DAY = 86_400_000;
const T0 = new Date('2026-07-01T00:00:00.000Z').getTime();
const at = (d: number, h = 12) => new Date(T0 + d * DAY + h * 3_600_000).toISOString();

const food = (dayOffset: number, proteinG: number) => ({ loggedAt: at(dayOffset), proteinG });
const trained = (dayOffset: number) => ({ performedAt: at(dayOffset, 18) });

describe('proteinPerKgOnTrainingDays', () => {
  it('returns null without a bodyweight to divide by', () => {
    expect(proteinPerKgOnTrainingDays([food(0, 150)], [trained(0)], null)).toBeNull();
  });

  it('returns null when no training day has any food logged against it', () => {
    // Trained on day 0, ate on day 1. Nothing to say about training-day intake.
    expect(proteinPerKgOnTrainingDays([food(1, 150)], [trained(0)], 80)).toBeNull();
  });

  // The whole point of the "on training days" qualifier: rest-day intake is a
  // different question, and averaging the two answers neither.
  it('ignores food logged on days with no training', () => {
    const perKg = proteinPerKgOnTrainingDays(
      [food(0, 160), food(1, 40)], // day 1 is a rest day, and a low one
      [trained(0)],
      80,
    );
    expect(perKg).toBeCloseTo(2.0, 5); // 160 / 80, the rest day excluded entirely
  });

  it('averages across training days rather than pooling the total', () => {
    const perKg = proteinPerKgOnTrainingDays(
      [food(0, 160), food(2, 80)],
      [trained(0), trained(2)],
      80,
    );
    // (2.0 + 1.0) / 2 — not 240/80, which would be 3.0 and describe nobody's day.
    expect(perKg).toBeCloseTo(1.5, 5);
  });

  it('sums every entry within one training day', () => {
    const perKg = proteinPerKgOnTrainingDays(
      [food(0, 60), food(0, 50), food(0, 50)],
      [trained(0)],
      80,
    );
    expect(perKg).toBeCloseTo(2.0, 5);
  });

  it('counts a training day once however many sets it held', () => {
    const perKg = proteinPerKgOnTrainingDays(
      [food(0, 160)],
      [trained(0), trained(0), trained(0)],
      80,
    );
    expect(perKg).toBeCloseTo(2.0, 5);
  });

  it('returns null on empty input rather than zero', () => {
    // Zero would read as "you ate no protein", which is a claim. Null is the
    // absence of a measurement, which is the truth.
    expect(proteinPerKgOnTrainingDays([], [], 80)).toBeNull();
  });
});

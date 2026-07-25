import { describe, it, expect } from 'vitest';
import { SEED_EXERCISES, type MuscleGroup } from './seed-exercises';

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'front_delts', 'side_delts', 'rear_delts', 'lats', 'upper_back',
  'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes',
  'calves', 'abs', 'lower_back',
];

const VALID_FRACTIONS = new Set([1.0, 0.5, 0.25]);

describe('SEED_EXERCISES', () => {
  it('has unique ids', () => {
    const ids = SEED_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses 1.0 / 0.5 / 0.25 as contribution values', () => {
    for (const ex of SEED_EXERCISES) {
      for (const [muscle, value] of Object.entries(ex.contributions)) {
        expect(VALID_FRACTIONS.has(value as number), `${ex.id}.${muscle} = ${value}`).toBe(true);
      }
    }
  });

  it('has at least one muscle at 1.0 per exercise', () => {
    for (const ex of SEED_EXERCISES) {
      const values = Object.values(ex.contributions);
      expect(values.some((v) => v === 1.0), `${ex.id} has no 1.0 muscle`).toBe(true);
    }
  });

  it('covers all 15 muscle groups as a 1.0 primary at least once', () => {
    const primaries = new Set<string>();
    for (const ex of SEED_EXERCISES) {
      for (const [muscle, value] of Object.entries(ex.contributions)) {
        if (value === 1.0) primaries.add(muscle);
      }
    }
    for (const mg of ALL_MUSCLE_GROUPS) {
      expect(primaries.has(mg), `no exercise has ${mg} as a 1.0 primary`).toBe(true);
    }
  });

  it('credits no more than 6 muscles per exercise', () => {
    for (const ex of SEED_EXERCISES) {
      expect(Object.keys(ex.contributions).length, ex.id).toBeLessThanOrEqual(6);
    }
  });

  it('isolation exercises (isCompound false) have exactly one muscle at 1.0', () => {
    for (const ex of SEED_EXERCISES) {
      if (ex.isCompound) continue;
      const onesCount = Object.values(ex.contributions).filter((v) => v === 1.0).length;
      expect(onesCount, `${ex.id} should have exactly one 1.0 muscle`).toBe(1);
    }
  });
});

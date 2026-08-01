import { describe, it, expect } from 'vitest';
import { weeklySetsByMuscle } from './volume';
import type { LoggedSet } from '../db/workouts';
import type { ExerciseRow } from './volume';

function set(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    id: 'set-1',
    workoutId: 'w-1',
    exerciseId: 'compound-ex',
    weightKg: 100,
    reps: 5,
    rir: 2,
    setType: 'working',
    performedAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-01-08T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

const compound: ExerciseRow = {
  id: 'compound-ex',
  name: 'Barbell Bench Press',
  modality: 'barbell',
  isCompound: true,
  contributions: { chest: 1, triceps: 0.5, front_delts: 0.25 },
};

const isolation: ExerciseRow = {
  id: 'isolation-ex',
  name: 'Triceps Pushdown',
  modality: 'cable',
  isCompound: false,
  contributions: { triceps: 1 },
};

const WEEK_START = '2026-01-05'; // a Monday

describe('weeklySetsByMuscle', () => {
  it('counts a compound set fractionally against every muscle it works', () => {
    const totals = weeklySetsByMuscle([set()], [compound, isolation], WEEK_START);
    expect(totals.chest).toBe(1);
    expect(totals.triceps).toBe(0.5);
    expect(totals.front_delts).toBe(0.25);
  });

  it('counts an isolation set as a full set against its single muscle', () => {
    const totals = weeklySetsByMuscle([set({ exerciseId: 'isolation-ex' })], [compound, isolation], WEEK_START);
    expect(totals.triceps).toBe(1);
    expect(totals.chest).toBeUndefined();
  });

  it('excludes sets performed outside the week window', () => {
    const before = set({ performedAt: '2026-01-04T23:59:59.000Z' }); // Sunday, before the Monday start
    const after = set({ performedAt: '2026-01-12T00:00:00.000Z' }); // next Monday, the following week
    const totals = weeklySetsByMuscle([before, after], [compound, isolation], WEEK_START);
    expect(totals.chest).toBeUndefined();
  });

  it('excludes soft-deleted sets', () => {
    const totals = weeklySetsByMuscle([set({ deletedAt: '2026-01-08T00:00:00.000Z' })], [compound, isolation], WEEK_START);
    expect(totals.chest).toBeUndefined();
  });

  it('omits a muscle with no work rather than reporting it as zero', () => {
    const totals = weeklySetsByMuscle([set({ exerciseId: 'isolation-ex' })], [compound, isolation], WEEK_START);
    expect('lats' in totals).toBe(false);
  });

  it('sums multiple sets of the same muscle across exercises', () => {
    const totals = weeklySetsByMuscle(
      [set(), set({ id: 'set-2', exerciseId: 'isolation-ex' })],
      [compound, isolation],
      WEEK_START,
    );
    expect(totals.triceps).toBe(1.5); // 0.5 from the compound + 1.0 from the isolation
  });
});

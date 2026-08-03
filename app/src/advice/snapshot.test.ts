import { describe, it, expect } from 'vitest';
import { buildSnapshot, sessionE1rmPoints, primaryLift, type SnapshotSources } from './snapshot';
import type { LoggedSet } from '../db/workouts';
import type { WeightReading } from '../db/weights';

const DAY = 86_400_000;
const T0 = new Date('2026-05-01T10:00:00.000Z').getTime();
const NOW = new Date(T0 + 60 * DAY);

function set(over: Partial<LoggedSet> & { dayOffset?: number }): LoggedSet {
  const { dayOffset = 0, ...rest } = over;
  return {
    id: `s-${Math.random()}`,
    workoutId: 'w1',
    exerciseId: 'barbell-bench-press',
    weightKg: 100,
    reps: 5,
    rir: 2,
    setType: 'working',
    performedAt: new Date(T0 + dayOffset * DAY).toISOString(),
    updatedAt: new Date(T0 + dayOffset * DAY).toISOString(),
    deletedAt: null,
    ...rest,
  };
}

function weigh(dayOffset: number, valueKg: number): WeightReading {
  return {
    id: `w-${dayOffset}`,
    userId: 'local-user',
    valueKg,
    measuredAt: new Date(T0 + dayOffset * DAY).toISOString(),
    updatedAt: new Date(T0 + dayOffset * DAY).toISOString(),
    deletedAt: null,
  };
}

const sources: SnapshotSources = {
  goal: 'cut',
  numbersHidden: false,
  goalStartedAt: new Date(T0).toISOString(),
  weights: Array.from({ length: 30 }, (_, i) => weigh(i * 2, 80 - i * 0.11)),
  sets: Array.from({ length: 24 }, (_, i) => set({ dayOffset: i * 2, weightKg: 100 })),
  exercises: [],
  proteinPerKg7d: 1.8,
  now: NOW,
};

describe('sessionE1rmPoints', () => {
  // Five sets of bench in one session are ONE observation of that day's
  // strength. Counting them as five would quintuple the sample the regression
  // thinks it has, which is how a confident line gets drawn through one session.
  it('collapses a session to one point per exercise, keeping the best set', () => {
    const points = sessionE1rmPoints([
      set({ dayOffset: 0, weightKg: 90, reps: 5, rir: 2 }),
      set({ dayOffset: 0, weightKg: 100, reps: 5, rir: 2 }),
      set({ dayOffset: 0, weightKg: 95, reps: 5, rir: 2 }),
    ]);
    expect(points).toHaveLength(1);
    // The 100 kg set produces the highest estimate of the three.
    expect(points[0].e1rm).toBeGreaterThan(100);
  });

  it('keeps sessions on different days apart', () => {
    const points = sessionE1rmPoints([set({ dayOffset: 0 }), set({ dayOffset: 3 })]);
    expect(points).toHaveLength(2);
  });

  // FR-SIG-1 is enforced inside setE1rm; this proves the filtering survives the
  // grouping rather than being bypassed by it.
  it('drops sets that cannot qualify, rather than counting them at zero', () => {
    expect(sessionE1rmPoints([set({ rir: null })])).toHaveLength(0);
    expect(sessionE1rmPoints([set({ rir: 5 })])).toHaveLength(0); // RIR > 3
    expect(sessionE1rmPoints([set({ reps: 15, rir: 1 })])).toHaveLength(0); // reps > 10
  });

  it('separates exercises logged on the same day', () => {
    const points = sessionE1rmPoints([
      set({ dayOffset: 0, exerciseId: 'barbell-bench-press' }),
      set({ dayOffset: 0, exerciseId: 'barbell-back-squat' }),
    ]);
    expect(points).toHaveLength(2);
  });
});

describe('primaryLift', () => {
  it('picks the lift with the most qualifying sessions, not the heaviest', () => {
    const m = new Map([
      ['barbell-deadlift', [{ date: 'a', e1rm: 220 }]],
      ['barbell-bench-press', [{ date: 'a', e1rm: 100 }, { date: 'b', e1rm: 101 }, { date: 'c', e1rm: 102 }]],
    ]);
    expect(primaryLift(m)).toBe('barbell-bench-press');
  });

  it('returns null when nothing qualifies', () => {
    expect(primaryLift(new Map())).toBeNull();
  });
});

describe('buildSnapshot', () => {
  it('produces a snapshot the claim engine can predicate on', () => {
    const { snapshot } = buildSnapshot(sources);
    expect(snapshot.goal).toBe('cut');
    expect(snapshot.deficitWeeks).toBeGreaterThanOrEqual(4);
    expect(snapshot.weightTrend).toBe('down');
    expect(snapshot.e1rmTrend).not.toBe('insufficient_data');
    expect(snapshot.proteinPerKg7d).toBe(1.8);
  });

  // The regression this file exists for. Before it, these three fields were
  // hardcoded placeholders and no data-earned claim could ever fire.
  it('no longer returns the placeholder values the screen used to hand-fill', () => {
    const { snapshot } = buildSnapshot(sources);
    const placeholder = { deficitWeeks: 0, weightTrend: 'unknown', e1rmTrend: 'insufficient_data' };
    expect({
      deficitWeeks: snapshot.deficitWeeks,
      weightTrend: snapshot.weightTrend,
      e1rmTrend: snapshot.e1rmTrend,
    }).not.toEqual(placeholder);
  });

  it('reports zero deficit weeks when the goal clock was never set', () => {
    const { snapshot } = buildSnapshot({ ...sources, goalStartedAt: null });
    expect(snapshot.deficitWeeks).toBe(0);
  });

  it('carries the reconciliation alongside, so the UI can say why', () => {
    const { reconciliation, primaryExerciseId } = buildSnapshot(sources);
    expect(reconciliation.verdict).toBeDefined();
    expect(primaryExerciseId).toBe('barbell-bench-press');
    expect(reconciliation.observed.weighIns).toBe(30);
  });

  it('degrades honestly with nothing logged at all', () => {
    const { snapshot, reconciliation } = buildSnapshot({
      ...sources,
      weights: [],
      sets: [],
      goalStartedAt: null,
    });
    expect(snapshot.weightTrend).toBe('unknown');
    expect(snapshot.e1rmTrend).toBe('insufficient_data');
    expect(reconciliation.verdict).toBe('unresolved');
  });
});

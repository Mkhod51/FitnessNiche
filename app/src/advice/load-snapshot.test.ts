import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUser, type User } from '../db/user';
import { getSetsSince, type LoggedSet } from '../db/workouts';
import { getWeightHistory, type WeightReading } from '../db/weights';
import { getEntriesSince, type FoodEntry } from '../db/nutrition';
import { loadAdviceSnapshot } from './load-snapshot';

vi.mock('../db/user', async () => {
  const actual = await vi.importActual<typeof import('../db/user')>('../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../db/workouts', async () => {
  const actual = await vi.importActual<typeof import('../db/workouts')>('../db/workouts');
  return { ...actual, getSetsSince: vi.fn() };
});

vi.mock('../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../db/weights')>('../db/weights');
  return { ...actual, getWeightHistory: vi.fn() };
});

vi.mock('../db/nutrition', async () => {
  const actual = await vi.importActual<typeof import('../db/nutrition')>('../db/nutrition');
  return { ...actual, getEntriesSince: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockGetSetsSince = vi.mocked(getSetsSince);
const mockGetWeightHistory = vi.mocked(getWeightHistory);
const mockGetEntriesSince = vi.mocked(getEntriesSince);

const NOW = new Date('2026-08-02T12:00:00.000Z');
const WINDOW_START = '2026-05-10T12:00:00.000Z';

const user: User = {
  id: 'local-user',
  goal: 'bulk',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: true,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  birthYear: null,
  goalStartedAt: '2026-07-01T12:00:00.000Z',
  consentedAt: '2026-07-01T12:00:00.000Z',
  updatedAt: '2026-07-01T12:00:00.000Z',
};

const recentWeight: WeightReading = {
  id: 'weight-recent',
  userId: 'local-user',
  valueKg: 80,
  measuredAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
  deletedAt: null,
};

const recentSet: LoggedSet = {
  id: 'set-recent',
  workoutId: 'workout-1',
  exerciseId: 'barbell-bench-press',
  weightKg: 80,
  reps: 5,
  rir: 2,
  setType: 'working',
  performedAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
  deletedAt: null,
};

const recentFood: FoodEntry = {
  id: 'food-recent',
  userId: 'local-user',
  foodItemId: null,
  name: 'Lunch',
  mealSlot: 'lunch',
  quantityGrams: null,
  quantityLabel: null,
  kcal: 700,
  proteinG: 80,
  carbsG: null,
  fatG: null,
  loggedAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
  deletedAt: null,
};

describe('loadAdviceSnapshot', () => {
  beforeEach(() => {
    mockGetUser.mockReset().mockResolvedValue(user);
    mockGetSetsSince.mockReset().mockResolvedValue([recentSet]);
    mockGetWeightHistory.mockReset().mockResolvedValue([
      { ...recentWeight, id: 'weight-too-old', measuredAt: '2026-05-10T11:59:59.999Z' },
      recentWeight,
    ]);
    mockGetEntriesSince.mockReset().mockResolvedValue([recentFood]);
  });

  it('builds advice state from the user and their logged rows, not a placeholder snapshot', async () => {
    const built = await loadAdviceSnapshot(NOW);
    if (built === null) throw new Error('expected a consented snapshot');

    expect(built.snapshot).toMatchObject({
      goal: 'bulk',
      numbersHidden: true,
      weeklySetsByMuscle: { chest: 1, front_delts: 0.5, triceps: 0.5 },
      proteinPerKg7d: 1,
    });
    expect(built.latestWeightKg).toBe(80);
  });

  it('uses one exact 84-day reconciliation window for weights, sets, and food', async () => {
    const built = await loadAdviceSnapshot(NOW);
    if (built === null) throw new Error('expected a consented snapshot');

    expect(mockGetSetsSince).toHaveBeenCalledWith(WINDOW_START);
    expect(mockGetEntriesSince).toHaveBeenCalledWith(WINDOW_START);
    expect(built.reconciliation.observed.weighIns).toBe(1);
  });

  it('returns no snapshot and reads no health rows before explicit consent', async () => {
    mockGetUser.mockResolvedValue({ ...user, consentedAt: null });

    expect(await loadAdviceSnapshot(NOW)).toBeNull();
    expect(mockGetWeightHistory).not.toHaveBeenCalled();
    expect(mockGetSetsSince).not.toHaveBeenCalled();
    expect(mockGetEntriesSince).not.toHaveBeenCalled();
  });
});

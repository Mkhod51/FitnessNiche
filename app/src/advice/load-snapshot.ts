import { SEED_EXERCISES } from '../db/seed-exercises';
import { getEntriesSince, hasFoodEntries } from '../db/nutrition';
import { getUser, hasConsented } from '../db/user';
import { getWeightHistory } from '../db/weights';
import { getSetsSince, hasLoggedSets } from '../db/workouts';
import { buildSnapshot, type BuiltSnapshot } from './snapshot';

const RECONCILE_WINDOW_DAYS = 84;
const MS_PER_DAY = 86_400_000;

/**
 * Reads the one shared, real advice snapshot from local logged state.
 *
 * `getUser` runs first because it owns database initialisation. The remaining
 * reads can then happen together without racing an uninitialised local store.
 */
export async function loadAdviceSnapshot(now: Date = new Date()): Promise<BuiltSnapshot | null> {
  const user = await getUser();
  if (!hasConsented(user)) return null;

  const windowStart = new Date(now.getTime() - RECONCILE_WINDOW_DAYS * MS_PER_DAY).toISOString();
  const [weights, sets, food, anySets, anyFood] = await Promise.all([
    getWeightHistory(),
    getSetsSince(windowStart),
    getEntriesSince(windowStart),
    hasLoggedSets(),
    hasFoodEntries(),
  ]);

  return buildSnapshot({
    goal: user.goal,
    numbersHidden: user.numbersHidden,
    goalStartedAt: user.goalStartedAt,
    weights: weights.filter((reading) => reading.measuredAt >= windowStart),
    sets,
    food: food.map((entry) => ({ loggedAt: entry.loggedAt, proteinG: entry.proteinG })),
    hasAnyLoggedData: weights.length > 0 || anySets || anyFood,
    exercises: SEED_EXERCISES,
    now,
  });
}

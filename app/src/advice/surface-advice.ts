import { EMPTY_SNAPSHOT } from './engine';
import { renderHeadline } from './language';
import type {
  AdviceItem,
  Claim,
  Population,
  SurfaceAdviceContext,
  SurfaceAdviceFilters,
  SurfaceContext,
  TrainingExperience,
} from './types';
import { SEED_EXERCISES } from '../db/seed-exercises';

const EXERCISE_IDS = new Set(SEED_EXERCISES.map((exercise) => exercise.id));

type Rank = readonly [specificity: number, populationMatch: number];
type RankedClaim = { claim: Claim; rank: Rank };

function populationFor(experience: TrainingExperience | null): Population | null {
  if (experience === 'new') return 'untrained';
  if (experience === 'experienced') return 'trained';
  // "Returning" does not map honestly to the source taxonomy: prior training
  // and current detraining are not the same thing as a studied population.
  return null;
}

function exerciseRank(
  authored: Extract<SurfaceContext, { surface: 'exercise-selection' }>,
  context: Extract<SurfaceAdviceContext, { surface: 'exercise-selection' }>,
): Rank | null {
  const specific = authored.exerciseIds !== undefined;
  if (specific && !authored.exerciseIds?.includes(context.exerciseId)) return null;

  const population = populationFor(context.experience);
  const populationMatch = population !== null && authored.populations?.includes(population) ? 1 : 0;
  return [specific ? 1 : 0, populationMatch];
}

function rankForContext(claim: Claim, context: SurfaceAdviceContext): Rank | null {
  let best: Rank | null = null;
  for (const authored of claim.surfaceContexts ?? []) {
    let rank: Rank | null = null;
    if (context.surface === 'hub-empty' && authored.surface === 'hub-empty') {
      rank = [0, 0];
    } else if (context.surface === 'goal-draft' && authored.surface === 'goal-draft') {
      if (authored.goals.includes(context.goal)) rank = [0, 0];
    } else if (context.surface === 'exercise-selection' && authored.surface === 'exercise-selection') {
      rank = exerciseRank(authored, context);
    }

    if (rank !== null && (best === null || compareRank(rank, best) > 0)) best = rank;
  }
  return best;
}

function compareRank(left: Rank, right: Rank): number {
  return left[0] - right[0] || left[1] - right[1];
}

/**
 * Select one authored general-evidence fact for an explicit surface.
 *
 * This route deliberately does not evaluate predicates. The request context
 * can rank authored metadata, but cannot earn a personal conclusion.
 */
export function selectSurfaceAdvice(
  context: SurfaceAdviceContext,
  claims: Claim[],
  filters: SurfaceAdviceFilters,
): AdviceItem | null {
  if (context.surface === 'exercise-selection' && !EXERCISE_IDS.has(context.exerciseId)) return null;

  const blocked = new Set([...filters.suppressedClaimIds, ...filters.recentlyShownClaimIds]);
  const ranked: RankedClaim[] = [];

  for (const claim of claims) {
    if (claim.predicates !== null || claim.trigger !== null || blocked.has(claim.id)) continue;
    const rank = rankForContext(claim, context);
    if (rank !== null) ranked.push({ claim, rank });
  }

  if (ranked.length === 0) return null;
  ranked.sort((a, b) => compareRank(b.rank, a.rank));
  if (ranked[1] && compareRank(ranked[0].rank, ranked[1].rank) === 0) return null;

  const selected = ranked[0].claim;
  return {
    claimId: selected.id,
    trigger: 'surface-context',
    headline: renderHeadline(selected),
    snapshot: EMPTY_SNAPSHOT,
  };
}

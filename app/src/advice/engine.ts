import jsonLogic from 'json-logic-js';
import type { AdviceItem, Claim, UserStateSnapshot } from './types.ts';
import { renderHeadline } from './language.ts';
import { validatePredicate } from './claim-schema.ts';

/**
 * The state of a user who has logged nothing. M1 has no logging, so this is the
 * real snapshot the feed evaluates against — not a placeholder, and not fake data.
 */
export const EMPTY_SNAPSHOT: UserStateSnapshot = {
  goal: 'maintain',
  deficitWeeks: 0,
  weightTrend: 'unknown',
  e1rmTrend: 'insufficient_data',
  weeklySetsByMuscle: {},
  proteinPerKg7d: null,
  numbersHidden: false,
};

/**
 * json-logic reads dotted paths, which cannot express "any muscle below N sets"
 * over a Record. Adding one derived array lets claims use `some` without changing
 * the pinned UserStateSnapshot shape.
 */
export function buildPredicateContext(snapshot: UserStateSnapshot): Record<string, unknown> {
  return {
    ...snapshot,
    muscleSets: Object.entries(snapshot.weeklySetsByMuscle).map(([muscle, sets]) => ({ muscle, sets })),
  };
}

function matches(claim: Claim, context: Record<string, unknown>): boolean {
  if (claim.predicates === null || claim.trigger === null) return false;
  try {
    validatePredicate(claim.predicates);
    return jsonLogic.apply(claim.predicates, context) === true;
  } catch {
    // A predicate that throws is an authoring bug. Staying silent is the honest
    // failure: the alternative is surfacing advice the rule did not actually earn.
    return false;
  }
}

export function evaluateClaims(snapshot: UserStateSnapshot, claims: Claim[]): AdviceItem[] {
  const context = buildPredicateContext(snapshot);
  const selected = new Map<string, { claim: Claim; trigger: 'rule' | 'data-earned' }>();

  for (const claim of claims) {
    if (!matches(claim, context)) continue;
    const trigger = claim.trigger as 'rule' | 'data-earned';
    selected.set(claim.id, { claim, trigger });
    // FR-ADV-6: a contested claim never travels alone. Pull in its whole cluster
    // so the UI has both sides available without asking the engine twice.
    if (claim.status === 'contested' && claim.clusterId) {
      for (const sibling of claims) {
        if (sibling.clusterId === claim.clusterId && !selected.has(sibling.id)) {
          selected.set(sibling.id, { claim: sibling, trigger });
        }
      }
    }
  }

  return [...selected.values()].map(({ claim, trigger }) => ({
    claimId: claim.id,
    trigger,
    headline: renderHeadline(claim),
    snapshot,
  }));
}

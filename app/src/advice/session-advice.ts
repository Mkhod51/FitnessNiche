import type { AdviceItem, Claim, UserStateSnapshot } from './types.ts';
import { evaluateClaims } from './engine.ts';

/**
 * Which single claim, if any, a workout session should carry.
 *
 * Selection happens ONCE, when the session starts, and never again inside it.
 * That is forced rather than chosen: no predicate in the claim base reads
 * within-session state — every one of them reads `goal`, `deficitWeeks`,
 * `proteinPerKg7d`, weekly `muscleSets` or `e1rmTrend`, which are all
 * multi-week aggregates. Nothing can become true because of the set you just
 * logged, so re-evaluating mid-session would be theatre, and it also means zero
 * computation during the 90 seconds that matter.
 *
 * The budget is deliberately mean: at most one per session, nothing that has
 * been shown in the last week, nothing the user has silenced. An advice surface
 * that fires twice in one workout gets turned off, and then the differentiator
 * is off.
 *
 * Pure — the caller supplies the filters, so this is testable without a clock
 * or a database.
 */
export function selectSessionAdvice(
  snapshot: UserStateSnapshot,
  claims: Claim[],
  filters: { suppressedClaimIds: string[]; recentlyShownClaimIds: string[]; alreadyShownThisSession: boolean },
): AdviceItem | null {
  if (filters.alreadyShownThisSession) return null;

  // GR-1 / D-G3.6: in numbers-hidden mode, advice whose trigger is an intake or
  // bodyweight figure defeats the mode it is being shown inside.
  const hiddenBlocked = new Set(['energy-balance', 'protein-dose', 'protein-timing']);

  const blocked = new Set([...filters.suppressedClaimIds, ...filters.recentlyShownClaimIds]);

  const candidates = evaluateClaims(snapshot, claims).filter((item) => {
    if (blocked.has(item.claimId)) return false;
    if (!snapshot.numbersHidden) return true;
    const claim = claims.find((c) => c.id === item.claimId);
    return claim ? !hiddenBlocked.has(claim.domain) : false;
  });

  if (candidates.length === 0) return null;

  // Prefer the best-evidenced thing that qualifies. Interrupting someone with a
  // [C] when an [A] also applies spends the one slot badly, and the grade ramp
  // is the only ordering the product is willing to defend.
  const rank: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const byGrade = [...candidates].sort((a, b) => {
    const ga = claims.find((c) => c.id === a.claimId)?.grade ?? 'D';
    const gb = claims.find((c) => c.id === b.claimId)?.grade ?? 'D';
    return rank[ga] - rank[gb];
  });

  return byGrade[0];
}

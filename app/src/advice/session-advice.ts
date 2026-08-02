import type { AdviceItem, Claim, UserStateSnapshot } from './types.ts';
import { evaluateClaims } from './engine.ts';
import type { BuiltSnapshot } from './snapshot.ts';

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function isVar(value: unknown, name: string): boolean {
  return record(value)?.var === name;
}

function containsHoldingStrength(rule: unknown): boolean {
  if (Array.isArray(rule)) return rule.some(containsHoldingStrength);
  const node = record(rule);
  if (!node) return false;

  const equal = node['=='];
  if (
    Array.isArray(equal)
    && equal.length === 2
    && ((isVar(equal[0], 'e1rmTrend') && equal[1] === 'holding')
      || (equal[0] === 'holding' && isVar(equal[1], 'e1rmTrend')))
  ) {
    return true;
  }

  return Object.values(node).some(containsHoldingStrength);
}

type VolumeThreshold = { direction: 'below' | 'above'; threshold: number };

function volumeThreshold(claim: Claim): VolumeThreshold | null {
  const some = record(claim.predicates)?.some;
  if (!Array.isArray(some) || some.length !== 2 || !isVar(some[0], 'muscleSets')) return null;

  const body = record(some[1]);
  if (!body) return null;
  for (const [operator, direction] of [
    ['<', 'below'],
    ['<=', 'below'],
    ['>', 'above'],
    ['>=', 'above'],
  ] as const) {
    const operands = body[operator];
    if (
      Array.isArray(operands)
      && operands.length === 2
      && isVar(operands[0], 'sets')
      && typeof operands[1] === 'number'
      && Number.isFinite(operands[1])
    ) {
      return { direction, threshold: operands[1] };
    }
  }
  return null;
}

/**
 * A logged fact that grounds the selected claim, never a second advice line.
 *
 * Unsupported predicates return no line. Borrowing a weight trend or the most
 * extreme muscle from a different predicate would make a true number explain
 * the wrong claim, which is still a false explanation.
 */
export function whyNow(
  claim: Claim,
  built: BuiltSnapshot,
  primaryExerciseName: string | null,
): string {
  if (
    containsHoldingStrength(claim.predicates)
    && built.snapshot.e1rmTrend === 'holding'
    && primaryExerciseName
  ) {
    const weeks = Math.round(built.reconciliation.observed.windowDays / 7);
    return `${primaryExerciseName} e1RM held${weeks >= 1 ? ` over ${weeks} weeks` : ''}`;
  }

  const volume = volumeThreshold(claim);
  if (!volume) return '';

  const matched = Object.entries(built.snapshot.weeklySetsByMuscle)
    .filter(([, sets]) => volume.direction === 'below' ? sets < volume.threshold : sets > volume.threshold)
    .sort((a, b) => volume.direction === 'below' ? a[1] - b[1] : b[1] - a[1]);
  const first = matched[0];
  if (!first) return '';

  const [muscle, sets] = first;
  return `${muscle.replace(/_/g, ' ')} · ${Math.round(sets * 10) / 10} sets in 7 days`;
}

/** GR-1 / D-G3.6: one shared numbers-hidden rule for every advice surface. */
export function filterNumbersHiddenAdvice(
  snapshot: UserStateSnapshot,
  claims: Claim[],
  items: AdviceItem[],
): AdviceItem[] {
  if (!snapshot.numbersHidden) return items;

  const hiddenBlocked = new Set(['energy-balance', 'protein-dose', 'protein-timing']);
  return items.filter((item) => {
    const claim = claims.find((candidate) => candidate.id === item.claimId);
    return claim ? !hiddenBlocked.has(claim.domain) : false;
  });
}

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

  const blocked = new Set([...filters.suppressedClaimIds, ...filters.recentlyShownClaimIds]);

  const candidates = filterNumbersHiddenAdvice(snapshot, claims, evaluateClaims(snapshot, claims))
    .filter((item) => !blocked.has(item.claimId));

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

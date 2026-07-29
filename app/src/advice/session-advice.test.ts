import { describe, it, expect } from 'vitest';
import { selectSessionAdvice } from './session-advice';
import { CLAIMS } from '../generated/claims';
import type { UserStateSnapshot } from './types';

const NO_FILTERS = { suppressedClaimIds: [], recentlyShownClaimIds: [], alreadyShownThisSession: false };

// A muscle under 10 sets fires c-volume-dose-response, which is [A] and the one
// claim that can realistically fire for a new user inside a fortnight.
const under10: UserStateSnapshot = {
  goal: 'maintain',
  deficitWeeks: 0,
  weightTrend: 'unknown',
  e1rmTrend: 'insufficient_data',
  weeklySetsByMuscle: { chest: 8.5 },
  proteinPerKg7d: null,
  numbersHidden: false,
};

// 14 sits between the two volume thresholds — c-volume-dose-response wants
// under 10 and c-volume-strength-diminishing-returns wants over 20 — and every
// other predicate needs a cut, an e1RM trend, or a protein figure.
const nothingFires: UserStateSnapshot = { ...under10, weeklySetsByMuscle: { chest: 14 } };

describe('selectSessionAdvice — the budget is the design', () => {
  it('returns the claim a real predicate earned', () => {
    const out = selectSessionAdvice(under10, CLAIMS, NO_FILTERS);
    expect(out?.claimId).toBe('c-volume-dose-response');
    expect(out?.trigger).toBe('rule');
  });

  it('returns nothing when no predicate is satisfied, rather than reaching for filler', () => {
    expect(selectSessionAdvice(nothingFires, CLAIMS, NO_FILTERS)).toBeNull();
  });

  // At most one per session. A surface that fires twice in one workout gets
  // switched off, and then the differentiator is off.
  it('shows nothing more once this session has already shown something', () => {
    const out = selectSessionAdvice(under10, CLAIMS, { ...NO_FILTERS, alreadyShownThisSession: true });
    expect(out).toBeNull();
  });

  it('stays quiet for a claim inside its cooldown', () => {
    const out = selectSessionAdvice(under10, CLAIMS, {
      ...NO_FILTERS,
      recentlyShownClaimIds: ['c-volume-dose-response'],
    });
    expect(out?.claimId).not.toBe('c-volume-dose-response');
  });

  it('never returns a claim the user permanently silenced', () => {
    const out = selectSessionAdvice(under10, CLAIMS, {
      ...NO_FILTERS,
      suppressedClaimIds: ['c-volume-dose-response'],
    });
    expect(out?.claimId).not.toBe('c-volume-dose-response');
  });

  it('prefers the better-evidenced claim when more than one qualifies', () => {
    const cutting: UserStateSnapshot = {
      ...under10,
      goal: 'cut',
      deficitWeeks: 8,
      proteinPerKg7d: 1.1,
    };
    const out = selectSessionAdvice(cutting, CLAIMS, NO_FILTERS)!;
    const grade = CLAIMS.find((c) => c.id === out.claimId)!.grade;
    // Several fire in this state; the one slot must not go to a weaker one.
    expect(grade).toBe('A');
  });

  // GR-1 / D-G3.6: advice about intake inside numbers-hidden defeats the mode.
  it('suppresses intake and bodyweight advice in numbers-hidden mode', () => {
    // Only intake-domain claims can fire here: volume is parked between its two
    // thresholds, so anything returned would have to be about eating.
    const hidden: UserStateSnapshot = {
      ...under10,
      numbersHidden: true,
      goal: 'cut',
      deficitWeeks: 8,
      proteinPerKg7d: 1.1,
      weeklySetsByMuscle: { chest: 14 },
    };
    expect(selectSessionAdvice(hidden, CLAIMS, NO_FILTERS)).toBeNull();

    // ...and the same state with numbers visible DOES produce one, so the test
    // above is proving suppression rather than an empty candidate list.
    expect(selectSessionAdvice({ ...hidden, numbersHidden: false }, CLAIMS, NO_FILTERS)).not.toBeNull();
  });

  it('still allows training advice in numbers-hidden mode — that is not the risk', () => {
    const hidden: UserStateSnapshot = { ...under10, numbersHidden: true };
    expect(selectSessionAdvice(hidden, CLAIMS, NO_FILTERS)?.claimId).toBe('c-volume-dose-response');
  });

  it('always returns something bound to a real claim id, never free text', () => {
    const out = selectSessionAdvice(under10, CLAIMS, NO_FILTERS)!;
    expect(CLAIMS.some((c) => c.id === out.claimId)).toBe(true);
  });
});

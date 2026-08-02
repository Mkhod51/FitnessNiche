import { describe, expect, it } from 'vitest';
import { EMPTY_SNAPSHOT } from './engine';
import { selectSurfaceAdvice } from './surface-advice';
import type { Claim } from './types';

const NO_FILTERS = { suppressedClaimIds: [], recentlyShownClaimIds: [] };

function claim(id: string, overrides: Partial<Claim> = {}): Claim {
  return {
    id,
    statement: `Statement for ${id}`,
    peekStatement: `Peek for ${id}`,
    grade: 'B',
    status: 'settled',
    domain: 'training',
    predicates: null,
    trigger: null,
    surfaceContexts: [{ surface: 'exercise-selection' }],
    clusterId: null,
    phrasingKey: id,
    supersededBy: null,
    lastReviewed: '2026-08-02',
    citations: [],
    ...overrides,
  };
}

describe('selectSurfaceAdvice', () => {
  it('prefers an exact exercise context to an exercise-agnostic claim', () => {
    const claims = [
      claim('specific', {
        grade: 'C',
        surfaceContexts: [{ surface: 'exercise-selection', exerciseIds: ['barbell-back-squat'] }],
      }),
      claim('general', { grade: 'A' }),
    ];

    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: null },
      claims,
      NO_FILTERS,
    )?.claimId).toBe('specific');
  });

  it('uses an authored population match only to break an otherwise equal exercise tie', () => {
    const claims = [
      claim('untrained', {
        surfaceContexts: [{ surface: 'exercise-selection', populations: ['untrained'] }],
      }),
      claim('trained', {
        surfaceContexts: [{ surface: 'exercise-selection', populations: ['trained'] }],
      }),
    ];

    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'leg-press', experience: 'experienced' },
      claims,
      NO_FILTERS,
    )?.claimId).toBe('trained');
  });

  it('does not reject a novice-population general claim for an experienced user', () => {
    const claims = [claim('novice-only', {
      surfaceContexts: [{ surface: 'exercise-selection', populations: ['untrained'] }],
    })];

    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'leg-press', experience: 'experienced' },
      claims,
      NO_FILTERS,
    )?.claimId).toBe('novice-only');
  });

  it('returns no card for an unrelated goal context', () => {
    const claims = [claim('cut-only', {
      surfaceContexts: [{ surface: 'goal-draft', goals: ['cut'] }],
    })];

    expect(selectSurfaceAdvice(
      { surface: 'goal-draft', goal: 'bulk', hasEstimate: true, deficitKcal: null },
      claims,
      NO_FILTERS,
    )).toBeNull();
  });

  it('does not let estimate fields loosen the authored goal match', () => {
    const claims = [claim('cut-only', {
      surfaceContexts: [{ surface: 'goal-draft', goals: ['cut'] }],
    })];

    expect(selectSurfaceAdvice(
      { surface: 'goal-draft', goal: 'maintain', hasEstimate: true, deficitKcal: 500 },
      claims,
      NO_FILTERS,
    )).toBeNull();
  });

  it('selects only general claims with null predicates and a null authored trigger', () => {
    const contextual = claim('contextual');
    const predicateClaim = claim('predicate', { predicates: { '==': [1, 1] } });
    const dataEarnedClaim = claim('data-earned', { trigger: 'data-earned' });

    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: null },
      [predicateClaim, dataEarnedClaim, contextual],
      NO_FILTERS,
    )?.claimId).toBe('contextual');
  });

  it('returns a general-evidence item with a truthful surface-context trigger', () => {
    const selected = selectSurfaceAdvice(
      { surface: 'hub-empty' },
      [claim('hub-fact', { surfaceContexts: [{ surface: 'hub-empty' }] })],
      NO_FILTERS,
    );

    expect(selected).toMatchObject({
      claimId: 'hub-fact',
      trigger: 'surface-context',
      snapshot: EMPTY_SNAPSHOT,
    });
  });

  it('applies permanent suppression and the seven-day cooldown inputs', () => {
    const claims = [claim('blocked')];
    const context = { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: null } as const;

    expect(selectSurfaceAdvice(context, claims, {
      suppressedClaimIds: ['blocked'],
      recentlyShownClaimIds: [],
    })).toBeNull();
    expect(selectSurfaceAdvice(context, claims, {
      suppressedClaimIds: [],
      recentlyShownClaimIds: ['blocked'],
    })).toBeNull();
  });

  it('returns no card when the best candidates have an unresolved equal rank', () => {
    const claims = [claim('one'), claim('two')];

    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: null },
      claims,
      NO_FILTERS,
    )).toBeNull();
  });

  it('fails closed for an unknown exercise id', () => {
    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'invented-lift', experience: null },
      [claim('general')],
      NO_FILTERS,
    )).toBeNull();
  });
});

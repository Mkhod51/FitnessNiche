import { describe, expect, it } from 'vitest';
import { EMPTY_SNAPSHOT } from './engine';
import { selectSurfaceAdvice } from './surface-advice';
import type { Claim } from './types';
import { CLAIMS } from '../generated/claims';

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
  it('ships the reviewed hypertrophy-mechanism fact only as general evidence', () => {
    const mechanism = CLAIMS.find((claim) => claim.id === 'c-mechanism-tension-motor-units');

    expect(mechanism).toMatchObject({
      predicates: null,
      trigger: null,
      surfaceContexts: [
        { surface: 'hub-empty' },
        { surface: 'exercise-selection' },
      ],
    });
    expect(selectSurfaceAdvice(
      { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: 'experienced' },
      CLAIMS,
      NO_FILTERS,
    )?.claimId).toBe('c-mechanism-tension-motor-units');
  });

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

  // Pins the shipped curation: the reviewed Slater evidence-gap claim is the
  // one general fact that may surface while a user drafts a bulk goal, and it
  // must stay silent for cut and maintenance, where its scope does not apply.
  it('surfaces the reviewed bulk surplus claim only on the bulk goal-draft surface', () => {
    const bulkDraft = { surface: 'goal-draft', goal: 'bulk', hasEstimate: true, deficitKcal: null } as const;
    expect(selectSurfaceAdvice(bulkDraft, CLAIMS, NO_FILTERS)?.claimId).toBe('c-bulk-rate-surplus-unknown');

    for (const goal of ['cut', 'maintain'] as const) {
      expect(selectSurfaceAdvice(
        { surface: 'goal-draft', goal, hasEstimate: true, deficitKcal: null },
        CLAIMS,
        NO_FILTERS,
      )).toBeNull();
    }
  });
});

import { describe, it, expect } from 'vitest';
import { evaluateClaims, buildPredicateContext, EMPTY_SNAPSHOT } from './engine';
import type { Claim, UserStateSnapshot } from './types';

function claim(over: Partial<Claim> = {}): Claim {
  return {
    id: 'c-test-a',
    statement: 'A statement',
    peekStatement: 'Short curated form',
    grade: 'A',
    status: 'settled',
    domain: 'volume',
    predicates: null,
    trigger: null,
    clusterId: null,
    phrasingKey: 'test-a',
    supersededBy: null,
    lastReviewed: '2026-07-25',
    citations: [],
    ...over,
  };
}

const cutting: UserStateSnapshot = {
  goal: 'cut',
  deficitWeeks: 6,
  weightTrend: 'down',
  e1rmTrend: 'holding',
  weeklySetsByMuscle: { chest: 8, back: 16 },
  proteinPerKg7d: 1.4,
  numbersHidden: false,
};

describe('buildPredicateContext', () => {
  it('flattens weeklySetsByMuscle into an array so `some` predicates can work', () => {
    const ctx = buildPredicateContext(cutting);
    expect(ctx.muscleSets).toEqual([
      { muscle: 'chest', sets: 8 },
      { muscle: 'back', sets: 16 },
    ]);
  });

  it('passes the snapshot fields through unchanged', () => {
    const ctx = buildPredicateContext(cutting);
    expect(ctx.goal).toBe('cut');
    expect(ctx.deficitWeeks).toBe(6);
    expect(ctx.proteinPerKg7d).toBe(1.4);
  });
});

describe('evaluateClaims', () => {
  it('returns nothing for a claim with null predicates — those are search-only', () => {
    expect(evaluateClaims(cutting, [claim({ predicates: null })])).toEqual([]);
  });

  it('fires a claim whose predicate matches the snapshot', () => {
    const c = claim({ predicates: { '==': [{ var: 'goal' }, 'cut'] }, trigger: 'rule' });
    const out = evaluateClaims(cutting, [c]);
    expect(out).toHaveLength(1);
    expect(out[0].claimId).toBe('c-test-a');
    expect(out[0].trigger).toBe('rule');
    expect(out[0].snapshot).toEqual(cutting);
  });

  it('preserves a data-earned trigger when logged state selects the claim', () => {
    const c = claim({
      predicates: {
        and: [
          { '==': [{ var: 'goal' }, 'cut'] },
          { '==': [{ var: 'e1rmTrend' }, 'holding'] },
        ],
      },
      trigger: 'data-earned',
    });
    expect(evaluateClaims(cutting, [c])[0].trigger).toBe('data-earned');
  });

  it('does not fire a claim whose predicate does not match', () => {
    const c = claim({ predicates: { '==': [{ var: 'goal' }, 'bulk'] }, trigger: 'rule' });
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('evaluates an and-composed predicate over several snapshot fields', () => {
    const c = claim({
      predicates: {
        and: [
          { '==': [{ var: 'goal' }, 'cut'] },
          { '>=': [{ var: 'deficitWeeks' }, 4] },
          { '==': [{ var: 'e1rmTrend' }, 'holding'] },
        ],
      },
      trigger: 'rule',
    });
    expect(evaluateClaims(cutting, [c])).toHaveLength(1);
  });

  it('supports a `some` predicate over per-muscle volume', () => {
    const c = claim({
      predicates: { some: [{ var: 'muscleSets' }, { '<': [{ var: 'sets' }, 10] }] },
      trigger: 'rule',
    });
    expect(evaluateClaims(cutting, [c])).toHaveLength(1);
  });

  it('renders the headline through the grade-calibrated map, not from the claim text', () => {
    const c = claim({ grade: 'C', predicates: { '==': [{ var: 'goal' }, 'cut'] }, trigger: 'rule' });
    expect(evaluateClaims(cutting, [c])[0].headline).toContain('suggested, on limited evidence');
  });

  it('returns the whole cluster when a contested claim fires (FR-ADV-6)', () => {
    const forSide = claim({
      id: 'c-timing-for',
      status: 'contested',
      clusterId: 'protein-timing',
      predicates: { '==': [{ var: 'goal' }, 'cut'] },
      trigger: 'rule',
    });
    const againstSide = claim({
      id: 'c-timing-against',
      status: 'contested',
      clusterId: 'protein-timing',
      predicates: null,
    });
    const out = evaluateClaims(cutting, [forSide, againstSide]);
    expect(out.map((a) => a.claimId).sort()).toEqual(['c-timing-against', 'c-timing-for']);
  });

  it('does not duplicate a cluster member that also matched on its own', () => {
    const p = { '==': [{ var: 'goal' }, 'cut'] };
    const a = claim({ id: 'c-x', status: 'contested', clusterId: 'k', predicates: p, trigger: 'rule' });
    const b = claim({ id: 'c-y', status: 'contested', clusterId: 'k', predicates: p, trigger: 'rule' });
    expect(evaluateClaims(cutting, [a, b])).toHaveLength(2);
  });

  it('does not fire on a predicate that returns a truthy non-boolean', () => {
    // json-logic returns the computed VALUE, not a boolean: `{var: 'deficitWeeks'}`
    // evaluates to 6 here. Firing on anything truthy would let a sloppily authored
    // predicate surface advice the rule never actually earned, so the evaluator
    // requires a genuine `true`. Guards the `=== true` in matches().
    const c = claim({ predicates: { var: 'deficitWeeks' }, trigger: 'rule' });
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('does not fire on a predicate that returns a non-empty string', () => {
    const c = claim({ predicates: { var: 'goal' }, trigger: 'rule' });
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('never throws on a malformed predicate — it declines to fire and stays quiet', () => {
    const c = claim({ predicates: { notAnOperator: [1, 2] }, trigger: 'rule' });
    expect(() => evaluateClaims(cutting, [c])).not.toThrow();
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('fails closed when a nullable protein comparison reaches runtime without its null guard', () => {
    const c = claim({
      predicates: { '<': [{ var: 'proteinPerKg7d' }, 1.6] },
      trigger: 'rule',
    });
    expect(evaluateClaims(EMPTY_SNAPSHOT, [c])).toEqual([]);
  });

  it('still evaluates predicates normally against the empty snapshot', () => {
    // EMPTY_SNAPSHOT has goal 'maintain', so a predicate written to match it does
    // match. This proves the empty snapshot is a real snapshot, not a dead object —
    // which is what makes the next test's silence meaningful rather than vacuous.
    expect(evaluateClaims(EMPTY_SNAPSHOT, [claim({
      predicates: { '==': [{ var: 'goal' }, 'maintain'] },
      trigger: 'rule',
    })]))
      .toHaveLength(1);
  });
});

describe('the shipped claim base against an empty snapshot', () => {
  it('fires no claim before the user has logged anything', async () => {
    const { CLAIMS } = await import('../generated/claims');
    const fired = evaluateClaims(EMPTY_SNAPSHOT, CLAIMS);
    expect(fired.map((a) => a.claimId)).toEqual([]);
  });

  it('earns the deficit-strength claim only when logged weight is actually trending down', async () => {
    const { CLAIMS } = await import('../generated/claims');
    const observedDeficit: UserStateSnapshot = {
      ...EMPTY_SNAPSHOT,
      goal: 'cut',
      deficitWeeks: 4,
      weightTrend: 'down',
      e1rmTrend: 'holding',
    };
    const item = evaluateClaims(observedDeficit, CLAIMS)
      .find((advice) => advice.claimId === 'c-strength-holds-through-a-deficit');
    expect(item?.trigger).toBe('data-earned');
  });

  it.each(['unknown', 'flat', 'up', 'down_fast'] as const)(
    'does not call strength data-earned when weight trend is %s',
    async (weightTrend) => {
      const { CLAIMS } = await import('../generated/claims');
      const configuredCut: UserStateSnapshot = {
        ...EMPTY_SNAPSHOT,
        goal: 'cut',
        deficitWeeks: 4,
        weightTrend,
        e1rmTrend: 'holding',
      };
      const ids = evaluateClaims(configuredCut, CLAIMS).map((advice) => advice.claimId);
      expect(ids).not.toContain('c-strength-holds-through-a-deficit');
    },
  );
});

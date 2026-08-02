import { describe, it, expect } from 'vitest';
import { claimSchema } from './claim-schema';

const valid = {
  id: 'c-test-example',
  statement: 'A statement.',
  peekStatement: 'Short curated form',
  grade: 'A',
  status: 'settled',
  domain: 'volume',
  predicates: null,
  trigger: null,
  clusterId: null,
  phrasingKey: 'test-example',
  supersededBy: null,
  lastReviewed: '2026-07-25',
  citations: [
    {
      id: 'cit-test-1',
      claimId: 'c-test-example',
      doi: '10.1080/02640414.2016.1210197',
      authors: 'Someone A, Another B',
      year: 2017,
      journal: 'Journal of Sports Sciences',
      n: 42,
      population: 'trained',
      effectSize: null,
      ci: null,
      figures: [],
      quote: null,
    },
  ],
};

const dataEarned = {
  ...valid,
  predicates: { '==': [{ var: 'e1rmTrend' }, 'down'] },
  trigger: 'data-earned',
};

describe('claimSchema', () => {
  it('accepts a well-formed claim', () => {
    expect(() => claimSchema.parse(valid)).not.toThrow();
  });

  it('defaults surface contexts to null', () => {
    expect(claimSchema.parse(valid).surfaceContexts).toBeNull();
  });

  it('accepts a general exercise-selection context without training experience', () => {
    expect(claimSchema.parse({
      ...valid,
      surfaceContexts: [{ surface: 'exercise-selection' }],
    }).surfaceContexts).toEqual([{ surface: 'exercise-selection' }]);
  });

  it('rejects a data-earned claim with a general surface context', () => {
    expect(() => claimSchema.parse({
      ...dataEarned,
      surfaceContexts: [{ surface: 'hub-empty' }],
    })).toThrow(/data-earned/i);
  });

  it('rejects an unknown advice surface', () => {
    expect(() => claimSchema.parse({
      ...valid,
      surfaceContexts: [{ surface: 'workout-finish' }],
    })).toThrow(/surface/i);
  });

  it('rejects an exercise-selection context with an unknown exercise id', () => {
    expect(() => claimSchema.parse({
      ...valid,
      surfaceContexts: [{ surface: 'exercise-selection', exerciseIds: ['invented-lift'] }],
    })).toThrow(/unknown exercise id/i);
  });

  it('rejects a goal-draft context that cannot match any goal', () => {
    expect(() => claimSchema.parse({
      ...valid,
      surfaceContexts: [{ surface: 'goal-draft', goals: [] }],
    })).toThrow(/goal/i);
  });

  it('requires every claim to declare how its predicate is triggered', () => {
    const { trigger: _drop, ...withoutTrigger } = valid;
    expect(() => claimSchema.parse(withoutTrigger)).toThrow();
  });

  it.each(['rule', 'data-earned'])('accepts a %s trigger only with a predicate', (trigger) => {
    const predicates = { '==': [{ var: 'goal' }, 'cut'] };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger })).not.toThrow();
    expect(() => claimSchema.parse({ ...valid, trigger })).toThrow(/predicate/i);
  });

  it('accepts a null trigger only for a search-only claim', () => {
    const predicates = { '==': [{ var: 'goal' }, 'cut'] };
    expect(() => claimSchema.parse({ ...valid, predicates })).toThrow(/trigger/i);
  });

  it('rejects an unknown predicate operator', () => {
    const predicates = { approximately: [{ var: 'deficitWeeks' }, 4] };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/unknown predicate operator/);
  });

  it('rejects an unknown predicate variable at any depth', () => {
    const predicates = {
      and: [
        { '==': [{ var: 'goal' }, 'cut'] },
        { '>=': [{ var: 'unknown' }, 4] },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/unknown predicate variable/);
  });

  it.each([
    { and: [{ '==': [{ var: 'goal' }, 'cut'] }] },
    { '!': [{ '==': [{ var: 'goal' }, 'cut'] }, true] },
    { '==': [{ var: 'goal' }] },
    { some: [{ var: 'muscleSets' }] },
  ])('rejects invalid operator arity: %j', (predicates) => {
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/predicate operator.*expects/);
  });

  it('accepts literal arrays as predicate operands', () => {
    const predicates = { '==': [[1, 2], [1, 2]] };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' })).not.toThrow();
  });

  it('keeps muscle and sets variables inside a muscleSets some scope', () => {
    const scoped = {
      some: [
        { var: 'muscleSets' },
        {
          and: [
            { '==': [{ var: 'muscle' }, 'chest'] },
            { '<': [{ var: 'sets' }, 10] },
          ],
        },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates: scoped, trigger: 'rule' })).not.toThrow();
    expect(() => claimSchema.parse({
      ...valid,
      predicates: { '<': [{ var: 'sets' }, 10] },
      trigger: 'rule',
    })).toThrow(/unknown predicate variable.*some/i);
  });

  it('does not let root snapshot variables masquerade as fields inside some', () => {
    const predicates = {
      some: [
        { var: 'muscleSets' },
        { '==': [{ var: 'goal' }, 'cut'] },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/unknown predicate variable.*some/i);
  });

  it('rejects an ordered protein comparison without a preceding null guard', () => {
    const predicates = { '<': [{ var: 'proteinPerKg7d' }, 1.6] };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/proteinPerKg7d.*null guard/);
  });

  it('requires the protein null guard to precede the comparison in the same and', () => {
    const predicates = {
      and: [
        { '<': [{ var: 'proteinPerKg7d' }, 1.6] },
        { '!=': [{ var: 'proteinPerKg7d' }, null] },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/proteinPerKg7d.*null guard/);
  });

  it('accepts an ordered protein comparison after its null guard', () => {
    const predicates = {
      and: [
        { '!=': [{ var: 'proteinPerKg7d' }, null] },
        { '<': [{ var: 'proteinPerKg7d' }, 1.6] },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' })).not.toThrow();
  });

  it('does not mistake an expression containing protein for a real null guard', () => {
    const predicates = {
      and: [
        { '!=': [{ '==': [{ var: 'proteinPerKg7d' }, 1] }, null] },
        { '<': [{ var: 'proteinPerKg7d' }, 1.6] },
      ],
    };
    expect(() => claimSchema.parse({ ...valid, predicates, trigger: 'rule' }))
      .toThrow(/proteinPerKg7d.*null guard/);
  });

  it('rejects a claim with no grade', () => {
    const { grade: _drop, ...noGrade } = valid;
    expect(() => claimSchema.parse(noGrade)).toThrow();
  });

  it('rejects a grade outside A-D', () => {
    expect(() => claimSchema.parse({ ...valid, grade: 'S' })).toThrow();
  });

  it('rejects a claim with zero citations', () => {
    expect(() => claimSchema.parse({ ...valid, citations: [] })).toThrow();
  });

  it('rejects a doi that is not a doi', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], doi: 'see the paper' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a citation whose claimId does not match its parent claim', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], claimId: 'c-something-else' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a lastReviewed that is not an ISO date', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: 'July 2026' })).toThrow();
  });

  it('rejects a contested claim with no clusterId', () => {
    expect(() => claimSchema.parse({ ...valid, status: 'contested' })).toThrow();
  });

  it('accepts a contested claim that has a clusterId', () => {
    const ok = { ...valid, status: 'contested', clusterId: 'protein-timing' };
    expect(() => claimSchema.parse(ok)).not.toThrow();
  });

  it('accepts null n, effectSize and ci — an unreadable figure is honest, an invented one is not', () => {
    const sparse = {
      ...valid,
      citations: [{ ...valid.citations[0], n: null, effectSize: null, ci: null }],
    };
    expect(() => claimSchema.parse(sparse)).not.toThrow();
  });

  // --- id shape ---

  it('rejects an id with uppercase characters', () => {
    expect(() => claimSchema.parse({ ...valid, id: 'C-Test-Example' })).toThrow();
  });

  it('rejects an id with no c- prefix', () => {
    expect(() => claimSchema.parse({ ...valid, id: 'test-example' })).toThrow();
  });

  // --- min(1) on required strings ---

  it('rejects an empty statement', () => {
    expect(() => claimSchema.parse({ ...valid, statement: '' })).toThrow();
  });

  it('rejects an empty domain', () => {
    expect(() => claimSchema.parse({ ...valid, domain: '' })).toThrow();
  });

  it('rejects an empty phrasingKey', () => {
    expect(() => claimSchema.parse({ ...valid, phrasingKey: '' })).toThrow();
  });

  it('rejects a citation with empty authors', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], authors: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a citation with empty journal', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], journal: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a citation with empty id', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], id: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  // --- year bounds ---

  it('rejects a year before 1900', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], year: 1800 }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a year after 2100', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], year: 2200 }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  // --- population enum ---

  it('rejects a population outside the known set', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], population: 'athletes' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it.each(['trained', 'untrained', 'mixed', 'unstated'])('accepts population %s', (population) => {
    const ok = { ...valid, citations: [{ ...valid.citations[0], population }] };
    expect(() => claimSchema.parse(ok)).not.toThrow();
  });

  // --- n positivity ---

  it('rejects n of zero', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], n: 0 }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a negative n', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], n: -5 }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a non-integer n', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], n: 12.5 }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  // --- figures ---

  it('accepts a well-formed figure', () => {
    const ok = {
      ...valid,
      citations: [
        { ...valid.citations[0], figures: [{ label: 'squat 1RM change', value: 4.2, unit: 'kg' }] },
      ],
    };
    expect(() => claimSchema.parse(ok)).not.toThrow();
  });

  it('accepts a figure with unit omitted', () => {
    const ok = {
      ...valid,
      citations: [{ ...valid.citations[0], figures: [{ label: 'effect size', value: 0.5 }] }],
    };
    expect(() => claimSchema.parse(ok)).not.toThrow();
  });

  it('rejects a figure with an empty label', () => {
    const bad = {
      ...valid,
      citations: [{ ...valid.citations[0], figures: [{ label: '', value: 4.2, unit: 'kg' }] }],
    };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a figure whose value is a string', () => {
    const bad = {
      ...valid,
      citations: [{ ...valid.citations[0], figures: [{ label: 'squat 1RM change', value: '4.2', unit: 'kg' }] }],
    };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  // --- nullable-but-constrained: absence must be explicit null, not '' ---

  it('rejects an empty-string effectSize', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], effectSize: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects an empty-string ci', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], ci: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects an empty-string quote', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], quote: '' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects an empty-string clusterId', () => {
    expect(() => claimSchema.parse({ ...valid, clusterId: '' })).toThrow();
  });

  it('rejects an empty-string supersededBy', () => {
    expect(() => claimSchema.parse({ ...valid, supersededBy: '' })).toThrow();
  });

  // --- isoDate calendar validity (shape alone isn't enough: 2026-13-45 matches the regex) ---

  it('rejects a lastReviewed with month 13', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: '2026-13-01' })).toThrow();
  });

  it('rejects a lastReviewed with a day that does not exist in that month', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: '2026-02-30' })).toThrow();
  });

  it('accepts a real leap day', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: '2024-02-29' })).not.toThrow();
  });

  it('rejects Feb 29 in a non-leap year', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: '2023-02-29' })).toThrow();
  });
});

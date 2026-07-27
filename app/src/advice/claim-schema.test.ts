import { describe, it, expect } from 'vitest';
import { claimSchema } from './claim-schema';

const valid = {
  id: 'c-test-example',
  statement: 'A statement.',
  grade: 'A',
  status: 'settled',
  domain: 'volume',
  predicates: null,
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

describe('claimSchema', () => {
  it('accepts a well-formed claim', () => {
    expect(() => claimSchema.parse(valid)).not.toThrow();
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

  it('rejects a population outside trained/untrained/mixed', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], population: 'athletes' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
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

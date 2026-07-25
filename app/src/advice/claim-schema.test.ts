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
});

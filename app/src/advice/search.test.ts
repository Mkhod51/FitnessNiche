import { describe, it, expect } from 'vitest';
import { buildIndex, searchClaims } from './search';
import { EMPTY_SNAPSHOT } from './engine';
import { renderHeadline } from './language';
import type { Claim } from './types';

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

const deloadClaim = claim({
  id: 'c-deload',
  statement: 'A planned deload week every four to six weeks helps manage fatigue',
  peekStatement: 'Short curated form',
  domain: 'deloads',
});

const restClaim = claim({
  id: 'c-rest',
  statement: 'Resting more than a minute between sets is mildly better for growth',
  peekStatement: 'Short curated form',
  domain: 'rest-intervals',
});

const proteinClaim = claim({
  id: 'c-protein-dose',
  statement: 'Roughly 1.6 to 2.2 grams of protein per kilogram supports muscle growth',
  peekStatement: 'Short curated form',
  domain: 'protein-dose',
  citations: [{
    id: 'cit-1', claimId: 'c-protein-dose', doi: '10.0/x', authors: 'Zubrzycki OA',
    year: 2020, journal: 'Some Journal', n: 10, population: 'trained',
    effectSize: null, ci: null, figures: [], quote: null,
  }],
});

const forSide = claim({
  id: 'c-timing-for',
  status: 'contested',
  clusterId: 'protein-timing',
  domain: 'protein-timing',
  statement: 'Spreading protein into several doses around training may add something',
  peekStatement: 'Short curated form',
});

const againstSide = claim({
  id: 'c-timing-against',
  status: 'contested',
  clusterId: 'protein-timing',
  domain: 'protein-timing',
  statement: 'Total daily protein dominates once timing is accounted for',
  peekStatement: 'Short curated form',
});

const claims: Claim[] = [deloadClaim, restClaim, proteinClaim, forSide, againstSide];

describe('buildIndex', () => {
  it('builds a MiniSearch index over the given claims', () => {
    const index = buildIndex(claims);
    expect(index.documentCount).toBe(claims.length);
  });
});

describe('searchClaims', () => {
  it('returns the matching claim for an exact-term query', () => {
    const out = searchClaims('deload', claims);
    expect(out.map((i) => i.claimId)).toEqual(['c-deload']);
  });

  it('returns an empty array for a query that matches nothing', () => {
    expect(searchClaims('quantum flux capacitor', claims)).toEqual([]);
  });

  it('returns an empty array for an empty query, rather than every claim', () => {
    expect(searchClaims('', claims)).toEqual([]);
  });

  it('returns an empty array for a whitespace-only query', () => {
    expect(searchClaims('   ', claims)).toEqual([]);
  });

  it('tags every result with trigger "query"', () => {
    const out = searchClaims('deload', claims);
    expect(out).toHaveLength(1);
    expect(out[0].trigger).toBe('query');
  });

  it('carries the empty snapshot on every result, same as the rule engine path', () => {
    const out = searchClaims('deload', claims);
    expect(out[0].snapshot).toEqual(EMPTY_SNAPSHOT);
  });

  it('renders the headline the same calibrated way as the rule engine', () => {
    const out = searchClaims('deload', claims);
    expect(out[0].headline).toBe(renderHeadline(deloadClaim));
  });

  it('returns the whole contested cluster when the query matches only one side (FR-ADV-6)', () => {
    const out = searchClaims('spreading', claims);
    expect(out.map((i) => i.claimId).sort()).toEqual(['c-timing-against', 'c-timing-for']);
  });

  it('matches on a realistic typo via fuzzy search', () => {
    const out = searchClaims('protain', claims);
    expect(out.map((i) => i.claimId)).toContain('c-protein-dose');
  });

  it('matches on a prefix of a longer word', () => {
    const out = searchClaims('delo', claims);
    expect(out.map((i) => i.claimId)).toContain('c-deload');
  });

  it('matches on domain as well as statement text', () => {
    const out = searchClaims('rest-intervals', claims);
    expect(out.map((i) => i.claimId)).toContain('c-rest');
  });

  it('requires every query word to match, so a hyphenated domain name does not pull in unrelated claims', () => {
    // "protein-timing" tokenizes into "protein" and "timing". OR-combined terms
    // would match c-protein-dose (has "protein") and c-rest (statement mentions
    // neither, but a looser corpus could) — only the actual cluster should match.
    const out = searchClaims('protein-timing', claims);
    expect(out.map((i) => i.claimId).sort()).toEqual(['c-timing-against', 'c-timing-for']);
  });

  it('does not match a query that only appears in a citation field', () => {
    // The ambiguity note in the brief: indexing citation text would let a query
    // match an author's surname and surface an unrelated claim. Only statement
    // and domain are indexed, so a search for the author never matches here.
    const out = searchClaims('zubrzycki', claims);
    expect(out).toEqual([]);
  });
});

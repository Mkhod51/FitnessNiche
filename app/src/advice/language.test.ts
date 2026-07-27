import { describe, it, expect } from 'vitest';
import { GRADE_LANGUAGE, renderHeadline } from './language';
import type { Claim, Grade } from './types';

const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

// Words that assert certainty. FR-ADV-5 says a [C] claim must be structurally
// incapable of rendering "proven"; this is the list that makes "structurally"
// mean something testable.
const CERTAINTY_WORDS = [
  'proven', 'proves', 'proof', 'definitive', 'definitively', 'conclusive',
  'conclusively', 'guaranteed', 'guarantees', 'certain', 'established fact',
  'settled science', 'always', 'never fails', 'optimal',
];

function claimWith(grade: Grade): Claim {
  return {
    id: 'c-test-x',
    statement: 'Training more produces more growth',
    grade,
    status: 'settled',
    domain: 'volume',
    predicates: null,
    clusterId: null,
    phrasingKey: 'test-x',
    supersededBy: null,
    lastReviewed: '2026-07-25',
    citations: [],
  };
}

describe('GRADE_LANGUAGE', () => {
  it('covers every grade and nothing else', () => {
    expect(Object.keys(GRADE_LANGUAGE).sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('gives every grade a non-empty verb, confidence and chip label', () => {
    for (const g of GRADES) {
      expect(GRADE_LANGUAGE[g].verb.length).toBeGreaterThan(0);
      expect(GRADE_LANGUAGE[g].confidence.length).toBeGreaterThan(0);
      expect(GRADE_LANGUAGE[g].chipLabel.length).toBeGreaterThan(0);
    }
  });

  it('uses a distinct verb per grade — a shared verb collapses the calibration', () => {
    const verbs = GRADES.map((g) => GRADE_LANGUAGE[g].verb);
    expect(new Set(verbs).size).toBe(4);
  });
});

describe('renderHeadline', () => {
  it('renders the calibrated verb for each grade', () => {
    for (const g of GRADES) {
      expect(renderHeadline(claimWith(g))).toContain(GRADE_LANGUAGE[g].verb);
    }
  });

  it('reads as a grammatical sentence rather than a statement bolted to a fragment', () => {
    // Guards the join, not the vocabulary: 'Statement — is well-supported.' is what
    // you get if a verb keeps a leading 'is', and it reads as broken English on
    // every card in the feed.
    expect(renderHeadline(claimWith('A'))).toBe(
      'Training more produces more growth — well-supported.',
    );
  });

  it('includes the claim statement verbatim', () => {
    expect(renderHeadline(claimWith('A'))).toContain('Training more produces more growth');
  });

  it('never asserts certainty at any grade — not even [A]', () => {
    for (const g of GRADES) {
      const out = renderHeadline(claimWith(g)).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(out, `grade ${g} rendered the certainty word "${word}"`).not.toContain(word);
      }
    }
  });

  it('never asserts certainty for any real claim in the shipped base', async () => {
    const { CLAIMS } = await import('../generated/claims');
    for (const claim of CLAIMS) {
      const out = renderHeadline(claim).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(out, `${claim.id} rendered "${word}"`).not.toContain(word);
      }
    }
  });
});

import { describe, it, expect } from 'vitest';
import { GRADE_LANGUAGE, renderHeadline } from './language';
import type { Claim, Grade } from './types';
import { CLAIMS } from '../generated/claims';

const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

// Words that assert certainty. FR-ADV-5 says a [C] claim must be structurally
// incapable of rendering "proven"; this is the list that makes "structurally"
// mean something testable.
const CERTAINTY_WORDS = [
  'proven', 'proves', 'proof', 'definitive', 'definitively', 'conclusive',
  'conclusively', 'guaranteed', 'guarantees', 'certain', 'established fact',
  'settled science', 'always', 'never fails', 'optimal',
];

/**
 * Whole-word match, not substring. A plain `includes` flags 'certain' inside
 * 'uncertainty' — a word that asserts the exact opposite — which would push the
 * copy away from the most accurate term available for a [B] claim. Word
 * boundaries also mean an honest 'unproven' or 'disproven' passes while a bare
 * 'proven' still fails, which is the distinction this guard is actually for.
 */
function assertsCertainty(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(text);
}

function claimWith(grade: Grade): Claim {
  return {
    id: 'c-test-x',
    statement: 'Training more produces more growth',
    peekStatement: 'Short curated form',
    grade,
    status: 'settled',
    domain: 'volume',
    predicates: null,
    trigger: null,
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
      'Training more produces more growth: well-supported.',
    );
  });

  it('includes the claim statement verbatim', () => {
    expect(renderHeadline(claimWith('A'))).toContain('Training more produces more growth');
  });

  it('never asserts certainty at any grade — not even [A]', () => {
    for (const g of GRADES) {
      const out = renderHeadline(claimWith(g)).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(assertsCertainty(out, word), `grade ${g} rendered the certainty word "${word}"`).toBe(false);
      }
    }
  });

  it('never asserts certainty for any real claim in the shipped base', async () => {
    const { CLAIMS } = await import('../generated/claims');
    for (const claim of CLAIMS) {
      const out = renderHeadline(claim).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(assertsCertainty(out, word), `${claim.id} rendered "${word}"`).toBe(false);
      }
    }
  });
});

/**
 * The peek renders `peekStatement` instead of truncating `statement`, which is
 * the whole reason the field exists — an ellipsis through a claim cuts the
 * qualifier, and the qualifier is what stops a [C] being read as a certainty.
 *
 * But a hand-written short form can overstate all by itself, which is a worse
 * failure than truncation because it looks deliberate. These check the curated
 * copy the same way the grade language is checked.
 */
describe('peekStatement — the short form must not overstate what it shortens', () => {
  it('exists on every claim, since the peek has no fallback', () => {
    for (const c of CLAIMS) {
      expect(c.peekStatement.trim().length, `${c.id} has no peek statement`).toBeGreaterThan(0);
    }
  });

  it('stays short enough to render whole, so it never needs truncating in turn', () => {
    for (const c of CLAIMS) {
      expect(c.peekStatement.length, `${c.id} peek statement is too long to render whole`).toBeLessThanOrEqual(100);
    }
  });

  it.each(CERTAINTY_WORDS)('never asserts "%s", whatever the grade', (word) => {
    const offenders = CLAIMS.filter((c) => assertsCertainty(c.peekStatement.toLowerCase(), word)).map((c) => c.id);
    expect(offenders, `these peek statements assert "${word}": ${offenders.join(', ')}`).toEqual([]);
  });

  // A shortening that drops the hedge is how nuance degrades under interface
  // constraints — the exact failure D3 names.
  it('keeps a hedge on every claim graded below B', () => {
    const HEDGES = /\bmay\b|\bmight\b|\btends? to\b|\bappears? to\b|\bsuggest|\bnot clearly\b|\bbarely\b|\blittle\b/i;
    for (const c of CLAIMS.filter((x) => x.grade === 'C' || x.grade === 'D')) {
      expect(
        HEDGES.test(c.peekStatement),
        `${c.id} is graded ${c.grade} but its peek statement reads as settled: "${c.peekStatement}"`,
      ).toBe(true);
    }
  });

  it('is a distinct sentence, not a prefix of the full statement chopped short', () => {
    for (const c of CLAIMS) {
      expect(c.statement.startsWith(c.peekStatement), `${c.id} peek is just a truncation`).toBe(false);
    }
  });
});

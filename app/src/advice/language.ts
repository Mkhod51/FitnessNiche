import type { Claim, Grade } from './types.ts';

export interface GradeLanguage {
  /** The calibrated verb phrase. This is the only place certainty is expressed. */
  verb: string;
  /** One sentence a user reads at tap-1 "why". */
  confidence: string;
  /** The short label on the grade chip. */
  chipLabel: string;
}

export const GRADE_LANGUAGE = {
  A: {
    verb: 'well-supported',
    confidence: 'Meta-analysis or replicated trials point the same way.',
    chipLabel: 'well-supported',
  },
  B: {
    verb: 'supported, with real uncertainty',
    confidence: 'One good study, or consistent observational evidence. Not yet replicated.',
    chipLabel: 'some uncertainty',
  },
  C: {
    verb: 'suggested, on limited evidence',
    confidence: 'Mechanism, small studies, or expert consensus without trial evidence behind it.',
    chipLabel: 'limited evidence',
  },
  D: {
    verb: 'anecdotal',
    confidence: 'Industry material or individual reports. Treat as a starting point, not a finding.',
    chipLabel: 'anecdotal',
  },
} as const satisfies Record<Grade, GradeLanguage>;

/**
 * The only function that turns a claim into a sentence. The verb comes from the
 * grade, never from the author of the claim, so the app cannot say "proven"
 * about a [C] (FR-ADV-5).
 */
export function renderHeadline(claim: Claim): string {
  return `${claim.statement}: ${GRADE_LANGUAGE[claim.grade].verb}.`;
}

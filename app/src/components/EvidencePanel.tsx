import type { ReactElement } from 'react';
import { GRADE_LANGUAGE } from '../advice/language';
import type { Claim, Citation } from '../advice/types';
import { FigureChart } from './FigureChart';

// Full author list — ClaimCard shortens to "First A et al." for the card, so
// this is the only place the complete list survives (DESIGN.md §Components).
function CitationBlock({ citation }: { citation: Citation }): ReactElement {
  const doiUrl = `https://doi.org/${citation.doi}`;
  return (
    <div data-testid="citation-block" className="border-t border-rule pt-3 first:border-t-0 first:pt-0 first:mt-0">
      <p data-testid="citation-authors" className="font-serif text-[13px] text-ink">
        {citation.authors}
      </p>
      <p className="font-serif text-[12px] italic text-ink-soft">
        {citation.journal}, {citation.year}
      </p>
      <a
        data-testid="citation-doi"
        href={doiUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex min-h-[44px] items-center font-mono text-[11px] text-ink-soft underline"
      >
        {doiUrl}
      </a>
      <div className="mt-2">
        <FigureChart citation={citation} />
      </div>
    </div>
  );
}

/**
 * Layer 3: the study detail behind the tap. FR-ADV-7 layers 2 and 3 —
 * layer 2 is the grade's confidence sentence, visible as soon as the panel
 * opens (tap-1); layer 3 is the full citation list with a FigureChart per
 * citation, behind its own native disclosure (tap-2), so the numbers stay
 * opt-in rather than arriving unasked with the "why".
 */
export function EvidencePanel({ claim }: { claim: Claim }): ReactElement {
  const language = GRADE_LANGUAGE[claim.grade];

  return (
    <div data-testid="evidence-panel" className="mt-2 bg-paper-sunk p-3">
      <p data-testid="evidence-confidence" className="font-serif text-[14px] leading-[1.3] text-ink">
        {language.confidence}
      </p>

      <p data-testid="evidence-last-reviewed" className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
        last reviewed {claim.lastReviewed}
      </p>

      {claim.supersededBy && (
        <p data-testid="evidence-superseded" className="mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-flag">
          superseded by {claim.supersededBy}
        </p>
      )}

      <details className="mt-3">
        <summary className="inline-flex min-h-[44px] cursor-pointer select-none items-center font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          show citations &amp; figures
        </summary>
        <div className="mt-2 flex flex-col gap-3">
          {claim.citations.map((citation) => (
            <CitationBlock key={citation.id} citation={citation} />
          ))}
        </div>
      </details>
    </div>
  );
}

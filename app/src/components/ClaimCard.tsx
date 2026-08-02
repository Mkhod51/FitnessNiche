import { useState, type ReactElement } from 'react';
import { ConfidenceTicks } from './ConfidenceTicks';
import { EvidencePanel } from './EvidencePanel';
import type { Claim, Citation } from '../advice/types';

/**
 * Citation author lists run to eleven names in this claim base, which wraps to
 * four lines of italic serif on a 340px card. Mobile is the design target, so the
 * card shows first-author-et-al and the evidence panel carries the full list.
 * This shortens a stored string for display; it never invents one.
 */
export function shortenAuthors(authors: string): string {
  const names = authors.split(',').map((a) => a.trim()).filter(Boolean);
  if (names.length === 0) return authors;
  if (names.length === 1) return names[0];
  // Two authors are both named — "Murphy C et al." for a two-author paper is simply
  // wrong, and this audience cites papers.
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} et al.`;
}

// DESIGN.md §Type: source lines are italic serif; sample size is a count, so it
// gets the mono treatment ("a number set in the serif face is a bug").
function SourceLine({ citation }: { citation: Citation }): ReactElement {
  return (
    <p data-testid="claim-source" className="mt-2 font-serif text-[12px] italic text-ink-soft">
      {shortenAuthors(citation.authors)}, {citation.journal}, {citation.year}
      {citation.n !== null && (
        <>
          {' '}
          &middot; <span className="font-figure tabular-nums not-italic">n={citation.n}</span>
        </>
      )}
    </p>
  );
}

// Layers 1 and 2 only (Task 7b owns the evidence panel behind this affordance).
// DESIGN.md fixed order: advice, then confidence, then source, then the one
// affordance — never the DOI, figures, effect size or CI on the card itself.
function ClaimBody({ claim }: { claim: Claim }): ReactElement {
  const citation = claim.citations[0] as Citation | undefined;
  // Lazy-mounted, not lazy-rendered: the <details> itself stays fully native
  // (no controlled `open`, no animation), but the panel's DOM nodes don't
  // exist until the reader actually opens it — so layer 3 stays opt-in even
  // to a DOM query, not merely hidden behind CSS.
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  return (
    <>
      <p data-testid="claim-statement" className="font-serif text-[17px] leading-[1.3] tracking-[-0.005em] text-ink">
        {claim.statement}
      </p>
      <div className="mt-2">
        <ConfidenceTicks grade={claim.grade} />
      </div>
      {citation && <SourceLine citation={citation} />}
      <details className="mt-2" onToggle={(e) => setEvidenceOpen(e.currentTarget.open)}>
        <summary className="inline-flex min-h-[44px] cursor-pointer select-none items-center font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          see the evidence
        </summary>
        {evidenceOpen && <EvidencePanel claim={claim} />}
      </details>
    </>
  );
}

/**
 * `ClaimCard` puts one claim on screen: statement, then confidence, then
 * source, in that fixed order (DESIGN.md §Components) — the reader meets how
 * strong the evidence is before the citation, because a citation alone reads
 * as proof. A contested cluster (FR-ADV-6) renders every side at equal visual
 * weight instead of a single claim.
 */
export function ClaimCard({ claim, cluster }: { claim: Claim; cluster?: Claim[] }): ReactElement {
  const contested = (cluster?.length ?? 0) > 1;

  return (
    <div data-testid="claim-card" data-claim-id={claim.id} className="border-b border-rule bg-paper p-4">
      {contested && cluster ? (
        <>
          <p data-testid="contested-marker" className="mb-3 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            contested, both sides shown
          </p>
          <div className="flex flex-col gap-4">
            {cluster.map((side) => (
              <div key={side.id} data-testid="claim-side" data-claim-id={side.id} className="flex-1">
                <ClaimBody claim={side} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <ClaimBody claim={claim} />
      )}
    </div>
  );
}

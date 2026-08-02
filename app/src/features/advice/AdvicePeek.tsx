import { useState, type ReactElement } from 'react';
import type { Claim } from '../../advice/types';
import { ConfidenceTicks } from '../../components/ConfidenceTicks';
import { ClaimCard } from '../../components/ClaimCard';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em]';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';

/**
 * Mid-workout advice, present rather than intrusive.
 *
 * It does NOT animate in. That is the single carve-out in an otherwise animated
 * app, and it is a product decision rather than a stylistic one: an animated
 * arrival is exactly what turns "present" into "interruption", and v1
 * deliberately does not interrupt. It animates when the user opens it, because
 * then the movement explains where the panel came from.
 *
 * The confidence counter renders at full size regardless of how little room
 * there is. That is the one thing here that may never be traded for
 * compactness — principle 7 says the grade must be as prominent as the claim,
 * and a peek that shrinks the grade away is the skimmable badge this whole
 * direction exists to refuse.
 *
 * Every string comes from the claim record: `peekStatement` and `statement` from
 * the claim, the confidence words from the grade map, the citation from the
 * citation. Nothing here is authored prose about the evidence (T1/GR-6).
 */
export function AdvicePeek({
  claim,
  why,
  kind = 'snapshot',
  onDismiss,
  onSuppress,
}: {
  claim: Claim;
  /** A fact about the user's own data — never a recommendation. */
  why?: string;
  kind?: 'general-evidence' | 'snapshot';
  onDismiss: () => void;
  onSuppress: () => void;
}): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const toneClass = `text-conf-${claim.grade.toLowerCase()}`;
  const visibleWhy = kind === 'snapshot' ? why : undefined;

  if (expanded) {
    return (
      <section
        data-testid="advice-peek"
        data-expanded="true"
        aria-label="Evidence"
        className="row-open border-t border-rule-strong bg-paper-sunk"
      >
        <button
          type="button"
          data-testid="advice-collapse"
          aria-label="Collapse"
          onClick={() => setExpanded(false)}
          className="flex min-h-[28px] w-full items-center justify-center"
        >
          <span aria-hidden="true" className="h-[3px] w-9 bg-rule-strong" />
        </button>

        {kind === 'general-evidence' && (
          <p className={`${LABEL} px-4 pb-1 text-ink-faint`}>General evidence</p>
        )}

        {visibleWhy && (
          <p data-testid="advice-why" className="px-4 pb-1 font-figure text-[14px] tabular-nums text-ink">
            {visibleWhy}
          </p>
        )}

        <ClaimCard claim={claim} />

        <div className="flex items-center justify-between gap-3 px-4 pb-4">
          <button
            type="button"
            data-testid="advice-suppress"
            onClick={onSuppress}
            className={`${LABEL} min-h-[44px] text-ink-faint ${TAP}`}
          >
            Don&rsquo;t show this again
          </button>
          <button
            type="button"
            data-testid="advice-dismiss"
            onClick={onDismiss}
            className={`${LABEL} min-h-[44px] text-ink ${TAP}`}
          >
            Close
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="advice-peek"
      data-expanded="false"
      aria-label="Evidence"
      className="border-t border-rule-strong bg-paper-sunk"
    >
      <div className="flex items-start gap-3 px-4 pt-2 pb-3">
        {/* Tap target covers the whole peek, so opening it never depends on a
            drag — drag is the least reliable gesture with wet hands. */}
        <button
          type="button"
          data-testid="advice-expand"
          onClick={() => setExpanded(true)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span className="min-w-0">
            {/* ConfidenceTicks carries its own words — DESIGN.md forbids the
                counter ever appearing without its label — so the label is NOT
                repeated here. It renders at full size however little room there
                is: principle 7 says the grade is as prominent as the claim, and
                a peek that shrinks it away is the skimmable badge this whole
                direction exists to refuse. */}
            <ConfidenceTicks grade={claim.grade} />
            {kind === 'general-evidence' && (
              <span className={`${LABEL} mt-1 block text-ink-faint`}>General evidence</span>
            )}
            {visibleWhy && <span className={`${LABEL} mt-1 block ${toneClass}`}>{visibleWhy}</span>}
            {/* The curated short form, never a truncation of the statement:
                an ellipsis cuts the qualifier, and the qualifier is what stops
                a low grade being read as a certainty. */}
            <span className="mt-1 block font-serif text-[14.5px] leading-[1.35] text-ink">
              {claim.peekStatement}
            </span>
          </span>
        </button>
        <button
          type="button"
          data-testid="advice-dismiss"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={`${LABEL} -mt-1 min-h-[44px] min-w-[32px] flex-none text-[16px] text-ink-faint ${TAP}`}
        >
          &times;
        </button>
      </div>
    </section>
  );
}

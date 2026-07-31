import { useMemo, useState, type ReactElement } from 'react';
import { ClaimCard } from '../../components/ClaimCard';
import { CLAIMS } from '../../generated/claims';
import { searchClaims } from '../../advice/search';
import { collapseClusters } from './AdviceFeed';
import type { Claim } from '../../advice/types';

/**
 * FR-ADV-3, the free-text surface: "what does the evidence say about X?".
 * Retrieval only decides *which* claims surface — it never authors text.
 * Results are turned into `Claim[][]` groups the exact same way the browse
 * feed does (`collapseClusters`), then handed to the same `ClaimCard`, so a
 * claim reached by typing carries the identical provenance a claim reached
 * by the rule engine carries (T1/GR-6).
 */
export function AskEvidence(): ReactElement {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const items = searchClaims(query, CLAIMS);
    const byId = new Map(CLAIMS.map((c) => [c.id, c]));
    const matched = items
      .map((item) => byId.get(item.claimId))
      .filter((c): c is Claim => c !== undefined);
    return collapseClusters(matched);
  }, [query]);

  const showNoMatch = query.trim() !== '' && groups.length === 0;

  return (
    <section className="mx-auto max-w-[480px] border-b border-rule px-4 py-4" aria-label="ask the evidence">
      <label
        htmlFor="ask-evidence-input"
        className="mb-2 block font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint"
      >
        what does the evidence say?
      </label>
      <input
        id="ask-evidence-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="try “deload” or “protein timing”"
        className="min-h-[44px] w-full border border-rule bg-paper px-3 font-serif text-[16px] text-ink"
      />
      {showNoMatch && (
        <p data-testid="no-match" className="mt-3 font-serif text-[13px] leading-[1.45] text-ink-soft">
          Nothing in the evidence base covers that yet.
        </p>
      )}
      {groups.map((group) => (
        <ClaimCard key={group[0].id} claim={group[0]} cluster={group.length > 1 ? group : undefined} />
      ))}
    </section>
  );
}

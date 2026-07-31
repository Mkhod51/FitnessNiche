import { useMemo, type ReactElement } from 'react';
import { ClaimCard } from '../../components/ClaimCard';
import { CLAIMS } from '../../generated/claims';
import { evaluateClaims, EMPTY_SNAPSHOT } from '../../advice/engine';
import type { Claim } from '../../advice/types';

const DOMAIN_LABEL_CLASS = 'px-4 pt-4 pb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

/**
 * Groups claims by `domain`, preserving first-seen order — CLAIMS is the
 * single source of order here, there is nothing to sort by.
 */
function groupByDomain(claims: Claim[]): [string, Claim[]][] {
  const groups = new Map<string, Claim[]>();
  for (const claim of claims) {
    const list = groups.get(claim.domain);
    if (list) list.push(claim);
    else groups.set(claim.domain, [claim]);
  }
  return [...groups.entries()];
}

/**
 * Collapses claims sharing a `clusterId` into a single group so the caller
 * renders one `ClaimCard` per contested pair, never two competing cards
 * (FR-ADV-6). Claims without a cluster, or the only member of one, pass
 * through untouched.
 */
export function collapseClusters(claims: Claim[]): Claim[][] {
  const seen = new Set<string>();
  const out: Claim[][] = [];
  for (const claim of claims) {
    if (seen.has(claim.id)) continue;
    const group = claim.clusterId ? claims.filter((c) => c.clusterId === claim.clusterId) : [claim];
    for (const member of group) seen.add(member.id);
    out.push(group);
  }
  return out;
}

/**
 * The M1 screen: a rule-triggered section that is honestly empty (no logging
 * exists yet, so `evaluateClaims` correctly returns nothing) and the full
 * evidence base underneath, grouped by domain, as what the app can already
 * do — browse 17 graded, cited claims — without pretending any of it is
 * personalised.
 */
export function AdviceFeed(): ReactElement {
  const domainGroups = useMemo(() => groupByDomain(CLAIMS), []);
  const ruleTriggered = useMemo(() => evaluateClaims(EMPTY_SNAPSHOT, CLAIMS), []);

  return (
    <div className="mx-auto max-w-[480px]">
      <section className="border-b border-rule px-4 py-4" aria-label="for you">
        {ruleTriggered.length === 0 ? (
          // Honest, but it must not cost a third of the first screen every visit —
          // the scene is a glance between sets. Same admission, fewer words, set as
          // a note rather than as the headline.
          <p data-testid="no-user-data" className="font-serif text-[13px] leading-[1.45] text-ink-soft">
            Nothing here is earned by your own data yet — logging ships next. Below is
            the evidence base itself, exactly as strong or as weak as the studies
            behind it.
          </p>
        ) : (
          // The engine pulls both sides of a contested cluster in (FR-ADV-6), so this
          // path has to collapse them exactly as the browse path does — otherwise the
          // two sides render as separate unlabelled cards that happen to disagree.
          collapseClusters(
            ruleTriggered
              .map((item) => CLAIMS.find((c) => c.id === item.claimId))
              .filter((c): c is Claim => c !== undefined),
          ).map((group) => (
            <ClaimCard key={group[0].id} claim={group[0]} cluster={group.length > 1 ? group : undefined} />
          ))
        )}
      </section>

      {domainGroups.map(([domain, claims]) => (
        <section key={domain}>
          <h2 className={DOMAIN_LABEL_CLASS}>{domain.replace(/-/g, ' ')}</h2>
          {collapseClusters(claims).map((group) => (
            <ClaimCard key={group[0].id} claim={group[0]} cluster={group.length > 1 ? group : undefined} />
          ))}
        </section>
      ))}
    </div>
  );
}

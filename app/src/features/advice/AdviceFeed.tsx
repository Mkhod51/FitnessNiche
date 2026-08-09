import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ClaimCard } from '../../components/ClaimCard';
import { CLAIMS } from '../../generated/claims';
import { evaluateClaims } from '../../advice/engine';
import type { AdviceItem, Claim } from '../../advice/types';
import { loadAdviceSnapshot } from '../../advice/load-snapshot';
import { filterNumbersHiddenAdvice } from '../../advice/session-advice';
import {
  recordAdviceShown,
  recentlyShownClaimIds,
  suppressedClaimIds,
} from '../../db/advice-events';
import { selectSurfaceAdvice } from '../../advice/surface-advice';

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
  const [ruleTriggered, setRuleTriggered] = useState<Claim[] | null>(null);
  const [emptyHubAdvice, setEmptyHubAdvice] = useState<{ claim: Claim; item: AdviceItem } | null>(null);
  const recordedClaimIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    loadAdviceSnapshot()
      .then(async (built) => {
        if (cancelled || built === null) return;
        const [suppressed, recent] = await Promise.all([
          suppressedClaimIds(),
          recentlyShownClaimIds(),
        ]);
        if (cancelled) return;
        const blocked = new Set([...suppressed, ...recent]);
        const { snapshot } = built;
        setRuleTriggered(
          filterNumbersHiddenAdvice(snapshot, CLAIMS, evaluateClaims(snapshot, CLAIMS))
            .filter((item) => !blocked.has(item.claimId))
            .map((item) => CLAIMS.find((claim) => claim.id === item.claimId))
            .filter((claim): claim is Claim => claim !== undefined),
        );

        if (!built.hasAnyLoggedData) {
          const item = selectSurfaceAdvice(
            { surface: 'hub-empty' },
            CLAIMS,
            {
              suppressedClaimIds: suppressed,
              recentlyShownClaimIds: recent,
            },
          );
          const claim = item ? CLAIMS.find((candidate) => candidate.id === item.claimId) : undefined;
          if (item && claim) setEmptyHubAdvice({ claim, item });
        }
      })
      // The evidence base remains browsable when storage is unavailable, but
      // the personalised section makes no claim about whether data exists.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!emptyHubAdvice || recordedClaimIds.current.has(emptyHubAdvice.claim.id)) return;
    recordedClaimIds.current.add(emptyHubAdvice.claim.id);
    void recordAdviceShown(
      emptyHubAdvice.claim.id,
      emptyHubAdvice.item.trigger,
      null,
      'hub-empty',
    ).catch(() => undefined);
  }, [emptyHubAdvice]);

  return (
    <div className="mx-auto max-w-[480px]">
      <section className="border-b border-rule px-4 py-4" aria-label="for you">
        {ruleTriggered === null ? null : ruleTriggered.length === 0 ? (
          // Honest, but it must not cost a third of the first screen every visit —
          // the scene is a glance between sets. Same admission, fewer words, set as
          // a note rather than as the headline.
          <p data-testid="no-user-data" className="font-serif text-[13px] leading-[1.45] text-ink-soft">
            Nothing here is earned by your own data yet. Below is the evidence base
            itself, exactly as strong or as weak as the studies behind it.
          </p>
        ) : (
          // The engine pulls both sides of a contested cluster in (FR-ADV-6), so this
          // path has to collapse them exactly as the browse path does — otherwise the
          // two sides render as separate unlabelled cards that happen to disagree.
          collapseClusters(
            ruleTriggered,
          ).map((group) => (
            <ClaimCard key={group[0].id} claim={group[0]} cluster={group.length > 1 ? group : undefined} />
          ))
        )}
      </section>

      {emptyHubAdvice && (
        <section
          aria-label="General evidence"
          className="border-b border-rule pt-4"
        >
          <h2 className="px-4 pb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            General evidence
          </h2>
          <ClaimCard claim={emptyHubAdvice.claim} />
        </section>
      )}

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

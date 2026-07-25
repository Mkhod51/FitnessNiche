import MiniSearch from 'minisearch';
import type { AdviceItem, Claim } from './types';
import { renderHeadline } from './language';
import { EMPTY_SNAPSHOT } from './engine';

/**
 * Index `statement` and `domain` only — never citation text. Indexing a
 * citation would let a query match an author's surname and surface an
 * unrelated claim, which is a relevance failure that looks like a provenance
 * failure to a user.
 */
export function buildIndex(claims: Claim[]): MiniSearch<Claim> {
  const index = new MiniSearch<Claim>({ fields: ['statement', 'domain'] });
  index.addAll(claims);
  return index;
}

/**
 * Free-text retrieval over the bundled claim base. Keyword search only — no
 * LLM anywhere in this path (T1/GR-6). A match is turned into an `AdviceItem`
 * the exact same way the rule engine does, so search is bound by the same
 * provenance contract as the rule-triggered path: same `trigger` shape, same
 * `renderHeadline`, same `EMPTY_SNAPSHOT`.
 */
export function searchClaims(query: string, claims: Claim[]): AdviceItem[] {
  if (query.trim() === '') return [];

  const index = buildIndex(claims);
  // combineWith 'AND': a domain like "protein-timing" tokenizes into "protein"
  // and "timing", and OR'd terms turned that into a match against almost every
  // protein claim in the base — the same relevance failure the "don't index
  // citations" rule exists to prevent, just arriving from a different field.
  const hits = index.search(query, { prefix: true, fuzzy: 0.2, combineWith: 'AND' });
  const byId = new Map(claims.map((c) => [c.id, c]));

  const selected = new Map<string, Claim>();
  for (const hit of hits) {
    const found = byId.get(hit.id as string);
    if (!found) continue;
    selected.set(found.id, found);
    // FR-ADV-6: a contested claim never travels alone, same rule the engine
    // applies — both sides render.
    if (found.status === 'contested' && found.clusterId) {
      for (const sibling of claims) {
        if (sibling.clusterId === found.clusterId) selected.set(sibling.id, sibling);
      }
    }
  }

  return [...selected.values()].map((claim) => ({
    claimId: claim.id,
    trigger: 'query' as const,
    headline: renderHeadline(claim),
    snapshot: EMPTY_SNAPSHOT,
  }));
}

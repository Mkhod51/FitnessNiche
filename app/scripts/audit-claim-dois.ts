import { fileURLToPath } from 'node:url';
import { buildClaims, CLAIMS_DIR, readClaimSources } from './build-claims.ts';
import type { Citation } from '../src/advice/types.ts';

export type DoiAuditResult =
  | { doi: string; resolved: true }
  | { doi: string; resolved: false; reason: string };

async function resolveDoi(doi: string, fetcher: typeof fetch): Promise<DoiAuditResult> {
  const response = await fetcher(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);

  if (response.ok) return { doi, resolved: true };

  // A missing/invalid DOI is review data. Rate limits and 5xx responses mean the
  // audit could not reach its authority, so make the manual command fail loudly.
  if (response.status === 429 || response.status >= 500) {
    throw new Error(`Crossref unavailable: ${response.status} ${response.statusText}`.trim());
  }

  return {
    doi,
    resolved: false,
    reason: response.statusText || `Crossref returned HTTP ${response.status}`,
  };
}

/**
 * Resolves a batch of distinct DOIs for human curation review. This is intentionally
 * separate from the deterministic claim compiler and accepts an injected fetcher so
 * tests never make scholarly network requests.
 */
export async function auditClaimDois(
  citations: Pick<Citation, 'doi'>[],
  fetcher: typeof fetch = fetch,
): Promise<DoiAuditResult[]> {
  const dois = [...new Set(citations.map(({ doi }) => doi))];
  return Promise.all(dois.map((doi) => resolveDoi(doi, fetcher)));
}

async function runAudit(): Promise<void> {
  const claims = buildClaims(readClaimSources(CLAIMS_DIR));
  const results = await auditClaimDois(claims.flatMap(({ citations }) => citations));
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAudit().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`DOI audit could not complete: ${message}\n`);
    process.exitCode = 1;
  });
}

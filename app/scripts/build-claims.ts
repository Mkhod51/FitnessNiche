import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { claimSchema } from '../src/advice/claim-schema.ts';
import type { Claim } from '../src/advice/types.ts';

export { validatePredicate } from '../src/advice/claim-schema.ts';

export interface ClaimSource {
  file: string;
  yaml: string;
}

export function buildClaims(sources: ClaimSource[]): Claim[] {
  const claims: Claim[] = [];

  for (const { file, yaml } of sources) {
    let raw: unknown;
    try {
      raw = parse(yaml);
    } catch (e) {
      throw new Error(`${file}: not valid YAML — ${(e as Error).message}`);
    }
    const result = claimSchema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new Error(`${file}: invalid claim\n${issues}`);
    }
    const claim = result.data as Claim;
    if (`${claim.id}.yaml` !== basename(file)) {
      throw new Error(`${file}: filename must match the claim id (expected ${claim.id}.yaml)`);
    }
    claims.push(claim);
  }

  const seen = new Set<string>();
  for (const c of claims) {
    if (seen.has(c.id)) throw new Error(`duplicate claim id: ${c.id}`);
    seen.add(c.id);
  }

  // Citation ids key the evidence panel's React list within a single claim, so a
  // collision there silently drops a source and the claim renders fewer papers than
  // it stores. Across claims they may repeat — two claims can cite the same paper.
  for (const c of claims) {
    const citationIds = new Set<string>();
    for (const cit of c.citations) {
      if (citationIds.has(cit.id)) {
        throw new Error(`${c.id}: duplicate citation id "${cit.id}" within one claim`);
      }
      citationIds.add(cit.id);
    }
  }

  for (const c of claims) {
    if (c.supersededBy === c.id) {
      throw new Error(`${c.id}: supersededBy points at itself`);
    }
    if (c.supersededBy !== null && !seen.has(c.supersededBy)) {
      throw new Error(`${c.id}: supersededBy points at ${c.supersededBy}, which does not exist`);
    }
  }

  // FR-ADV-6: a contested claim alone in its cluster renders one side and calls it
  // nuance. That is the exact failure this product exists to refuse, so it is a
  // build error rather than a lint warning.
  // The UI decides "contested" from cluster size alone, so a settled claim sharing a
  // clusterId would be rendered under a "contested — both sides shown" banner and
  // misrepresented as a live controversy.
  for (const c of claims) {
    if (c.clusterId !== null && c.status !== 'contested') {
      throw new Error(`${c.id}: only a contested claim may carry a clusterId (status is "${c.status}")`);
    }
  }

  const clusterSizes = new Map<string, number>();
  for (const c of claims) {
    if (c.clusterId) clusterSizes.set(c.clusterId, (clusterSizes.get(c.clusterId) ?? 0) + 1);
  }
  for (const c of claims) {
    if (c.status === 'contested' && clusterSizes.get(c.clusterId as string) === 1) {
      throw new Error(
        `${c.id}: contested claim is alone in cluster "${c.clusterId}" — a contested claim needs an opposing claim in the same cluster`,
      );
    }
  }

  return claims.sort((a, b) => a.id.localeCompare(b.id));
}

export function renderModule(claims: Claim[]): string {
  return [
    '// GENERATED FILE — do not edit by hand.',
    '// Source: app/claims/*.yaml. Regenerate with `npm run claims`.',
    '// scripts/build-claims.test.ts fails if this file drifts from the YAML.',
    "import type { Claim } from '../advice/types.ts';",
    '',
    `export const CLAIMS: Claim[] = ${JSON.stringify(claims, null, 2)};`,
    '',
  ].join('\n');
}

export function readClaimSources(dir: string): ClaimSource[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => ({ file: join(dir, f), yaml: readFileSync(join(dir, f), 'utf8') }));
}

const here = dirname(fileURLToPath(import.meta.url));
export const CLAIMS_DIR = join(here, '..', 'claims');
export const OUTPUT_PATH = join(here, '..', 'src', 'generated', 'claims.ts');

// Only run the CLI when invoked directly, so the test can import the module freely.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const claims = buildClaims(readClaimSources(CLAIMS_DIR));
  writeFileSync(OUTPUT_PATH, renderModule(claims));
  console.log(`wrote ${claims.length} claims to ${OUTPUT_PATH}`);
}

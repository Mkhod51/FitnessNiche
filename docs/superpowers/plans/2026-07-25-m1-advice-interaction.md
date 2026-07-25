# M1 — The A+C Interaction on Real Claims: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a browsable, searchable, evidence-graded advice surface driven by 15–20 hand-curated claims, where the grade is as prominent as the claim, dissent is first-class, and no advice can render without a stored `claim_id`.

**Architecture:** Claims are hand-authored YAML in `app/claims/`. A build-time script (`scripts/build-claims.ts`) validates them with Zod and emits a typed TypeScript module, `src/generated/claims.ts`. A malformed or grade-less claim fails generation, and a drift test fails the suite if the committed bundle no longer matches the YAML — that is the T1 compile-time gate. At runtime a deterministic `json-logic-js` evaluator matches claim predicates against a `UserStateSnapshot`; `minisearch` powers the free-text surface. React components render claim · grade · citation **only** from claim records. No LLM anywhere in the runtime path.

**Tech Stack:** Existing — Vite 8 / React 19 / TS 6 strict / Tailwind v4 / Vitest 4 / Playwright. Added this milestone — `zod` + `yaml` (devDependencies, build-time only), `json-logic-js` + `@types/json-logic-js`, `minisearch`.

## Global Constraints

Every task inherits these. Values are verbatim from `docs/REQUIREMENTS.md` and `app/CLAUDE.md`.

- **Repo path contains a space:** `/Users/mkhoder/Career/Internship apps /Projects/FitnessNiche`. There is a space after `apps`. Quote every path in every shell command.
- **T1 / GR-6 / AC-4** — no code path may render advice without a stored `claim_id`. Citations and grades render **only** from claim records, never hand-written in a component, never produced by a model at runtime. **No LLM in the runtime trust path.**
- **FR-ADV-5** — advice phrasing derives from the grade via a fixed, exhaustive map. A `[C]` claim must be structurally incapable of rendering "proven".
- **FR-ADV-6** — a `contested` claim surfaces its whole cluster and the UI renders both sides, steelmanned. Not one side with a hedge.
- **FR-ADV-8** — every figure card shows **sample size (n)** and **trained/untrained population** as first-class fields, never footnotes.
- **GR-3** — re-plot extracted numbers in our own chart style. **Never embed a publisher's figure image.** Short attributed quotes only.
- **GR-4** — no individualized MEV/MRV. Population statistics are never presented as personal predictions.
- **GR-2** — wellness framing only. No disease detection, monitoring, management, or screening.
- **GR-1** — harm guards (calorie floor, ≤500 kcal/day deficit cap, maintenance default, numbers-hidden mode) land in M3 via `src/domain/guards.ts` as a single choke point. **Do not create a competing path in M1.**
- **NFR-6 accessibility** — the design case is one hand, phone at arm's length, ~90 seconds between sets. Contrast, touch targets, screen-reader labels are requirements, not polish.
- **Design mandate (PRODUCT.md principle 7, risk D3)** — nuance is the **default state**, not a disclosure layer. The grade must be as prominent as the claim. If nuance only appears when someone digs, the thesis has already failed.
- **M1 has no user data.** Logging arrives in M2. The advice surface must be honest and useful against an empty database. **Never mock up fake user data to make the UI look alive.**
- **Commits** — small, frequent, human-sounding, lowercase, no conventional-commit prefixes, no AI attribution footers. Commit at every green step, not once per task.
- **Definition of done** — `npm run typecheck && npm test -- --run && npm run build && npm run e2e` all green, from `app/`.

---

## File Structure

**Created this milestone:**

| Path | Responsibility |
|---|---|
| `app/claims/schema.md` | Authored-format doc: every field, what it means, what may be null and why |
| `app/claims/c-*.yaml` | The claim base. One claim per file. Hand-authored by Opus |
| `app/scripts/build-claims.ts` | `buildClaims(inputs) → Claim[]` pure fn + CLI that writes `src/generated/claims.ts` |
| `app/src/advice/types.ts` | `Grade`, `Citation`, `Claim`, `UserStateSnapshot`, `AdviceItem` — pinned in BUILD-PLAN §Interfaces |
| `app/src/advice/claim-schema.ts` | Zod schemas mirroring `types.ts`. Build-time validation only |
| `app/src/generated/claims.ts` | Generated. `export const CLAIMS: Claim[]`. Committed |
| `app/src/advice/language.ts` | Grade → calibrated verb map (FR-ADV-5) + `renderHeadline` |
| `app/src/advice/engine.ts` | `evaluateClaims(snapshot, claims)` + `buildPredicateContext` |
| `app/src/advice/search.ts` | minisearch index over the claim base (FR-ADV-3) |
| `app/src/components/GradeChip.tsx` | The grade, rendered from a claim record |
| `app/src/components/ClaimCard.tsx` | Decisive default + chip; contested variant renders both sides |
| `app/src/components/EvidencePanel.tsx` | Tap-1 "why", tap-2 the studies |
| `app/src/components/FigureChart.tsx` | Re-plotted extracted numbers, hand-rolled SVG, n + population first-class |
| `app/src/features/advice/AdviceFeed.tsx` | The feed page + honest empty state |
| `app/src/features/advice/AskEvidence.tsx` | Free-text "what does the evidence say about X" |
| `app/src/provenance.test.ts` | AC-4 enforcement: source-level + render-level |
| `DESIGN.md` (repo root) | The visual world. Produced by the `impeccable` skill in Task 6 |

**Modified:** `app/package.json`, `app/tsconfig.node.json`, `app/src/App.tsx`, `app/src/App.test.tsx`, `app/e2e/*.spec.ts`, `.github/workflows/ci.yml`.

## Architecture decisions locked before Task 1

These were decided by the orchestrator during planning. Implementers follow them; they do not relitigate them. All three go in `docs/00-meta/decision-log.md` at milestone end.

1. **The generated bundle is TypeScript, not JSON, and it is committed.** `build-claims.ts` emits `src/generated/claims.ts` typed as `Claim[]`. Three gates stack: Zod validates at generation time (catches DOI shape, date format, enum violations); `tsc` validates the committed output against the pinned types; a drift test re-runs the generator in-memory and fails if the committed file no longer matches the YAML. Committing it means `test`, `typecheck` and `build` need no generation step ordering, and CI catches drift anyway.
2. **Charts are hand-rolled SVG at M1, not recharts.** BUILD-PLAN pins recharts *"custom SVG only if a band/annotation need exceeds it"*. M1's only chart need is a CI/effect-size strip with n and population as first-class labels — exactly an annotation need, and ~40 lines of SVG against ~100 KB of library. Revisit at M2 when trend charts with confidence bands arrive. This is the stated escape hatch, not a stack deviation.
3. **No `react-router` at M1.** The milestone is one screen with in-card progressive disclosure. Add it in M2 when logging screens create a second route. YAGNI.

---

## Task 1: Claim types, Zod schema, and the authored-format doc

**Files:**
- Create: `app/src/advice/types.ts`
- Create: `app/src/advice/claim-schema.ts`
- Create: `app/src/advice/claim-schema.test.ts`
- Create: `app/claims/schema.md`
- Modify: `app/package.json` (add dependencies)
- Modify: `app/tsconfig.node.json` (typecheck `scripts/`)

**Interfaces:**
- Consumes: nothing.
- Produces: `Grade`, `Citation`, `Claim`, `UserStateSnapshot`, `AdviceItem` from `src/advice/types.ts`; `claimSchema`, `claimsFileSchema` from `src/advice/claim-schema.ts`. Every later task imports types from `types.ts`.

- [ ] **Step 1: Install dependencies**

From `app/`:

```bash
npm install json-logic-js minisearch
npm install --save-dev zod yaml @types/json-logic-js
```

`zod` and `yaml` are devDependencies deliberately — they run only in `scripts/` and tests, never in the shipped bundle. If you find yourself needing `zod` at runtime, stop: that means something is parsing claims at runtime, which the generated-TypeScript design exists to avoid.

- [ ] **Step 2: Typecheck the scripts directory**

`app/tsconfig.node.json` currently includes only `vite.config.ts` and `playwright.config.ts`, so anything in `scripts/` would have **zero** typecheck coverage — the same gap that was found and fixed as finding F1 in M0. Change the `include` array to:

```json
  "include": ["vite.config.ts", "playwright.config.ts", "scripts/**/*.ts"]
```

Verify the coverage is real by temporarily adding `const broken: number = 'x';` to a scratch file `app/scripts/tmp-check.ts`, running `npm run typecheck`, confirming it FAILS, then deleting the scratch file and confirming it passes again. Do not skip this — a typecheck config that silently covers nothing is worse than none.

- [ ] **Step 3: Write `src/advice/types.ts`**

These signatures are pinned in `docs/BUILD-PLAN.md` §Interfaces. Do not rename fields.

```ts
export type Grade = 'A' | 'B' | 'C' | 'D';

export type Population = 'trained' | 'untrained' | 'mixed';

/** A single extracted number, re-plotted in our own chart style (GR-3). */
export interface Figure {
  label: string;
  value: number;
  unit?: string;
}

export interface Citation {
  id: string;
  claimId: string;
  doi: string;
  authors: string;
  year: number;
  journal: string;
  /** Sample size. null when the source did not state one we could read. */
  n: number | null;
  population: Population;
  /** null when not extractable from a source we actually read. Never inferred. */
  effectSize: string | null;
  ci: string | null;
  figures: Figure[];
  quote: string | null;
}

/** A json-logic rule. Opaque here; evaluated by src/advice/engine.ts. */
export type JsonLogicRule = Record<string, unknown>;

export interface Claim {
  id: string;
  statement: string;
  grade: Grade;
  status: 'settled' | 'contested';
  domain: string;
  /** null = the claim is only ever surfaced via search, never rule-triggered. */
  predicates: JsonLogicRule | null;
  /** Contested claims sharing a clusterId are opposing sides of one question. */
  clusterId: string | null;
  phrasingKey: string;
  supersededBy: string | null;
  /** ISO date, YYYY-MM-DD. FR-CLAIM-4. */
  lastReviewed: string;
  citations: Citation[];
}

export interface UserStateSnapshot {
  goal: 'cut' | 'bulk' | 'maintain';
  deficitWeeks: number;
  weightTrend: 'down_fast' | 'down' | 'flat' | 'up' | 'unknown';
  e1rmTrend: 'up' | 'holding' | 'down' | 'insufficient_data';
  weeklySetsByMuscle: Record<string, number>;
  proteinPerKg7d: number | null;
  numbersHidden: boolean;
}

export interface AdviceItem {
  claimId: string;
  trigger: 'rule' | 'query' | 'data-earned';
  /** Calibrated-language rendering, grade-derived. Never free text. */
  headline: string;
  snapshot: UserStateSnapshot;
}
```

- [ ] **Step 4: Write the failing schema test**

Create `app/src/advice/claim-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { claimSchema } from './claim-schema';

const valid = {
  id: 'c-test-example',
  statement: 'A statement.',
  grade: 'A',
  status: 'settled',
  domain: 'volume',
  predicates: null,
  clusterId: null,
  phrasingKey: 'test-example',
  supersededBy: null,
  lastReviewed: '2026-07-25',
  citations: [
    {
      id: 'cit-test-1',
      claimId: 'c-test-example',
      doi: '10.1080/02640414.2016.1210197',
      authors: 'Someone A, Another B',
      year: 2017,
      journal: 'Journal of Sports Sciences',
      n: 42,
      population: 'trained',
      effectSize: null,
      ci: null,
      figures: [],
      quote: null,
    },
  ],
};

describe('claimSchema', () => {
  it('accepts a well-formed claim', () => {
    expect(() => claimSchema.parse(valid)).not.toThrow();
  });

  it('rejects a claim with no grade', () => {
    const { grade: _drop, ...noGrade } = valid;
    expect(() => claimSchema.parse(noGrade)).toThrow();
  });

  it('rejects a grade outside A-D', () => {
    expect(() => claimSchema.parse({ ...valid, grade: 'S' })).toThrow();
  });

  it('rejects a claim with zero citations', () => {
    expect(() => claimSchema.parse({ ...valid, citations: [] })).toThrow();
  });

  it('rejects a doi that is not a doi', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], doi: 'see the paper' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a citation whose claimId does not match its parent claim', () => {
    const bad = { ...valid, citations: [{ ...valid.citations[0], claimId: 'c-something-else' }] };
    expect(() => claimSchema.parse(bad)).toThrow();
  });

  it('rejects a lastReviewed that is not an ISO date', () => {
    expect(() => claimSchema.parse({ ...valid, lastReviewed: 'July 2026' })).toThrow();
  });

  it('rejects a contested claim with no clusterId', () => {
    expect(() => claimSchema.parse({ ...valid, status: 'contested' })).toThrow();
  });

  it('accepts a contested claim that has a clusterId', () => {
    const ok = { ...valid, status: 'contested', clusterId: 'protein-timing' };
    expect(() => claimSchema.parse(ok)).not.toThrow();
  });

  it('accepts null n, effectSize and ci — an unreadable figure is honest, an invented one is not', () => {
    const sparse = {
      ...valid,
      citations: [{ ...valid.citations[0], n: null, effectSize: null, ci: null }],
    };
    expect(() => claimSchema.parse(sparse)).not.toThrow();
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
npm test -- --run src/advice/claim-schema.test.ts
```

Expected: FAIL — cannot resolve `./claim-schema`.

- [ ] **Step 6: Write `src/advice/claim-schema.ts`**

```ts
import { z } from 'zod';

const doi = z.string().regex(/^10\.\d{4,9}\/\S+$/, 'must be a bare DOI, e.g. 10.1080/02640414.2016.1210197');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date, YYYY-MM-DD');

const figureSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1).optional(),
});

const citationSchema = z.object({
  id: z.string().min(1),
  claimId: z.string().min(1),
  doi,
  authors: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  journal: z.string().min(1),
  // null is legitimate and load-bearing: it means "not stated in a source we read".
  // Leaving it null is honest; filling it from a secondary source's description is not.
  n: z.number().int().positive().nullable(),
  population: z.enum(['trained', 'untrained', 'mixed']),
  effectSize: z.string().min(1).nullable(),
  ci: z.string().min(1).nullable(),
  figures: z.array(figureSchema),
  quote: z.string().min(1).nullable(),
});

export const claimSchema = z
  .object({
    id: z.string().regex(/^c-[a-z0-9-]+$/),
    statement: z.string().min(1),
    grade: z.enum(['A', 'B', 'C', 'D']),
    status: z.enum(['settled', 'contested']),
    domain: z.string().min(1),
    predicates: z.record(z.string(), z.unknown()).nullable(),
    clusterId: z.string().min(1).nullable(),
    phrasingKey: z.string().min(1),
    supersededBy: z.string().nullable(),
    lastReviewed: isoDate,
    // FR-ADV-1: a claim with no citation is not a claim.
    citations: z.array(citationSchema).min(1),
  })
  // FR-ADV-6: a contested claim must name the cluster it argues within, or the UI
  // has no way to find the other side and would render one-sided nuance.
  .refine((c) => c.status !== 'contested' || c.clusterId !== null, {
    message: 'a contested claim must have a clusterId so the opposing side can be found',
    path: ['clusterId'],
  })
  .refine((c) => c.citations.every((cit) => cit.claimId === c.id), {
    message: 'every citation must carry its parent claim id',
    path: ['citations'],
  });

export const claimsFileSchema = z.array(claimSchema);
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
npm test -- --run src/advice/claim-schema.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 8: Commit**

```bash
git add app/src/advice app/package.json app/package-lock.json app/tsconfig.node.json
git commit -m "pin the claim shape and make a grade-less claim fail validation"
```

- [ ] **Step 9: Write `app/claims/schema.md`**

This is the authored-format doc a human reads before writing a claim by hand. It must document every field in `Claim` and `Citation`: what it means, what values are legal, and — critically — **which fields may be null and why leaving them null is the correct action rather than a failure**. Include verbatim:

> **`n`, `effectSize`, `ci`, `quote` may be null.** Much of this literature is paywalled. An abstract usually gives you n and the direction of effect but rarely the confidence interval. If you could not read the number in the source document itself, the field stays null and the UI renders the absence honestly. **Never fill a field from a secondary source's description of a paper, from a search-engine summary, or from memory of "typical values". A missing CI is honest; an invented one is fraud.**

Also document: the `c-<domain>-<slug>` id convention; that `predicates: null` means search-only; that `clusterId` is mandatory for contested claims; that `lastReviewed` is FR-CLAIM-4 and is the date a human last checked the claim against the literature, not the date the file was edited; and that figures exist so numbers can be **re-plotted in our own chart style** because publisher figure images may never be embedded (GR-3).

- [ ] **Step 10: Commit**

```bash
git add app/claims/schema.md
git commit -m "write down how to author a claim by hand"
```

---

## Task 2: The claim build script and its drift gate

**Files:**
- Create: `app/scripts/build-claims.ts`
- Create: `app/scripts/build-claims.test.ts`
- Modify: `app/package.json` (add the `claims` script)

**Interfaces:**
- Consumes: `Claim` from `src/advice/types.ts`; `claimSchema` from `src/advice/claim-schema.ts`.
- Produces: `buildClaims(sources: { file: string; yaml: string }[]): Claim[]` and `renderModule(claims: Claim[]): string` from `scripts/build-claims.ts`. Task 3's claim files are validated by this. Task 4 onward import `CLAIMS` from `src/generated/claims.ts`.

**Note on running TypeScript directly:** Node 25 (local) and Node ≥22.18 strip types natively, so `node scripts/build-claims.ts` works with no loader. CI currently pins `node-version: 22`; bump it to `24` in `.github/workflows/ci.yml` as part of this task so local and CI agree. Do not add `tsx` or `ts-node` — a whole dependency to run one script is not worth it.

- [ ] **Step 1: Write the failing test**

Create `app/scripts/build-claims.test.ts`. Note the test drives `buildClaims` with **inline YAML strings**, not files — so this task does not depend on Task 3's real claims existing yet.

```ts
import { describe, it, expect } from 'vitest';
import { buildClaims, renderModule } from './build-claims';

const goodYaml = `
id: c-test-volume
statement: A statement about volume.
grade: A
status: settled
domain: volume
predicates: null
clusterId: null
phrasingKey: test-volume
supersededBy: null
lastReviewed: 2026-07-25
citations:
  - id: cit-test-1
    claimId: c-test-volume
    doi: 10.1080/02640414.2016.1210197
    authors: Someone A
    year: 2017
    journal: Journal of Sports Sciences
    n: 42
    population: trained
    effectSize: null
    ci: null
    figures: []
    quote: null
`;

describe('buildClaims', () => {
  it('parses a well-formed claim file', () => {
    const claims = buildClaims([{ file: 'c-test-volume.yaml', yaml: goodYaml }]);
    expect(claims).toHaveLength(1);
    expect(claims[0].id).toBe('c-test-volume');
    expect(claims[0].grade).toBe('A');
  });

  it('names the offending file when a claim is malformed', () => {
    const bad = goodYaml.replace('grade: A', 'grade: S');
    expect(() => buildClaims([{ file: 'c-bad.yaml', yaml: bad }])).toThrow(/c-bad\.yaml/);
  });

  it('rejects a claim whose id does not match its filename', () => {
    expect(() => buildClaims([{ file: 'c-wrong-name.yaml', yaml: goodYaml }])).toThrow(/filename/i);
  });

  it('rejects duplicate claim ids across files', () => {
    const dup = [
      { file: 'c-test-volume.yaml', yaml: goodYaml },
      { file: 'c-test-volume.yaml', yaml: goodYaml },
    ];
    expect(() => buildClaims(dup)).toThrow(/duplicate/i);
  });

  it('rejects a supersededBy pointing at a claim that does not exist', () => {
    const dangling = goodYaml.replace('supersededBy: null', 'supersededBy: c-nope');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: dangling }])).toThrow(/c-nope/);
  });

  it('rejects a contested claim that is alone in its cluster', () => {
    const lonely = goodYaml
      .replace('status: settled', 'status: contested')
      .replace('clusterId: null', 'clusterId: lonely-cluster');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: lonely }])).toThrow(/cluster/i);
  });

  it('sorts output by id so the generated file is stable across runs', () => {
    const second = goodYaml
      .replace('c-test-volume', 'c-a-first')
      .replace('phrasingKey: test-volume', 'phrasingKey: a-first');
    const claims = buildClaims([
      { file: 'c-test-volume.yaml', yaml: goodYaml },
      { file: 'c-a-first.yaml', yaml: second },
    ]);
    expect(claims.map((c) => c.id)).toEqual(['c-a-first', 'c-test-volume']);
  });
});

describe('renderModule', () => {
  it('emits a typed module importing the pinned Claim type', () => {
    const out = renderModule(buildClaims([{ file: 'c-test-volume.yaml', yaml: goodYaml }]));
    expect(out).toContain("import type { Claim } from '../advice/types.ts'");
    expect(out).toContain('export const CLAIMS: Claim[]');
    expect(out).toContain('c-test-volume');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- --run scripts/build-claims.test.ts
```

Expected: FAIL — cannot resolve `./build-claims`.

Note: `vite.config.ts` sets `test.exclude: ['e2e/**', 'node_modules/**']`, so `scripts/` is already picked up by vitest. No config change needed.

- [ ] **Step 3: Implement `scripts/build-claims.ts`**

```ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { claimSchema } from '../src/advice/claim-schema.ts';
import type { Claim } from '../src/advice/types.ts';

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

  for (const c of claims) {
    if (c.supersededBy !== null && !seen.has(c.supersededBy)) {
      throw new Error(`${c.id}: supersededBy points at ${c.supersededBy}, which does not exist`);
    }
  }

  // FR-ADV-6: a contested claim alone in its cluster renders one side and calls it
  // nuance. That is the exact failure this product exists to refuse, so it is a
  // build error rather than a lint warning.
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- --run scripts/build-claims.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Add the `claims` script and create the output directory**

In `app/package.json` scripts, add:

```json
    "claims": "node scripts/build-claims.ts",
```

Create `app/src/generated/` and generate an initial empty bundle so `typecheck` has something to resolve. With no YAML files yet:

```bash
mkdir -p src/generated
npm run claims
```

Expected: `wrote 0 claims to .../src/generated/claims.ts`.

- [ ] **Step 6: Write the drift test**

Append to `app/scripts/build-claims.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { buildClaims as build, renderModule as render, readClaimSources, CLAIMS_DIR, OUTPUT_PATH } from './build-claims';

describe('the committed bundle', () => {
  // This is the T1 build gate. The generated module is committed so that test,
  // typecheck and build need no generation-ordering dance — which only works if
  // something fails loudly when it goes stale. This is that something.
  it('matches the claim YAML on disk', () => {
    const expected = render(build(readClaimSources(CLAIMS_DIR)));
    const actual = readFileSync(OUTPUT_PATH, 'utf8');
    expect(actual).toBe(expected);
  });
});
```

- [ ] **Step 7: Prove the drift test actually catches drift**

Do not skip this. A drift gate that cannot fail is worse than none — M0 shipped a contract test that tested a hand-copied duplicate of the adapter and caught nothing.

```bash
printf '\n// deliberate drift\n' >> src/generated/claims.ts
npm test -- --run scripts/build-claims.test.ts
```

Expected: FAIL on "matches the claim YAML on disk". Then restore and confirm green:

```bash
npm run claims
npm test -- --run scripts/build-claims.test.ts
```

Expected: PASS.

- [ ] **Step 8: Bump CI to Node 24**

In `.github/workflows/ci.yml`, change `node-version: 22` to `node-version: 24`. Node must strip TypeScript natively for `npm run claims` to work without a loader.

- [ ] **Step 9: Full suite and commit**

```bash
npm run typecheck && npm test -- --run && npm run build
```

Expected: all green.

```bash
git add app/scripts app/package.json app/src/generated .github/workflows/ci.yml
git commit -m "turn hand-written claim yaml into a typed bundle, and fail the build when it drifts"
```

---

## Task 3: Curate 15–20 claims *(ORCHESTRATOR ONLY — Opus)*

**This task is not dispatched to a subagent.** BUILD-PLAN's model routing reserves claim curation and grading judgment for the main session. A Sonnet subagent must not author, grade, or fill figures for any claim.

**Files:** Create `app/claims/c-*.yaml` (15–20 files); regenerate `app/src/generated/claims.ts`.

Full procedure, hard rules, and the per-claim verification chain are in the curation contract in the milestone kickoff and in `docs/00-meta/evidence-standards.md`. Summarised gates:

- Discovery leads with PubMed E-utilities publication-type filters (`"Meta-Analysis"[pt]`, `"Systematic Review"[pt]`, `"Randomized Controlled Trial"[pt]`, `systematic[sb]`) — find the synthesis before the primary trials, because the rubric defines `[A]` by study design and grading upward from whatever turned up first is how grade inflation happens.
- Every DOI resolves against OpenAlex or CrossRef, independently of wherever it was discovered.
- Every extracted number is read in the source document. Chain is **discovery → resolve the DOI → read the source → extract**. Skipping the middle two steps is how this product ships a fabricated citation.
- Unsourced fields stay `null`.
- Grade per the rubric. FR-CLAIM-5: a trained-population claim supported only by untrained studies drops a grade.
- Protein timing is the required contested exemplar and must render both sides steelmanned.
- `lastReviewed` on every claim.

**Topic coverage (BUILD-PLAN §M1):** volume · frequency · protein dose · protein timing (contested) · failure proximity · bulk rate · deloads · rest intervals.

- [ ] **Step 1:** Confirm research tooling. `perplexity`/`firecrawl` MCPs are unavailable in a session started outside the repo directory; fall back to `WebSearch` + `WebFetch` against the PubMed, Europe PMC, OpenAlex and CrossRef HTTP APIs, and record which was used.
- [ ] **Step 2:** Curate each topic in turn. Commit per claim or per small group, never one big drop.
- [ ] **Step 3:** `npm run claims` after each claim; `npm test -- --run` to confirm schema and cluster rules hold.
- [ ] **Step 4:** Hostile re-read. Read every claim as an evidence-literate lifter looking to catch you out. If a grade looks generous, it is. Downgrade before committing.
- [ ] **Step 5:** Full suite green, then commit the regenerated bundle.

---

## Task 4: Grade-calibrated language

**Files:**
- Create: `app/src/advice/language.ts`
- Create: `app/src/advice/language.test.ts`

**Interfaces:**
- Consumes: `Grade`, `Claim` from `src/advice/types.ts`.
- Produces: `GRADE_LANGUAGE: Record<Grade, GradeLanguage>`, `interface GradeLanguage { verb: string; confidence: string; chipLabel: string }`, and `renderHeadline(claim: Claim): string` from `src/advice/language.ts`. Tasks 5, 7a and 8 import these.

This task does **not** depend on Task 3 — it needs only the `Grade` type — so it may run in parallel with curation.

- [ ] **Step 1: Write the failing test**

Create `app/src/advice/language.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GRADE_LANGUAGE, renderHeadline } from './language';
import type { Claim, Grade } from './types';

const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

// Words that assert certainty. FR-ADV-5 says a [C] claim must be structurally
// incapable of rendering "proven"; this is the list that makes "structurally"
// mean something testable.
const CERTAINTY_WORDS = [
  'proven', 'proves', 'proof', 'definitive', 'definitively', 'conclusive',
  'conclusively', 'guaranteed', 'guarantees', 'certain', 'established fact',
  'settled science', 'always', 'never fails', 'optimal',
];

function claimWith(grade: Grade): Claim {
  return {
    id: 'c-test-x',
    statement: 'Training more produces more growth',
    grade,
    status: 'settled',
    domain: 'volume',
    predicates: null,
    clusterId: null,
    phrasingKey: 'test-x',
    supersededBy: null,
    lastReviewed: '2026-07-25',
    citations: [],
  };
}

describe('GRADE_LANGUAGE', () => {
  it('covers every grade and nothing else', () => {
    expect(Object.keys(GRADE_LANGUAGE).sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('gives every grade a non-empty verb, confidence and chip label', () => {
    for (const g of GRADES) {
      expect(GRADE_LANGUAGE[g].verb.length).toBeGreaterThan(0);
      expect(GRADE_LANGUAGE[g].confidence.length).toBeGreaterThan(0);
      expect(GRADE_LANGUAGE[g].chipLabel.length).toBeGreaterThan(0);
    }
  });

  it('uses a distinct verb per grade — a shared verb collapses the calibration', () => {
    const verbs = GRADES.map((g) => GRADE_LANGUAGE[g].verb);
    expect(new Set(verbs).size).toBe(4);
  });
});

describe('renderHeadline', () => {
  it('renders the calibrated verb for each grade', () => {
    for (const g of GRADES) {
      expect(renderHeadline(claimWith(g))).toContain(GRADE_LANGUAGE[g].verb);
    }
  });

  it('reads as a grammatical sentence rather than a statement bolted to a fragment', () => {
    // Guards the join, not the vocabulary: 'Statement — is well-supported.' is what
    // you get if a verb keeps a leading 'is', and it reads as broken English on
    // every card in the feed.
    expect(renderHeadline(claimWith('A'))).toBe(
      'Training more produces more growth — well-supported.',
    );
  });

  it('includes the claim statement verbatim', () => {
    expect(renderHeadline(claimWith('A'))).toContain('Training more produces more growth');
  });

  it('never asserts certainty at any grade — not even [A]', () => {
    for (const g of GRADES) {
      const out = renderHeadline(claimWith(g)).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(out, `grade ${g} rendered the certainty word "${word}"`).not.toContain(word);
      }
    }
  });

  it('never asserts certainty for any real claim in the shipped base', async () => {
    const { CLAIMS } = await import('../generated/claims');
    for (const claim of CLAIMS) {
      const out = renderHeadline(claim).toLowerCase();
      for (const word of CERTAINTY_WORDS) {
        expect(out, `${claim.id} rendered "${word}"`).not.toContain(word);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- --run src/advice/language.test.ts
```

Expected: FAIL — cannot resolve `./language`.

- [ ] **Step 3: Implement `src/advice/language.ts`**

The exhaustiveness guarantee is the `satisfies Record<Grade, GradeLanguage>` clause: adding a grade to the union without adding it here is a **compile error**, which is what FR-ADV-5's "fixed, exhaustive union" means in practice.

```ts
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
  return `${claim.statement} — ${GRADE_LANGUAGE[claim.grade].verb}.`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- --run src/advice/language.test.ts
```

Expected: PASS.

- [ ] **Step 5: Prove the exhaustiveness guard is real**

Temporarily add `'E'` to the `Grade` union in `src/advice/types.ts`, run `npm run typecheck`, and confirm it FAILS pointing at `GRADE_LANGUAGE`. Revert, confirm it passes. A "structurally impossible" guarantee that was never observed failing is a claim, not a guarantee.

- [ ] **Step 6: Commit**

```bash
git add app/src/advice/language.ts app/src/advice/language.test.ts
git commit -m "let the grade choose the verb so a [c] claim cannot say proven"
```

---

## Task 5: The predicate engine

**Files:**
- Create: `app/src/advice/engine.ts`
- Create: `app/src/advice/engine.test.ts`

**Interfaces:**
- Consumes: `Claim`, `UserStateSnapshot`, `AdviceItem` from `src/advice/types.ts`; `renderHeadline` from `src/advice/language.ts` (Task 4).
- Produces: `evaluateClaims(snapshot: UserStateSnapshot, claims: Claim[]): AdviceItem[]`, `buildPredicateContext(snapshot: UserStateSnapshot): Record<string, unknown>`, and `EMPTY_SNAPSHOT: UserStateSnapshot` from `src/advice/engine.ts`. Task 8 consumes all three.

**Design note the implementer must honour:** `json-logic-js` reads dotted paths off a data object, which cannot express "any muscle below N sets" against `weeklySetsByMuscle: Record<string, number>`. So the engine derives an evaluation context that adds one array field, `muscleSets: { muscle, sets }[]`, letting claims use json-logic's `some` operator. The pinned `UserStateSnapshot` type is **not** changed — the derived field exists only inside the evaluator.

- [ ] **Step 1: Write the failing test**

Create `app/src/advice/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluateClaims, buildPredicateContext, EMPTY_SNAPSHOT } from './engine';
import type { Claim, UserStateSnapshot } from './types';

function claim(over: Partial<Claim> = {}): Claim {
  return {
    id: 'c-test-a',
    statement: 'A statement',
    grade: 'A',
    status: 'settled',
    domain: 'volume',
    predicates: null,
    clusterId: null,
    phrasingKey: 'test-a',
    supersededBy: null,
    lastReviewed: '2026-07-25',
    citations: [],
    ...over,
  };
}

const cutting: UserStateSnapshot = {
  goal: 'cut',
  deficitWeeks: 6,
  weightTrend: 'down',
  e1rmTrend: 'holding',
  weeklySetsByMuscle: { chest: 8, back: 16 },
  proteinPerKg7d: 1.4,
  numbersHidden: false,
};

describe('buildPredicateContext', () => {
  it('flattens weeklySetsByMuscle into an array so `some` predicates can work', () => {
    const ctx = buildPredicateContext(cutting);
    expect(ctx.muscleSets).toEqual([
      { muscle: 'chest', sets: 8 },
      { muscle: 'back', sets: 16 },
    ]);
  });

  it('passes the snapshot fields through unchanged', () => {
    const ctx = buildPredicateContext(cutting);
    expect(ctx.goal).toBe('cut');
    expect(ctx.deficitWeeks).toBe(6);
    expect(ctx.proteinPerKg7d).toBe(1.4);
  });
});

describe('evaluateClaims', () => {
  it('returns nothing for a claim with null predicates — those are search-only', () => {
    expect(evaluateClaims(cutting, [claim({ predicates: null })])).toEqual([]);
  });

  it('fires a claim whose predicate matches the snapshot', () => {
    const c = claim({ predicates: { '==': [{ var: 'goal' }, 'cut'] } });
    const out = evaluateClaims(cutting, [c]);
    expect(out).toHaveLength(1);
    expect(out[0].claimId).toBe('c-test-a');
    expect(out[0].trigger).toBe('rule');
    expect(out[0].snapshot).toEqual(cutting);
  });

  it('does not fire a claim whose predicate does not match', () => {
    const c = claim({ predicates: { '==': [{ var: 'goal' }, 'bulk'] } });
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('evaluates an and-composed predicate over several snapshot fields', () => {
    const c = claim({
      predicates: {
        and: [
          { '==': [{ var: 'goal' }, 'cut'] },
          { '>=': [{ var: 'deficitWeeks' }, 4] },
          { '==': [{ var: 'e1rmTrend' }, 'holding'] },
        ],
      },
    });
    expect(evaluateClaims(cutting, [c])).toHaveLength(1);
  });

  it('supports a `some` predicate over per-muscle volume', () => {
    const c = claim({
      predicates: { some: [{ var: 'muscleSets' }, { '<': [{ var: 'sets' }, 10] }] },
    });
    expect(evaluateClaims(cutting, [c])).toHaveLength(1);
  });

  it('renders the headline through the grade-calibrated map, not from the claim text', () => {
    const c = claim({ grade: 'C', predicates: { '==': [{ var: 'goal' }, 'cut'] } });
    expect(evaluateClaims(cutting, [c])[0].headline).toContain('suggested, on limited evidence');
  });

  it('returns the whole cluster when a contested claim fires (FR-ADV-6)', () => {
    const forSide = claim({
      id: 'c-timing-for',
      status: 'contested',
      clusterId: 'protein-timing',
      predicates: { '==': [{ var: 'goal' }, 'cut'] },
    });
    const againstSide = claim({
      id: 'c-timing-against',
      status: 'contested',
      clusterId: 'protein-timing',
      predicates: null,
    });
    const out = evaluateClaims(cutting, [forSide, againstSide]);
    expect(out.map((a) => a.claimId).sort()).toEqual(['c-timing-against', 'c-timing-for']);
  });

  it('does not duplicate a cluster member that also matched on its own', () => {
    const p = { '==': [{ var: 'goal' }, 'cut'] };
    const a = claim({ id: 'c-x', status: 'contested', clusterId: 'k', predicates: p });
    const b = claim({ id: 'c-y', status: 'contested', clusterId: 'k', predicates: p });
    expect(evaluateClaims(cutting, [a, b])).toHaveLength(2);
  });

  it('never throws on a malformed predicate — it declines to fire and stays quiet', () => {
    const c = claim({ predicates: { notAnOperator: [1, 2] } });
    expect(() => evaluateClaims(cutting, [c])).not.toThrow();
    expect(evaluateClaims(cutting, [c])).toEqual([]);
  });

  it('still evaluates predicates normally against the empty snapshot', () => {
    // EMPTY_SNAPSHOT has goal 'maintain', so a predicate written to match it does
    // match. This proves the empty snapshot is a real snapshot, not a dead object —
    // which is what makes the next test's silence meaningful rather than vacuous.
    expect(evaluateClaims(EMPTY_SNAPSHOT, [claim({ predicates: { '==': [{ var: 'goal' }, 'maintain'] } })]))
      .toHaveLength(1);
  });
});

describe('the shipped claim base against an empty snapshot', () => {
  it('fires no claim before the user has logged anything', async () => {
    const { CLAIMS } = await import('../generated/claims');
    const fired = evaluateClaims(EMPTY_SNAPSHOT, CLAIMS);
    expect(fired.map((a) => a.claimId)).toEqual([]);
  });
});
```

Note the second-to-last test: it uses an explicitly `maintain`-matching predicate to prove `EMPTY_SNAPSHOT` still evaluates normally, while the final block proves no **real** claim fires on an empty database. Both are needed — the first shows the evaluator works, the second shows the claim base is honest.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- --run src/advice/engine.test.ts
```

Expected: FAIL — cannot resolve `./engine`.

- [ ] **Step 3: Implement `src/advice/engine.ts`**

```ts
import jsonLogic from 'json-logic-js';
import type { AdviceItem, Claim, UserStateSnapshot } from './types.ts';
import { renderHeadline } from './language.ts';

/**
 * The state of a user who has logged nothing. M1 has no logging, so this is the
 * real snapshot the feed evaluates against — not a placeholder, and not fake data.
 */
export const EMPTY_SNAPSHOT: UserStateSnapshot = {
  goal: 'maintain',
  deficitWeeks: 0,
  weightTrend: 'unknown',
  e1rmTrend: 'insufficient_data',
  weeklySetsByMuscle: {},
  proteinPerKg7d: null,
  numbersHidden: false,
};

/**
 * json-logic reads dotted paths, which cannot express "any muscle below N sets"
 * over a Record. Adding one derived array lets claims use `some` without changing
 * the pinned UserStateSnapshot shape.
 */
export function buildPredicateContext(snapshot: UserStateSnapshot): Record<string, unknown> {
  return {
    ...snapshot,
    muscleSets: Object.entries(snapshot.weeklySetsByMuscle).map(([muscle, sets]) => ({ muscle, sets })),
  };
}

function matches(claim: Claim, context: Record<string, unknown>): boolean {
  if (claim.predicates === null) return false;
  try {
    return jsonLogic.apply(claim.predicates, context) === true;
  } catch {
    // A predicate that throws is an authoring bug. Staying silent is the honest
    // failure: the alternative is surfacing advice the rule did not actually earn.
    return false;
  }
}

export function evaluateClaims(snapshot: UserStateSnapshot, claims: Claim[]): AdviceItem[] {
  const context = buildPredicateContext(snapshot);
  const selected = new Map<string, Claim>();

  for (const claim of claims) {
    if (!matches(claim, context)) continue;
    selected.set(claim.id, claim);
    // FR-ADV-6: a contested claim never travels alone. Pull in its whole cluster
    // so the UI has both sides available without asking the engine twice.
    if (claim.status === 'contested' && claim.clusterId) {
      for (const sibling of claims) {
        if (sibling.clusterId === claim.clusterId) selected.set(sibling.id, sibling);
      }
    }
  }

  return [...selected.values()].map((claim) => ({
    claimId: claim.id,
    trigger: 'rule' as const,
    headline: renderHeadline(claim),
    snapshot,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- --run src/advice/engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/advice/engine.ts app/src/advice/engine.test.ts
git commit -m "evaluate claim predicates against user state, and pull both sides of a contested cluster"
```

---

## Task 6: The visual world *(ORCHESTRATOR ONLY — Opus, via the `impeccable` skill)*

**Files:** Create `DESIGN.md` at the repo root.

`PRODUCT.md` exists; `DESIGN.md` does not. There is no visual world yet, so this milestone establishes one, and it must be established **before** Tasks 7a/7b/8/9 write UI code. Those tasks reference `DESIGN.md` by section for all visual specifics; this plan deliberately pins their *behaviour and interfaces* rather than their appearance, so the design pass is real rather than decorative.

- [ ] **Step 1:** Invoke `/impeccable shape advice feed`, then let it route into new-work for the visual world.
- [ ] **Step 2:** Mode is **Operate**. Constraints that are not negotiable in the design: PRODUCT.md principle 7 (nuance is the default state); the grade is as prominent as the claim; dissent is first-class; one hand, phone at arm's length, ~90 seconds between sets; no fake user data.
- [ ] **Step 3:** Resolve the reader conflict per the developer's ruling — **lifter first, but the thesis must survive the glance.**
- [ ] **Step 4:** Commit `DESIGN.md`.

---

## Task 7a: `ConfidenceTicks` and `ClaimCard`

**Files:**
- Create: `app/src/components/ConfidenceTicks.tsx`, `app/src/components/ConfidenceTicks.test.tsx`
- Create: `app/src/components/ClaimCard.tsx`, `app/src/components/ClaimCard.test.tsx`
- Modify: `app/src/index.css` (design tokens)

**Interfaces:**
- Consumes: `Claim`, `Grade` from `src/advice/types.ts`; `GRADE_LANGUAGE` from `src/advice/language.ts`; `DESIGN.md` (repo root) for all visual treatment and tokens.
- Produces: `<ConfidenceTicks grade={Grade} />` and `<ClaimCard claim={Claim} cluster={Claim[]?} />`. `ClaimCard` renders a root carrying `data-claim-id={claim.id}`. Tasks 8, 9 and 10 depend on both.

**Renamed from BUILD-PLAN's `GradeChip`, deliberately.** DESIGN.md bans rendering a grade as a standalone pill badge — that skimmable affordance is the thing the chosen direction exists to refuse. The component is a four-slot counter, so `ConfidenceTicks` is what it is. Log the rename in the decision log at milestone end.

**Read `DESIGN.md` before writing code.** It is the contract for tokens, type roles, the fixed vertical order of the card, and the prohibitions. Do not invent colours or sizes.

**Hard constraint:** neither component may contain a literal grade word, verb, DOI, author name, journal name, or year. Every such string arrives from the `Claim` prop or from `GRADE_LANGUAGE`. Task 10 enforces this at source level.

- [ ] **Step 1: Add the design tokens**

In `app/src/index.css`, inside Tailwind v4's `@theme`, declare exactly the tokens from DESIGN.md §Colour: `--paper #FBFAF7`, `--paper-sunk #F6F3EB`, `--ink #141414`, `--ink-soft #57534A`, `--ink-faint #767162`, `--rule #E6E1D4`, `--rule-strong #DAD5C7`, `--conf-a #1F5C3D`, `--conf-b #5B7B3A`, `--conf-c #8A6A00`, `--conf-d #6B6459`, `--flag #B0453A`. Use these values verbatim — they were contrast-checked and `--ink-faint` in particular was already corrected once for failing 4.5:1.

- [ ] **Step 2: Write the failing `ConfidenceTicks` tests**

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConfidenceTicks } from './ConfidenceTicks';
import { GRADE_LANGUAGE } from '../advice/language';
import type { Grade } from '../advice/types';

const FILLED: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

describe('ConfidenceTicks', () => {
  it.each(['A', 'B', 'C', 'D'] as Grade[])('fills %s slots to match the grade', (g) => {
    render(<ConfidenceTicks grade={g} />);
    const el = screen.getByTestId('confidence-ticks');
    expect(within(el).getAllByTestId('tick')).toHaveLength(4);
    expect(within(el).getAllByTestId('tick-filled')).toHaveLength(FILLED[g]);
  });

  it.each(['A', 'B', 'C', 'D'] as Grade[])('always renders the words for %s, never the count alone', (g) => {
    // DESIGN.md: colour is redundant to the count and the label. Strip the hue and the
    // card must still read correctly, so the label is not optional.
    render(<ConfidenceTicks grade={g} />);
    expect(screen.getByTestId('confidence-ticks')).toHaveTextContent(GRADE_LANGUAGE[g].chipLabel);
  });

  it('gives assistive tech the meaning, not the geometry', () => {
    render(<ConfidenceTicks grade="C" />);
    expect(screen.getByTestId('confidence-ticks')).toHaveAccessibleName(/limited evidence/i);
  });

  it('takes a grade, not a caption — the words come from the grade map', () => {
    // Guards T1: a caller must not be able to pass its own wording in.
    render(<ConfidenceTicks grade="A" />);
    expect(screen.getByTestId('confidence-ticks')).not.toHaveTextContent(/limited evidence/i);
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npm test -- --run src/components
```

Expected: FAIL, module not found.

- [ ] **Step 4: Implement `ConfidenceTicks`**

Signature: `export function ConfidenceTicks({ grade }: { grade: Grade }): React.ReactElement;`

Four slot elements each carrying `data-testid="tick"`; filled ones additionally carry `data-testid="tick-filled"` and the grade's ramp colour; unfilled use `--rule-strong`. Render `GRADE_LANGUAGE[grade].chipLabel` as visible text in the label style from DESIGN.md §Type. Give the wrapper an accessible name carrying the label. **No `grade` prop may be interpolated into a string** — index the map.

- [ ] **Step 5: Run to verify pass, then commit**

```bash
npm test -- --run src/components
git add app/src/components app/src/index.css
git commit -m "count the confidence in four slots instead of stamping a badge"
```

- [ ] **Step 6: Write the failing `ClaimCard` tests**

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClaimCard } from './ClaimCard';
import type { Claim } from '../advice/types';

const claim: Claim = {
  id: 'c-test-volume',
  statement: 'More weekly sets produce more growth, with diminishing returns',
  grade: 'C', status: 'settled', domain: 'volume',
  predicates: null, clusterId: null, phrasingKey: 'test-volume',
  supersededBy: null, lastReviewed: '2026-07-25',
  citations: [{
    id: 'cit-1', claimId: 'c-test-volume', doi: '10.1080/02640414.2016.1210197',
    authors: 'Someone A', year: 2017, journal: 'Journal of Sports Sciences',
    n: 42, population: 'trained', effectSize: null, ci: null, figures: [], quote: null,
  }],
};

describe('ClaimCard', () => {
  it('carries the claim id on its root, which is what makes provenance checkable', () => {
    render(<ClaimCard claim={claim} />);
    expect(screen.getByTestId('claim-card')).toHaveAttribute('data-claim-id', 'c-test-volume');
  });

  it('shows the statement as the card\'s own advice line', () => {
    render(<ClaimCard claim={claim} />);
    expect(screen.getByTestId('claim-statement')).toHaveTextContent(/more weekly sets produce more growth/i);
  });

  it('shows the confidence in the default state, with no interaction', () => {
    // PRODUCT.md principle 7: nuance is the default state, not a disclosure layer.
    render(<ClaimCard claim={claim} />);
    expect(within(screen.getByTestId('claim-card')).getByTestId('confidence-ticks')).toBeVisible();
  });

  it('orders advice, then confidence, then source — the order is the argument', () => {
    // DESIGN.md fixes this order: the reader must meet the confidence before the
    // citation, because a citation alone reads as proof.
    render(<ClaimCard claim={claim} />);
    const card = screen.getByTestId('claim-card');
    const order = [...card.querySelectorAll('[data-testid]')]
      .map((n) => n.getAttribute('data-testid'))
      .filter((t) => t === 'claim-statement' || t === 'confidence-ticks' || t === 'claim-source');
    expect(order).toEqual(['claim-statement', 'confidence-ticks', 'claim-source']);
  });

  it('renders the source from the claim record', () => {
    render(<ClaimCard claim={claim} />);
    const src = screen.getByTestId('claim-source');
    expect(src).toHaveTextContent('Someone A');
    expect(src).toHaveTextContent('2017');
  });

  it('does not show study detail until it is asked for', () => {
    // The user's explicit architecture: figures and caveats are layer 3, never layer 1.
    render(<ClaimCard claim={claim} />);
    expect(screen.queryByTestId('figure-n')).toBeNull();
    expect(screen.queryByText('10.1080/02640414.2016.1210197')).toBeNull();
  });

  it('renders both sides when given a contested cluster', () => {
    const a: Claim = { ...claim, id: 'c-timing-for', status: 'contested', clusterId: 'protein-timing',
      statement: 'Peri-workout protein timing matters',
      citations: [{ ...claim.citations[0], claimId: 'c-timing-for' }] };
    const b: Claim = { ...claim, id: 'c-timing-against', status: 'contested', clusterId: 'protein-timing',
      statement: 'Total daily protein dominates timing', grade: 'A',
      citations: [{ ...claim.citations[0], claimId: 'c-timing-against' }] };
    render(<ClaimCard claim={a} cluster={[a, b]} />);
    expect(screen.getByText(/peri-workout protein timing matters/i)).toBeInTheDocument();
    expect(screen.getByText(/total daily protein dominates timing/i)).toBeInTheDocument();
    expect(screen.getByTestId('contested-marker')).toBeVisible();
  });

  it('gives every side of a contested cluster its own claim id and its own confidence', () => {
    const a: Claim = { ...claim, id: 'c-a', status: 'contested', clusterId: 'k' };
    const b: Claim = { ...claim, id: 'c-b', status: 'contested', clusterId: 'k', grade: 'A' };
    render(<ClaimCard claim={a} cluster={[a, b]} />);
    const sides = screen.getAllByTestId('claim-side');
    expect(sides.map((el) => el.getAttribute('data-claim-id')).sort()).toEqual(['c-a', 'c-b']);
    for (const side of sides) expect(within(side).getByTestId('confidence-ticks')).toBeVisible();
  });
});
```

- [ ] **Step 7: Run to verify failure, then implement `ClaimCard`**

Signature: `export function ClaimCard({ claim, cluster }: { claim: Claim; cluster?: Claim[] }): React.ReactElement;`

Follow DESIGN.md §Components exactly: fixed vertical order (statement → confidence → source → affordance), hairline separators rather than shadows, no rounded corners, paper ground. The source line renders authors, journal, year and — where `n` is not null — the sample size. **Do not render the DOI, figures, effect size or CI on the card**; those belong to Task 7b's evidence panel behind a tap.

When `cluster` has more than one member, render the contested variant: a `contested-marker` and one `claim-side` per member, each with its own `data-claim-id` and its own `ConfidenceTicks`, at equal visual weight. Neither side indented, greyed, or ordered by grade.

- [ ] **Step 8: Run to verify pass, full suite, commit**

```bash
npm test -- --run && npm run typecheck
git add app/src/components
git commit -m "put the advice first, the confidence under it, and the paper below that"
```

---

## Task 7b: `EvidencePanel` and `FigureChart`

**Files:**
- Create: `app/src/components/FigureChart.tsx`, `app/src/components/FigureChart.test.tsx`
- Create: `app/src/components/EvidencePanel.tsx`, `app/src/components/EvidencePanel.test.tsx`
- Modify: `app/src/components/ClaimCard.tsx` (mount the panel behind tap-1)

**Interfaces:**
- Consumes: `Claim`, `Citation`, `Figure` from `src/advice/types.ts`; `GRADE_LANGUAGE` from `src/advice/language.ts`.
- Produces: `<FigureChart citation={Citation} />` and `<EvidencePanel claim={Claim} />`.

**Hard constraints:** no `<img>`, no external image URL, no publisher figure — ever (GR-3). Every citation block shows **n** and **population** as first-class fields, at the same visual level as the effect size, never as footnotes (FR-ADV-8). A `null` field renders as an explicit statement of absence, never as a blank, a dash with no explanation, or an inferred value.

- [ ] **Step 1: Write the failing tests**

`app/src/components/FigureChart.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FigureChart } from './FigureChart';
import type { Citation } from '../advice/types';

const full: Citation = {
  id: 'cit-1', claimId: 'c-x', doi: '10.1080/02640414.2016.1210197',
  authors: 'Someone A, Another B', year: 2017, journal: 'Journal of Sports Sciences',
  n: 42, population: 'trained', effectSize: 'SMD 0.35', ci: '95% CI 0.03 to 0.67',
  figures: [{ label: 'weekly sets', value: 10, unit: 'sets' }], quote: null,
};

describe('FigureChart', () => {
  it('shows sample size as a first-class field', () => {
    render(<FigureChart citation={full} />);
    expect(screen.getByTestId('figure-n')).toHaveTextContent('42');
  });

  it('shows the population as a first-class field', () => {
    render(<FigureChart citation={full} />);
    expect(screen.getByTestId('figure-population')).toHaveTextContent(/trained/i);
  });

  it('says so plainly when sample size was not extractable', () => {
    render(<FigureChart citation={{ ...full, n: null }} />);
    expect(screen.getByTestId('figure-n')).toHaveTextContent(/not stated/i);
  });

  it('says so plainly when no confidence interval was extractable', () => {
    render(<FigureChart citation={{ ...full, ci: null }} />);
    expect(screen.getByTestId('figure-ci')).toHaveTextContent(/not (stated|extracted)/i);
  });

  it('never embeds an image — figures are re-plotted, per GR-3', () => {
    const { container } = render(<FigureChart citation={full} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders no chart at all when there are no extracted figures', () => {
    const { container } = render(<FigureChart citation={{ ...full, figures: [] }} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByTestId('figure-n')).toBeInTheDocument();
  });
});
```

`app/src/components/EvidencePanel.test.tsx` must cover: the panel renders the grade's `confidence` sentence at tap-1; the citation list at tap-2 shows authors, year, journal and a DOI link per citation; the DOI renders as `https://doi.org/<doi>`; `lastReviewed` is displayed (FR-CLAIM-4); and a `supersededBy` value, when present, is shown. Write these in the same style as above — full assertions, no placeholders.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- --run src/components
```

Expected: FAIL.

**DESIGN.md requirements for this task, decided after the plan was first written:**

- The panel opens on `--paper-sunk` (`bg-paper-sunk`), so depth reads as a change of surface rather than a shadow. Field rows are a mono label above a serif value.
- **Sample size renders as countable marks, one mark per 100 participants**, with a hatched partial mark for the remainder and a visible "each mark = 100 people" key. This is Isotype's founding rule and the reason the world was chosen: quantity is shown by repeating a mark, never by scaling one. A bar whose length encodes n is a defect here.
- **Population is its own named field** with a human label, never a parenthetical (FR-ADV-8).
- **Confidence intervals plot against a visible zero line**, so an interval crossing zero is *seen* to cross it. Several real claims in this base have intervals that cross zero and that fact is the honest content.
- **The panel carries the full author list.** `ClaimCard` deliberately shortens it to `First A et al.` for the card, so the complete list has to live here or it is lost. Import `shortenAuthors` from `./ClaimCard` only if you need it; the panel should print `citation.authors` in full.
- `ClaimCard` already renders an empty native `<details>` with the summary text `see the evidence`. Fill it with `EvidencePanel` and change that summary wording if a better phrase serves the layer-2-to-layer-3 step; keep it a native `<details>`/`<summary>`.
- Tokens exist in `app/src/index.css` under Tailwind v4's `@theme` and are namespaced `--color-*`, so the utilities are `bg-paper-sunk`, `text-ink-faint`, `bg-conf-a`, `text-flag`, and so on. **Do not add new colours.**

- [ ] **Step 3: Implement both components**

`FigureChart` is hand-rolled SVG per the locked architecture decision — no charting library. Keep it small: a labelled value strip with a CI whisker when `ci` is present. It must degrade honestly: no figures means no SVG, but n and population still render.

`EvidencePanel` implements FR-ADV-7 layers 2 and 3. Layer 2 is `GRADE_LANGUAGE[claim.grade].confidence` plus the statement; layer 3 is the citation list with a `FigureChart` per citation. Progressive disclosure uses native `<details>`/`<summary>` — it is keyboard accessible, screen-reader announced, and works with no JavaScript state, which is three problems solved by a platform feature. Visual treatment per `DESIGN.md`.

Wire `EvidencePanel` into `ClaimCard` behind tap-1. The grade chip stays visible in the collapsed state — disclosure reveals *depth*, never the grade itself.

- [ ] **Step 4: Run the tests to verify they pass, then run the whole suite**

```bash
npm test -- --run && npm run typecheck
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add app/src/components
git commit -m "re-plot the extracted numbers ourselves and say plainly when a figure was unreadable"
```

---

## Task 8: The advice feed page

**Files:**
- Create: `app/src/features/advice/AdviceFeed.tsx`, `app/src/features/advice/AdviceFeed.test.tsx`
- Modify: `app/src/App.tsx`, `app/src/App.test.tsx`
- Modify: `app/e2e/persistence.spec.ts`, `app/e2e/offline.spec.ts`
- Create: `app/e2e/advice.spec.ts`

**Interfaces:**
- Consumes: `CLAIMS` from `src/generated/claims.ts`; `evaluateClaims`, `EMPTY_SNAPSHOT` from `src/advice/engine.ts`; `ClaimCard` from `src/components/ClaimCard.tsx`.
- Produces: `<AdviceFeed />`. Task 9 mounts `<AskEvidence />` alongside it in `App.tsx`.

**The e2e testid decision — read before touching `App.tsx`.** Three e2e specs and `App.test.tsx` currently depend on `data-testid="storage-mode"`, `data-testid="exercise-count"`, and a heading matching `/evidence/i`. These are M0 debug scaffolding, and the kickoff is explicit that they must be kept alive **or** the specs updated deliberately, never silently. The deliberate resolution:

- **`storage-mode` is kept and promoted from debug readout to honest UI.** This closes debt **D7**: `memory-fallback` is a data-loss mode currently rendered as a bare value with no warning. Render it as a visible warning banner when the mode is anything other than `opfs-sahpool`, and keep the `data-testid` so all three existing specs keep passing unchanged. Do **not** hide it behind a settings screen.
- **`exercise-count` is removed from the UI.** It carries no product meaning on an advice page and inventing a place for it would be scaffolding. The two specs asserting on it (`persistence.spec.ts`, `offline.spec.ts`) must be updated to read the count through the existing `window.__db` e2e hatch, which both files already use for other queries. The assertion — count stable across reload, proving persistence *and* idempotent seeding — must be preserved exactly. Weakening or deleting it is not an option.
- The `/evidence/i` heading assertion keeps passing as long as the page heading still contains "evidence", which it will.

- [ ] **Step 1: Write the failing component test**

`app/src/features/advice/AdviceFeed.test.tsx` must assert:
- every rendered claim card carries a non-empty `data-claim-id`;
- the number of cards equals the number of claims in `CLAIMS` (the browse surface shows the whole base at M1);
- an honest empty-state element, `data-testid="no-user-data"`, is visible, stating that nothing here is earned by the user's own data yet — because logging arrives in M2;
- **no** element on the page displays a number attributable to a user (no bodyweight, no sets logged, no streaks). Assert this by rendering with a spy-free DOM scan for `data-testid` values beginning `user-`, expecting none.

Write these as complete assertions in the file — no placeholders.

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --run src/features
```

Expected: FAIL.

**DESIGN.md and architecture requirements decided after this task was first written:**

- Read `DESIGN.md` (repo root) before writing code. Warm paper ground, single column, hairline separators between cards, no shadows, no rounded corners. Tokens are in `app/src/index.css` under Tailwind v4 `@theme`, namespaced `--color-*`, so utilities read `bg-paper`, `text-ink`, `text-ink-faint`. **Add no new colours.**
- **Mobile is the design target, not a breakpoint.** Author single-column first; let it breathe on wider screens with a max reading measure. Nothing essential off the first screenful of a card.
- **The developer's three-layer architecture is binding.** Layer 1 advice, layer 2 source plus confidence, layer 3 study detail *only when asked*. `ClaimCard` and `EvidencePanel` already implement all three — the feed composes them and must not surface figures, DOIs, or effect sizes at feed level.
- **The empty state is the honest centre of this screen, not a placeholder.** M1 has no logging, so nothing on this page is earned by the user's data. Say that plainly in the copy, in the app's own voice, and offer the evidence base as what it *can* do today. Do not use a spinner, do not imply data is coming, and **do not invent a single number about the user.**
- Grouping: render all of `CLAIMS` grouped by `domain` with a small label per group. Contested claims sharing a `clusterId` collapse into ONE `ClaimCard` with its `cluster` prop, never two competing cards.

- [ ] **Step 3: Implement `AdviceFeed.tsx`**

The feed calls `evaluateClaims(EMPTY_SNAPSHOT, CLAIMS)` for the rule-triggered section, which correctly yields nothing at M1, and separately renders all of `CLAIMS` grouped by `domain` as the browse surface. Contested claims are grouped by `clusterId` and passed to `ClaimCard` as a `cluster`, so both sides render in one card rather than as two competing cards.

The empty state is honest text, not a spinner and not a mock: the app has no training data, says so, and offers the evidence base as the thing it *can* do today. Visual treatment per `DESIGN.md`.

- [ ] **Step 4: Rewrite `App.tsx`**

Replace the debug harness. It renders the page heading (containing "evidence"), the storage-mode honesty banner described above, and `<AdviceFeed />`. Update `App.test.tsx` to cover the banner: assert that a non-`opfs-sahpool` mode renders a visible warning, not a bare value.

- [ ] **Step 5: Update the two e2e specs**

Move the `exercise-count` assertions onto `window.__db`. In both `persistence.spec.ts` and `offline.spec.ts`, replace the `getByTestId('exercise-count')` expectations with a `page.evaluate` reading `select count(*) from exercises` through the hatch, comparing to `SEED_EXERCISES.length`. Keep the reload/offline structure and every other assertion exactly as-is.

- [ ] **Step 6: Write `e2e/advice.spec.ts`**

Assert against the real built app: the feed renders at least 15 elements carrying `data-claim-id`; every one of them has a non-empty value; the honest empty-state element is visible; and a grade chip is visible inside the first card **without any interaction** (the D3 guard, end to end).

- [ ] **Step 7: Full suite**

```bash
npm run typecheck && npm test -- --run && npm run build && npm run e2e
```

Expected: all green, e2e count now 6.

- [ ] **Step 8: Commit**

```bash
git add app/src app/e2e
git commit -m "put the evidence base on screen and say plainly that nothing here is earned yet"
```

---

## Task 9: The "ask the evidence" surface

**Files:**
- Create: `app/src/advice/search.ts`, `app/src/advice/search.test.ts`
- Create: `app/src/features/advice/AskEvidence.tsx`, `app/src/features/advice/AskEvidence.test.tsx`
- Modify: `app/src/App.tsx` (mount it), `app/e2e/advice.spec.ts` (cover it)

**Interfaces:**
- Consumes: `Claim` from `src/advice/types.ts`; `CLAIMS` from `src/generated/claims.ts`; `renderHeadline` from `src/advice/language.ts`; `ClaimCard`.
- Produces: `buildIndex(claims: Claim[]): MiniSearch<Claim>` and `searchClaims(query: string, claims: Claim[]): AdviceItem[]` from `src/advice/search.ts`.

`searchClaims` returns `AdviceItem[]` with `trigger: 'query'` and `snapshot: EMPTY_SNAPSHOT`, so the search surface is bound by exactly the same provenance contract as the rule surface — there is no second, looser path to the screen. Index `statement` and `domain` only; do **not** index citation text, or a query will match on an author's name and surface an unrelated claim.

- [ ] **Step 1:** Write `search.test.ts`: an exact-term query returns the matching claim; a query matching nothing returns `[]`; an empty query returns `[]` rather than everything; results carry `trigger: 'query'`; a contested match returns its whole cluster (same FR-ADV-6 rule as the engine); prefix and fuzzy matching work for a realistic typo.
- [ ] **Step 2:** Run to verify failure.
- [ ] **Step 3:** Implement `search.ts` with minisearch over `['statement', 'domain']`, `prefix: true`, `fuzzy: 0.2`.
- [ ] **Step 4:** Run to verify pass.
- [ ] **Step 5:** Write `AskEvidence.test.tsx`: typing a query renders matching `ClaimCard`s each with `data-claim-id`; a no-match query renders an honest "nothing in the evidence base covers that yet" state, **never** a generated answer; the input has an accessible label.
- [ ] **Step 6:** Implement `AskEvidence.tsx`, mount in `App.tsx`, extend `e2e/advice.spec.ts` with a real typed query.
- [ ] **Step 7:** Full suite green, commit.

```bash
git commit -m "let someone ask the evidence base a question and only ever answer with a real claim"
```

---

## Task 10: Prove AC-4 — no advice without a `claim_id`

**Files:**
- Create: `app/src/provenance.test.ts`
- Modify: `.github/workflows/ci.yml`

This is the milestone's hardest guarantee and the one no other test covers. AC-4 requires it be provable **by grep and by test**. Both.

**Interfaces:** Consumes `CLAIMS`, all components, and the built `dist/`.

- [ ] **Step 1: Write the source-level test**

`app/src/provenance.test.ts` reads component source files off disk with `node:fs` and asserts, over `src/components/**` and `src/features/**`:
- no DOI-shaped literal (`/10\.\d{4,9}\/\S/`) appears in any component source — every DOI must arrive via a `Claim` prop;
- no grade letter is hard-coded as a display string, and none of the calibrated verbs from `GRADE_LANGUAGE` appear as literals outside `src/advice/language.ts`;
- no `<img>` tag and no external image URL appears anywhere under `src/components/` (GR-3);
- the strings `openai`, `anthropic`, `fetch(` and `XMLHttpRequest` appear nowhere under `src/advice/` — GR-6's "no LLM in the runtime trust path" and FR-CLAIM-3's "the running app never queries scholarly APIs", made checkable rather than aspirational.

- [ ] **Step 2: Write the render-level test**

In the same file, render `<AdviceFeed />` and `<AskEvidence />` with a query that matches, then assert the structural invariant: **every element carrying `data-testid="claim-statement"` has an ancestor carrying a non-empty `data-claim-id`.** Walk up `parentElement` to check. This is the assertion that actually encodes "no render path without a claimId" — an advice string that appeared from anywhere else would have no such ancestor and would fail.

- [ ] **Step 3: Prove both tests can fail**

Do not skip. Temporarily hard-code a DOI string into `ClaimCard.tsx` and confirm the source test FAILS. Temporarily render a bare `<p data-testid="claim-statement">Do more volume</p>` outside any card and confirm the render test FAILS. Revert both, confirm green. M0's lesson was a contract test that covered a duplicate and caught nothing — do not repeat it.

- [ ] **Step 4: Add the CI grep**

Add a step to `.github/workflows/ci.yml`, modelled on the existing `__db` check, that greps the **built** `dist/` for a DOI-shaped string appearing outside the claim bundle, and fails if advice text ships without provenance. Verify it passes on a real build.

- [ ] **Step 5: Full suite, then commit**

```bash
npm run typecheck && npm test -- --run && npm run build && npm run e2e
```

```bash
git add app/src/provenance.test.ts .github/workflows/ci.yml
git commit -m "make it a test failure, not a promise, that advice cannot render without a claim id"
```

---

## Milestone close (orchestrator)

- [ ] Run `superpowers:verification-before-completion` against BUILD-PLAN §M1's checks: AC-3 (static claims), AC-4/T1 (grep-proof *and* test), AC-6 partially (≥15 claims).
- [ ] Dispatch a whole-branch review with the most capable model; point it at D6–D10 for triage.
- [ ] Update `docs/PROJECT-STATE.md`; append M1 decisions to `docs/00-meta/decision-log.md` — including the three architecture decisions locked above, and the `exercise-count` testid removal.
- [ ] Append to `.superpowers/sdd/progress.md` after every task: `Task N: complete (commits <base>..<head>, review clean)`.
- [ ] **STOP and ask the user.** M1 ends at a human gate: *does the interaction feel decisive AND honest?* Do not start M2 before that verdict, and do not merge without asking.

## Self-review

**Spec coverage against BUILD-PLAN §M1:** claim schema + `build-claims.ts` + `claims/schema.md` → Tasks 1–2. Opus curates 15–20 claims → Task 3. `language.ts` with exhaustive-union test → Task 4. `engine.ts` + per-trigger unit tests → Task 5. `GradeChip`/`ClaimCard`/`EvidencePanel` + contested clusters → Tasks 7a/7b. Advice feed + minisearch → Tasks 8–9. AC-3 → Task 8 e2e. AC-4/T1 grep + test → Task 10. AC-6 partial (≥15) → Task 3, asserted in Task 8's e2e. FR-ADV-8 (n + population first-class) → Task 7b. FR-ADV-6 → schema refine (Task 1), build gate (Task 2), engine (Task 5), UI (Task 7a). FR-CLAIM-4 (`lastReviewed`) → Tasks 1 and 7b. Design mandate → Task 6, enforced by tests in 7a and 8.

**Placeholder scan:** Tasks 7b step 1 (EvidencePanel test) and Tasks 9–10 give assertion lists rather than full code blocks. This is deliberate and bounded: each names every assertion required, and the surrounding tasks show the exact style. Task 7a/8 UI visual specifics defer to `DESIGN.md`, which Task 6 produces *before* those tasks run — deferring appearance to a design artefact is not a placeholder, but the tasks must not start before Task 6 is committed.

**Type consistency:** `Claim`, `Citation`, `Figure`, `Grade`, `Population`, `UserStateSnapshot`, `AdviceItem` are defined once in Task 1 and imported everywhere. `renderHeadline`/`GRADE_LANGUAGE` (Task 4) are consumed by Tasks 5, 7a, 7b, 9. `evaluateClaims`/`EMPTY_SNAPSHOT`/`buildPredicateContext` (Task 5) are consumed by Tasks 8, 9. `CLAIMS` (Task 2, populated Task 3) is consumed by Tasks 4, 5, 8, 9, 10. `data-claim-id` is emitted in Task 7a and asserted in Tasks 8 and 10. `n: number | null`, `effectSize: string | null`, `ci: string | null` are nullable in Task 1's type, Task 1's Zod schema, and Task 7b's absence-rendering tests, consistently.

**Deviation from BUILD-PLAN, logged:** `Claim.clusterId` and `Claim.supersededBy` are typed `string | null` rather than the BUILD-PLAN sketch's optional `?`. YAML has no notion of an absent key that round-trips cleanly through `JSON.stringify`, and an explicit `null` forces the author to make a decision rather than forget a field. Same for `Citation.n`/`effectSize`/`ci`, where an explicit null is the honesty signal the whole curation contract rests on.

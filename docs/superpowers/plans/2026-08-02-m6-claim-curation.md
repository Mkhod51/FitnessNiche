# M6 Claim Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the directly reviewed claim base from 17 to approximately 50 claims while making curation, predicates, and data-earned advice auditable and structurally honest.

**Architecture:** Claims remain YAML compiled into the committed typed bundle. A structured, curation-only ledger records citation review evidence and a separate document renders the human review queue. Claim records declare whether a predicate match is a generic rule or data-earned advice; the engine carries that declaration through selection. Predicate validation is strict at generation time and real snapshot loading is shared by advice surfaces.

**Tech Stack:** TypeScript strict, Zod, JSON Logic, YAML, Vitest, React Testing Library, Playwright, PubMed/Crossref/Europe PMC for curation-time source discovery and verification.

## Global Constraints

- Every recommendation must render from a stored claim record with its `claim_id`, grade, and citation; no runtime LLM or hand-written advice prose (T1/GR-6).
- All non-null citation facts must be read in the cited source; unknown values remain `null` or `unstated`; never embed publisher figures (GR-3).
- Grade the precise claim and downgrade trained-lifter claims when evidence is untrained or unstated; do not turn non-significance into equivalence (FR-CLAIM-5).
- A contested claim has real opposing claims in one shared cluster; no strawman counterpart (FR-ADV-6).
- New claims default to search-only. `data-earned` is permitted only where logged state genuinely instantiates the claim; no personal protein conclusion from incomplete logs, personal deficit claim from a configured target, individual MEV/MRV, or invented rate threshold (GR-1/GR-4).
- Normal app build/test/runtime paths are deterministic and make no scholarly network calls. DOI resolution is explicit curation-time work.
- Every production behaviour begins with a focused failing test, then minimal implementation, then the covering suite. Commit generated claims together with their YAML.

---

### Task 1: Make curation records and authoring controls auditable

**Files:**
- Create: `app/claims/review-ledger.json`
- Create: `app/scripts/audit-claim-dois.ts`
- Create: `app/scripts/audit-claim-dois.test.ts`
- Create: `docs/00-meta/claim-review-queue.md`
- Modify: `app/claims/ADDING-A-CLAIM.md`
- Modify: `app/claims/schema.md`
- Modify: `app/package.json`

**Interfaces:**
- Produces `ReviewLedgerEntry` with `claimId`, `citationId`, `doi`, `resolvedOn`, `resolution`, `sourceRead`, `evidenceLocations`, `nullRationales`, `populationRationale`, `gradeRationale`, `firstReview`, `secondReview`, and `nextReview`.
- Produces `auditClaimDois(citations, fetcher): DoiAuditResult[]`; command is `npm run claims:audit-dois` and must not be called by `npm run claims`, tests, or build.

- [ ] **Step 1: Write failing audit tests**

```ts
it('reports each unique DOI once and preserves a failed resolution', async () => {
  const result = await auditClaimDois([{ doi: '10.1/a' }, { doi: '10.1/a' }], failingFetcher);
  expect(result).toEqual([{ doi: '10.1/a', resolved: false, reason: 'not found' }]);
});
```

- [ ] **Step 2: Run the focused test and confirm the missing audit module fails.**

Run: `npm test -- --run scripts/audit-claim-dois.test.ts`

- [ ] **Step 3: Implement the bounded curation-only audit and script entrypoint.**

```ts
export async function auditClaimDois(citations: Pick<Citation, 'doi'>[], fetcher = fetch) {
  return Promise.all([...new Set(citations.map(({ doi }) => doi))].map((doi) => resolveDoi(doi, fetcher)));
}
```

Use Crossref only for resolution. Emit JSON suitable for ledger review, return non-zero only for transport/configuration errors, and never write into `src/generated`.

- [ ] **Step 4: Add the structured ledger and the human review queue.**

Seed the ledger with every existing citation, including its source/read state and a truthful unresolved marker where the M1 record lacks a source locator. The Markdown queue explains that a claim cannot merge until every citation has two hostile reviews; it links to the ledger rather than duplicating mutable fields.

- [ ] **Step 5: Correct authoring documentation.**

Add required `peekStatement`, the ledger procedure, source-location/null-rationale requirements, and the distinction between search-only, `rule`, and `data-earned` claims. Preserve the existing direct-source and two-reader requirements.

- [ ] **Step 6: Run focused checks and commit.**

Run: `npm test -- --run scripts/audit-claim-dois.test.ts && npm run claims && npm run typecheck`

Commit: `make claim review records auditable`

### Task 2: Validate predicates and declare advice trigger semantics

**Files:**
- Modify: `app/src/advice/types.ts`
- Modify: `app/src/advice/claim-schema.ts`
- Modify: `app/src/advice/claim-schema.test.ts`
- Modify: `app/scripts/build-claims.ts`
- Modify: `app/scripts/build-claims.test.ts`
- Modify: `app/src/advice/engine.ts`
- Modify: `app/src/advice/engine.test.ts`
- Modify: `app/claims/*.yaml`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- `Claim.trigger` is `'rule' | 'data-earned' | null`; it is required in YAML.
- `validatePredicate(rule)` accepts only `and`, `or`, `!`, `some`, `==`, `!=`, `<`, `<=`, `>`, `>=`, literal arrays, and allowed variables: `goal`, `deficitWeeks`, `weightTrend`, `e1rmTrend`, `proteinPerKg7d`, `numbersHidden`, `muscleSets`, `muscle`, `sets`.
- `data-earned` and `rule` claims must have non-null predicates; search-only claims have `predicates: null` and `trigger: null`.

- [ ] **Step 1: Write failing schema and engine tests.**

```ts
expect(() => buildClaims([sourceWith({ predicates: { '==': [{ var: 'unknown' }, 1] } })])).toThrow(/unknown predicate variable/);
expect(evaluateClaims(snapshot, [dataEarnedClaim])[0].trigger).toBe('data-earned');
```

- [ ] **Step 2: Run focused tests and confirm they fail due to opaque predicate records and the hard-coded trigger.**

Run: `npm test -- --run src/advice/claim-schema.test.ts scripts/build-claims.test.ts src/advice/engine.test.ts`

- [ ] **Step 3: Implement recursive predicate validation and trigger propagation.**

Validate every operator arity and nested `some` scope before calling JSON Logic. Keep `matches()` fail-closed at runtime. Use `claim.trigger` for predicate-selected advice and reserve `'query'` for search results.

- [ ] **Step 4: Classify existing records conservatively and regenerate.**

Mark only strength-holds-through-a-deficit as `data-earned`. Keep goal-duration, volume, protein, and timing matches as `rule` until their evidence context supports a personal conclusion. Set `trigger: null` on every null-predicate record.

- [ ] **Step 5: Run focused checks and commit.**

Run: `npm test -- --run src/advice/claim-schema.test.ts scripts/build-claims.test.ts src/advice/engine.test.ts && npm run claims && npm run typecheck`

Commit: `validate claim predicates and advice triggers`

### Task 3: Use real logged state on advice surfaces

**Files:**
- Create: `app/src/advice/load-snapshot.ts`
- Create: `app/src/advice/load-snapshot.test.ts`
- Modify: `app/src/advice/session-advice.ts`
- Modify: `app/src/advice/session-advice.test.ts`
- Modify: `app/src/features/advice/AdviceFeed.tsx`
- Modify: `app/src/features/advice/AdviceFeed.test.tsx`
- Modify: `app/src/features/log/LogWorkout.tsx`
- Modify: `app/src/features/log/LogWorkout.test.tsx`

**Interfaces:**
- `loadAdviceSnapshot(now?: Date): Promise<BuiltSnapshot>` reads user, weights, sets, food, and seeded exercises over the established 84-day reconciliation window.
- Session and Hub callers use this loader; callers never supply `EMPTY_SNAPSHOT` for a consented, logged user.
- `whyNow` accepts the selected `Claim` and only reports data relevant to that claim's matched predicate.

- [ ] **Step 1: Write failing loader and surface tests.**

```tsx
it('renders the matching data-earned claim from a loaded snapshot', async () => {
  mockLoadAdviceSnapshot.mockResolvedValue(strengthHoldingSnapshot);
  render(<AdviceFeed />);
  expect(await screen.findByText(/strength held/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and confirm the Hub still evaluates `EMPTY_SNAPSHOT`.**

Run: `npm test -- --run src/advice/load-snapshot.test.ts src/advice/session-advice.test.ts src/features/advice/AdviceFeed.test.tsx src/features/log/LogWorkout.test.tsx`

- [ ] **Step 3: Implement the shared loader and conservative surface integration.**

Keep consent gating intact. Do not fire a session claim more than once, bypass cooldown/suppression, or re-evaluate mid-session. Make `whyNow` use strength facts for strength-holds and the matched threshold direction for a volume rule; return no invented fallback fact.

- [ ] **Step 4: Run focused checks and commit.**

Run: `npm test -- --run src/advice/load-snapshot.test.ts src/advice/session-advice.test.ts src/features/advice/AdviceFeed.test.tsx src/features/log/LogWorkout.test.tsx && npm run typecheck`

Commit: `show advice from real logged state`

### Task 4: Curate missing ROM and bulk-rate coverage

**Files:**
- Create: eight `app/claims/c-rom-*.yaml` and `app/claims/c-bulk-rate-*.yaml` records
- Modify: `app/claims/review-ledger.json`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- Add four atomic ROM claims and four bulk-rate claims, all search-only unless direct-source review establishes an existing snapshot predicate is honest.
- Every citation has a ledger entry and two completed reviews before its YAML enters `app/claims/`.

- [ ] **Step 1: Discover synthesis candidates, resolve DOIs, and read sources directly.**

Use PubMed publication-type search first, Crossref only for DOI resolution, and Europe PMC/full text where available. Record source locations and missing fields in the ledger before drafting.

- [ ] **Step 2: Draft the eight claims with direct-source fields only.**

Each record includes `peekStatement`, truthful grade/population, figures only when source-read, and `predicates: null` unless explicitly justified in the ledger.

- [ ] **Step 3: Run an independent hostile review and record both sign-offs.**

The second reviewer verifies every stored number/quote/grade against the cited source and rejects any over-broad trained-lifter wording.

- [ ] **Step 4: Generate, test, and commit.**

Run: `npm run claims && npm test -- --run src/advice scripts/build-claims.test.ts && npm run typecheck`

Commit: `curate ROM and bulk-rate claims`

### Task 5: Curate rest, deload, energy-balance, volume, frequency, and failure-proximity depth

**Files:**
- Create: fourteen topic-specific `app/claims/*.yaml` records
- Modify: `app/claims/review-ledger.json`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- Add exactly fourteen claims: rest intervals (strength and hypertrophy outcomes, 2), deloads (reactive versus scheduled and reduced volume versus cessation, 2), cut/maintenance (diet breaks, refeeds, resistance-training adaptation at maintenance, 3), volume (training-status and concentrated-versus-distributed outcomes, 2), frequency (trained strength and unmatched-volume hypertrophy outcomes, 2), and failure proximity (load-to-failure, subsequent-set performance, RIR accuracy, 3). This brings the total to 39 before Task 6.

- [ ] **Step 1: Build an atomic source queue and record synthesis searches.**

Separate outcome claims that sound similar (strength vs hypertrophy; matched vs unmatched volume) so one citation cannot be stretched beyond its measurement.

- [ ] **Step 2: Resolve/read/extract and prepare ledger rows before YAML drafts.**

Record no-synthesis outcomes, direct evidence locations, population applicability, grade rationale, and null rationale. Do not write a rate-of-loss threshold or a configured-deficit claim as personal evidence.

- [ ] **Step 3: Draft, second-review, generate, and test each small batch.**

After each batch run `npm run claims` and its focused advice tests. Do not defer hostile reviews to the end of all fourteen claims.

- [ ] **Step 4: Run combined checks and commit.**

Run: `npm run claims && npm test -- --run src/advice scripts/build-claims.test.ts && npm run typecheck`

Commit: `deepen training and energy balance claims`

### Task 6: Curate protein and loading/exercise-selection breadth, then audit the full base

**Files:**
- Create: eleven topic-specific `app/claims/*.yaml` records
- Modify: `app/claims/review-ledger.json`
- Modify: `docs/00-meta/claim-review-queue.md`
- Modify: `docs/PROJECT-STATE.md`
- Modify: `docs/00-meta/decision-log.md`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- Add: four protein-dose, one pre-sleep protein-timing, three loading/rep-range, and three exercise-selection claims, adjusting the exact mix to finish at approximately 50 without duplicate claim scopes.
- Complete a final claim-base audit row for every claim and citation, including the existing failure-proximity figure gap.

- [ ] **Step 1: Apply the discover → resolve → source-read → extract → grade → two-review chain to every new claim.**

Keep timing claims contested only where direct sources support genuine disagreement; otherwise author settled records. Do not attach personal protein predicates without intake-completeness evidence.

- [ ] **Step 2: Run the full hostile audit.**

Re-read all M1 and M6 records against the ledger. Resolve the existing empty-figure record by extracting a source-read number or documenting why no numeric figure is available; never invent one to satisfy a count.

- [ ] **Step 3: Update durable project records.**

Record final count/topic coverage, unresolved evidence gaps, automated gates, and manual-review method. Update review dates only when literature was actually re-read.

- [ ] **Step 4: Run the release-quality suite and commit.**

Run: `npm run claims && npm run typecheck && npm test -- --run && npm run build && npm run e2e`

Commit: `complete M6 evidence claim base`

### Task 7: Final evidence and code review

**Files:**
- Modify only if review findings require a narrowly scoped correction.

- [ ] **Step 1: Review the complete branch diff and all ledger rows.**

Verify T1/GR-1/GR-3/GR-4/GR-5/GR-6, every `data-earned` classification, all contested clusters, generated-bundle drift, and no stale `EMPTY_SNAPSHOT` user path.

- [ ] **Step 2: Address review findings with focused regression tests.**

Use the reviewer’s exact findings; do not bundle unrelated cleanup.

- [ ] **Step 3: Re-run full verification and document the result.**

Run: `npm run claims && npm run typecheck && npm test -- --run && npm run build && npm run e2e`

Commit: `close M6 claim review findings`

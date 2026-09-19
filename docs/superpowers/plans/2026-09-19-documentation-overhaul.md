# MyoStat Documentation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale, build-diary-shaped documentation with an accurate, visual, audience-layered explanation of MyoStat while preserving every existing document in a dated archive or its existing historical location.

**Architecture:** Keep `README.md` as a concise front door and make `docs/README.md` the documentation router. Put detailed app, architecture, operations, and reference material in focused Markdown files; use Mermaid for systems/data flows and reproducible synthetic-data screenshots for UI explanation. Runtime code, tests, claim YAML, and migrations are the authority whenever historical prose disagrees.

**Tech Stack:** Markdown, Mermaid, React/Vite project sources, SQLite/Drizzle schemas, Playwright for deterministic screenshots, Vitest for documentation contracts, Git.

## Global Constraints

- Work only on `codex/documentation-overhaul`, which was created from the current local `main` on 2026-09-19.
- Preserve the pre-existing untracked `docs/handoffs/` directory exactly; never stage or commit it unless the user separately asks.
- Do not reset, rebase, discard, or overwrite the user's current local history; `main` was 35 commits ahead of `origin/main` when this branch was created.
- Do not delete existing documentation. Snapshot every canonical document before rewriting it, and leave the existing research/history corpus intact.
- Keep the product guardrails from `app/CLAUDE.md`: structural claim provenance, harm guards in code, wellness framing, copyright care, no fabricated precision, local-first persistence, and privacy by default.
- Never invent feature completion, claim counts, citations, screenshots, test results, or precision. Distinguish implemented UI, implemented backend/helper, tested contract, partially verified flow, and planned work.
- No runtime feature or claim-corpus changes belong in this branch. Small documentation tooling and stale comment corrections are allowed when they do not change behaviour.
- Use synthetic data only in screenshots. Never capture personal or existing health data.
- Prefer repository-relative Markdown links inside documentation and verify every link.
- Keep the root README concise. Detailed explanations live under `docs/`.
- Commit after every independently reviewable documentation slice. Use short human messages without conventional-commit prefixes or AI attribution.

---

## Verified baseline to preserve in the rewrite

The executing agent must re-check these facts before publishing them, but this audit found:

- Eight React routes: Hub, Train, Eat, Goal, Weight, Settings, Trends, and Review; Hub/Train/Eat are the persistent tabs.
- Nine local SQLite tables: `users`, `exercises`, `workouts`, `sets`, `weights`, `advice_events`, `food_items`, `food_log_entries`, and `sync_meta`.
- Six replicated tables: `users`, `workouts`, `sets`, `weights`, `advice_events`, and `food_log_entries`.
- Six numbered local migrations through `0006_advice_surface.sql`.
- 32 curated claim YAML files: 6 grade A, 16 grade B, 10 grade C; 30 settled and 2 contested; 11 domains.
- A 56-exercise authored seed and a 38-row audited CoFID common-food seed.
- The barcode camera is implemented and wired. The Hevy CSV parser is tested but not exposed through a UI.
- Device export and device erasure exist. Server-side erasure does not.
- Sync contract tests exist; a real browser-to-Worker/D1 Playwright round trip does not.
- The September 2 verification recorded 770 Vitest tests across 70 files, but current results must be rerun rather than copied.

## Target file map

**Create:**

- `docs/product/overview.md`
- `docs/product/feature-tour.md`
- `docs/product/safety-privacy.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/data-model.md`
- `docs/architecture/local-first-storage.md`
- `docs/architecture/advice-engine.md`
- `docs/architecture/json-logic.md`
- `docs/architecture/domain-algorithms.md`
- `docs/architecture/sync.md`
- `docs/guides/development.md`
- `docs/guides/testing.md`
- `docs/guides/deployment.md`
- `docs/guides/evidence-curation.md`
- `docs/reference/feature-status.md`
- `docs/reference/requirements-traceability.md`
- `docs/reference/repository-map.md`
- `docs/reference/terminology.md`
- `docs/assets/screenshots/README.md`
- `docs/archive/documentation-pre-overhaul-2026-09-19/MANIFEST.md`
- `app/scripts/check-doc-links.test.ts`
- A dedicated Playwright screenshot capture file and package script, with the exact path chosen during Task 8 after inspecting the current Playwright config.

**Rewrite after archiving:**

- `README.md`
- `docs/README.md`
- `PRODUCT.md`
- `DESIGN.md` only where facts or cross-links are stale; retain the visual design contract.
- `docs/REQUIREMENTS.md` only where implementation decisions formally amended the requirement; preserve stable IDs.
- `docs/PROJECT-STATE.md`
- `docs/BUILD-PLAN.md` as a compact compatibility/roadmap page pointing to its archived full historical plan.
- `docs/OPEN-QUESTIONS.md` as a current open/closed register.
- Stale documentation comments in `app/src/consent-enforcement.test.ts` and `app/src/guards-enforcement.test.ts`.

**Retain and link rather than duplicate:**

- `app/claims/ADDING-A-CLAIM.md`
- `app/claims/schema.md`
- `app/claims/review-ledger.json`
- `app/server/README.md`
- `app/src/assets/exercises/README.md`
- `docs/00-meta/evidence-standards.md`
- `docs/00-meta/decision-log.md`
- `docs/00-meta/claim-review-queue.md`
- `docs/ios-gate.md`
- `docs/01-research/`, `docs/03-thesis-review/`, `docs/04-sources/`, and the existing `docs/archive/` history.

---

### Task 1: Re-establish the branch and record a truth baseline

**Files:**

- Read: `AGENTS.md`
- Read: `app/CLAUDE.md`
- Read: `docs/superpowers/specs/2026-09-19-documentation-overhaul-design.md`
- Read: this plan
- Create: `docs/archive/documentation-pre-overhaul-2026-09-19/MANIFEST.md`

- [ ] **Step 1: Verify the worktree without changing it**

Run:

```bash
git status --short --branch
git branch --show-current
git log -8 --oneline
```

Expected: branch is `codex/documentation-overhaul`; `docs/handoffs/` remains the only known pre-existing untracked path unless the user has since changed the worktree.

- [ ] **Step 2: Generate a read-only implementation inventory**

Inspect routes, exported APIs, migrations, claim files, test files, package scripts, and all Markdown headings using `rg`, `rg --files`, and the existing `graphify-out/graph.json`. Record discrepancies in the manifest's audit section; do not treat historical prose as truth.

- [ ] **Step 3: Run the baseline checks before rewriting**

Run from `app/`:

```bash
npm run claims
npm test -- --run
npm run typecheck
npm run build
npm --prefix server test
npm --prefix server run typecheck
```

Record exact current results in the dated feature-status page later. If a baseline failure exists, document it and keep documentation work separate from a behavioural fix.

- [ ] **Step 4: Start the archive manifest**

Add a table with columns: original path, archived path, original role, known drift, new authority, carried-forward content. Include every file named under Task 2 before copying it.

- [ ] **Step 5: Commit the baseline manifest**

```bash
git add docs/archive/documentation-pre-overhaul-2026-09-19/MANIFEST.md
git commit -m "record the documentation truth baseline"
```

### Task 2: Snapshot every canonical document before editing it

**Files:**

- Copy unchanged into: `docs/archive/documentation-pre-overhaul-2026-09-19/`
- Update: `docs/archive/documentation-pre-overhaul-2026-09-19/MANIFEST.md`

- [ ] **Step 1: Snapshot the repository-level documents byte-for-byte**

Copy `README.md`, `PRODUCT.md`, and `DESIGN.md` into archive names that retain their origin, such as `root-README.md`, `root-PRODUCT.md`, and `root-DESIGN.md`.

- [ ] **Step 2: Snapshot the current canonical build documents byte-for-byte**

Copy `docs/README.md`, `docs/REQUIREMENTS.md`, `docs/BUILD-PLAN.md`, `docs/PROJECT-STATE.md`, and `docs/OPEN-QUESTIONS.md` into the dated archive.

- [ ] **Step 3: Snapshot current operational entry documents only if they will be edited**

If the execution changes `app/server/README.md`, `app/claims/ADDING-A-CLAIM.md`, `app/claims/schema.md`, or `docs/ios-gate.md`, archive each one before its first edit. Prefer linking to them unchanged.

- [ ] **Step 4: Verify snapshot identity**

Use `shasum -a 256` on each original/archive pair and put the hashes in the manifest. This proves preservation before the canonical file changes.

- [ ] **Step 5: Commit the archive as one recoverable checkpoint**

```bash
git add docs/archive/documentation-pre-overhaul-2026-09-19
git commit -m "archive the pre-overhaul documentation"
```

After this commit, treat the dated archive as append-only except for correcting its manifest.

### Task 3: Build the documentation navigation and concise README

**Files:**

- Modify: `README.md`
- Modify: `docs/README.md`
- Create: all directories in the target file map with initial index links

- [ ] **Step 1: Write the new documentation home**

Make `docs/README.md` a navigation page with four reading paths:

- app/recruiter tour;
- developer setup and architecture;
- evidence/claim curation;
- historical research and decisions.

Label current, normative, generated, and historical material explicitly.

- [ ] **Step 2: Rewrite the root README as a front door**

Keep it to the product promise, a representative screenshot strip or hero image, current implemented scope plus honest gaps, quick start, one architecture diagram, essential commands, and links to detailed documentation. Remove long duplicated guardrail and layout sections once their detailed homes exist.

- [ ] **Step 3: Add an honest status capsule**

State that the app has a working training/nutrition/advice/review loop and optional sync, while explicitly calling out the claim-base target gap, parser-only Hevy import, device-only deletion, and missing real Worker/D1 browser round trip. Link to `docs/reference/feature-status.md` rather than expanding them all.

- [ ] **Step 4: Validate navigation manually**

Open every README and docs-index link from its rendered relative location. Do not leave links pointing at files planned but not yet created; temporary stubs must contain scope and ownership, not `TODO`.

- [ ] **Step 5: Commit the front door**

```bash
git add README.md docs/README.md docs/product docs/architecture docs/guides docs/reference docs/assets
git commit -m "give MyoStat a clear documentation front door"
```

### Task 4: Document the app and every user-visible workflow

**Files:**

- Create: `docs/product/overview.md`
- Create: `docs/product/feature-tour.md`
- Create: `docs/product/safety-privacy.md`
- Modify: `PRODUCT.md`
- Modify: `docs/reference/feature-status.md`
- Modify: `docs/reference/terminology.md`

- [ ] **Step 1: Write the product overview**

Explain the target lifter, the two-tracker problem, evidence grading as the differentiator, the local-first posture, and what “honest” means in product terms. Preserve useful reasoning from `PRODUCT.md` but remove historical claims that the claim base or brand assets do not exist.

- [ ] **Step 2: Write a route and screen map**

Document the eight routes and the Hub/Train/Eat tab structure. For each route, state whether consent is required, which data it reads/writes, its empty/error/offline states, and the route's next actions.

- [ ] **Step 3: Write the complete tracker tour**

Cover every item listed under “Product documentation” in the design. Trace claims to `App.tsx`, feature components, and their tests. Mark the Hevy functionality as a tested parser, not a shipped import workflow.

- [ ] **Step 4: Write the safety and privacy guide**

Explain maintenance default, calorie floors, deficit cap, numbers-hidden mode, no streak/eat-back framing, wellness-only boundary, consent gate, on-device default, food-search network disclosure, export, device erasure, server erasure gap, and no health data in URLs.

- [ ] **Step 5: Build the feature status matrix**

Use columns: area, user capability, implementation state, verification state, primary code, primary tests, requirement IDs, known gap. States are exactly: `implemented`, `implemented but not user-wired`, `partial`, `planned`, `out of scope`.

- [ ] **Step 6: Audit `PRODUCT.md` rather than replacing its purpose**

Keep it as the durable product contract. Update only stale facts, add links to the product docs, and retain thesis, users, principles, and non-goals. Do not copy the entire feature tour into it.

- [ ] **Step 7: Commit the app documentation**

```bash
git add PRODUCT.md docs/product docs/reference/feature-status.md docs/reference/terminology.md
git commit -m "document the complete MyoStat product experience"
```

### Task 5: Document the system, storage, and data model

**Files:**

- Create: `docs/architecture/system-overview.md`
- Create: `docs/architecture/data-model.md`
- Create: `docs/architecture/local-first-storage.md`
- Create: `docs/reference/repository-map.md`

- [ ] **Step 1: Draw the system context diagram**

Show the React PWA, SQLite Web Worker, OPFS/IndexedDB fallback, service worker, optional Cloudflare Worker/D1 sync target, and Open Food Facts search/barcode paths. Label which paths work offline and which are optional network features.

- [ ] **Step 2: Explain boot and local persistence**

Trace `App.tsx` → `initDb()` → worker → storage selection → migrations → exercise/food seed → Drizzle proxy. Explain the visible memory-fallback warning, snapshot flush, tab-lock reason, and PWA precache of WASM.

- [ ] **Step 3: Draw and explain the local ER diagram**

Document all nine tables, key fields, soft deletion, intentional denormalisation, nullable semantics, and the relationship between workouts and sets, users and logs, claims and advice events, and sync metadata. Clearly note that claims are bundled data, not a SQLite table.

- [ ] **Step 4: Contrast local and remote schemas**

Explain why `exercises`, `food_items`, and `sync_meta` do not replicate; why remote rows have `id`, `updated_at`, `deleted_at`, opaque JSON `data`, and `server_seq`; and how this avoids a remote schema migration per local column.

- [ ] **Step 5: Write the repository map**

Map root documents and each `app/` directory to its responsibility, source of truth, and change triggers. Link directly to representative files instead of pasting a huge tree.

- [ ] **Step 6: Commit the foundation architecture docs**

```bash
git add docs/architecture/system-overview.md docs/architecture/data-model.md docs/architecture/local-first-storage.md docs/reference/repository-map.md
git commit -m "explain the local-first architecture and data model"
```

### Task 6: Document claims, JSON Logic, and the advice trust path

**Files:**

- Create: `docs/architecture/advice-engine.md`
- Create: `docs/architecture/json-logic.md`
- Create: `docs/guides/evidence-curation.md`
- Modify: `docs/reference/terminology.md`

- [ ] **Step 1: Draw the claim trust-chain diagram**

Trace source reading and review ledger → one YAML file per claim → Zod/build validations → generated `src/generated/claims.ts` → selection → grade-calibrated headline → `ClaimCard`/`EvidencePanel`/`FigureChart`. Mark the no-LLM and no-runtime-scholarly-network boundary.

- [ ] **Step 2: Document the complete claim and citation structures**

Explain every field from `src/advice/types.ts` and `claim-schema.ts`, including `peekStatement`, `trigger`, `surfaceContexts`, contested clusters, `supersededBy`, `lastReviewed`, citation `null` semantics, population `unstated`, re-plotted figures, and cross-record validation.

- [ ] **Step 3: Document all four advice routes**

Separate:

1. keyword question search;
2. snapshot predicate evaluation;
3. one-per-session/data-earned advice;
4. general surface-context selection.

For each, state inputs, selection rules, provenance, filters, output, and failure behaviour. Include cooldown, suppression, numbers-hidden filtering, contested siblings, grade ordering, and tie-to-silence logic.

- [ ] **Step 4: Write the JSON Logic grammar from the validator**

Document the only supported operators and variables. Include one valid root example, one valid `some(muscleSets)` example, one protein comparison with the required null guard, and invalid examples for unknown variables, wrong arity, nested `some`, or unsafe protein ordering. Explain that authoring rejects invalid rules while runtime evaluation fails closed.

- [ ] **Step 5: Write the evidence-curation navigation guide**

Do not duplicate `ADDING-A-CLAIM.md` or `schema.md`. Explain the workflow and link to the authoritative rubric, authoring guide, schema, review ledger, review queue, DOI audit, claim build, and generated-file drift test.

- [ ] **Step 6: Commit the evidence architecture docs**

```bash
git add docs/architecture/advice-engine.md docs/architecture/json-logic.md docs/guides/evidence-curation.md docs/reference/terminology.md
git commit -m "trace the evidence and advice trust path"
```

### Task 7: Document algorithms, sync, requirements, and engineering operations

**Files:**

- Create: `docs/architecture/domain-algorithms.md`
- Create: `docs/architecture/sync.md`
- Create: `docs/guides/development.md`
- Create: `docs/guides/testing.md`
- Create: `docs/guides/deployment.md`
- Create: `docs/reference/requirements-traceability.md`
- Modify: `docs/REQUIREMENTS.md`
- Modify: `docs/PROJECT-STATE.md`
- Modify: `docs/BUILD-PLAN.md`
- Modify: `docs/OPEN-QUESTIONS.md`
- Modify: `app/src/consent-enforcement.test.ts`
- Modify: `app/src/guards-enforcement.test.ts`

- [ ] **Step 1: Explain each deterministic domain algorithm**

For guards, energy estimation, e1RM, EWMA, volume, protein, snapshot construction, and reconciliation, document inputs, qualification/data sufficiency, output, source requirement IDs, tests, and explicit non-claims. Use formulas sparingly and show one worked synthetic example where it clarifies behaviour.

- [ ] **Step 2: Draw the sync sequence and conflict table**

Show local write → `markPending` → push/pull POST → server validation/auth → deterministic `incomingWins` → batched D1 upsert/server sequence → pull/apply → queue settlement/watermark. Include equal-timestamp content tie-break, tombstones, failed-network behaviour, in-flight de-duplication, and reconnect trigger.

- [ ] **Step 3: Write contributor setup and command guide**

Document Node version from CI, app/server install boundaries, available npm commands, environment variables, generated claim workflow, repository conventions, and the rule that `src/domain`/`src/advice` stay framework-free where intended.

- [ ] **Step 4: Write the testing guide**

Map unit, component, structural guard, generated-file, server contract, and Playwright coverage. Explain the e2e-only `window.__db` escape hatch and CI check that forbids it in production. Include focused commands and full verification commands.

- [ ] **Step 5: Write deployment guidance**

Cover the static PWA build, Workbox/WASM constraints, Worker/D1 setup, schema application, bearer secret, food-search CORS/origin configuration, `VITE_SYNC_URL`, `VITE_SYNC_TOKEN`, `VITE_FOOD_SEARCH_URL`, offline-only default, and current operational gaps. Link to `app/server/README.md` for exact Wrangler commands.

- [ ] **Step 6: Build the requirements traceability matrix**

Map G/NG/T/FR/NFR/GR/DM/AC identifiers to implementation state, code, test, and detailed documentation. Preserve requirement IDs. When a requirement is partial, say exactly which acceptance path is missing.

- [ ] **Step 7: Convert stale build ledgers into current compatibility pages**

Make `PROJECT-STATE.md` a concise dated status ledger, `BUILD-PLAN.md` a short current roadmap plus link to the archived historical plan, and `OPEN-QUESTIONS.md` a clean open/closed register. Remove contradictions; never erase the historical record because its snapshot already exists.

- [ ] **Step 8: Correct stale test documentation comments**

Update the two “dormant” comments so they describe the active structural checks. Do not change test logic in this task.

- [ ] **Step 9: Commit the engineering reference set**

```bash
git add docs/architecture/domain-algorithms.md docs/architecture/sync.md docs/guides docs/reference/requirements-traceability.md docs/REQUIREMENTS.md docs/PROJECT-STATE.md docs/BUILD-PLAN.md docs/OPEN-QUESTIONS.md app/src/consent-enforcement.test.ts app/src/guards-enforcement.test.ts
git commit -m "finish the engineering and requirements reference"
```

### Task 8: Capture reproducible, explanatory visuals

**Files:**

- Create: `docs/assets/screenshots/README.md`
- Create: screenshot PNGs under `docs/assets/screenshots/`
- Create: a dedicated screenshot capture script/spec under `app/`
- Modify: `app/package.json`
- Modify: `README.md`
- Modify: `docs/product/feature-tour.md`
- Modify: relevant architecture docs with Mermaid diagrams

- [ ] **Step 1: Define the screenshot contract**

Use a fixed mobile viewport, synthetic dates/data, default theme, stable filenames, no browser chrome, and no personal data. Document the exact capture command and what seed state each image represents.

- [ ] **Step 2: Add a dedicated capture command**

Reuse the existing Playwright/e2e build path so screenshots can seed the local database deterministically. Keep screenshot generation out of the normal e2e suite unless an explicit environment flag or dedicated command is present.

- [ ] **Step 3: Capture the minimum complete set**

Capture:

- consent gate;
- populated Hub with evidence/search context;
- active workout with set table and advice peek;
- exercise picker;
- Eat day plus food picker/OFF result or barcode entry;
- goal setup showing the estimate range and guarded deficit;
- trends with e1RM band/noise honesty and volume;
- weekly review with resolved or explicitly unresolved signals;
- evidence panel with grade, citation, population, sample size, and re-plotted figure;
- settings privacy/sync/data-rights section.

- [ ] **Step 4: Add diagrams as Mermaid source**

Keep diagrams inline in the Markdown unless rendering limitations require committed assets. Verify them in a GitHub-compatible Mermaid renderer. Never use a generated image as the only copy of architecture meaning.

- [ ] **Step 5: Embed selectively**

Use at most a compact three-screen montage or three representative images in the root README. Put the full visual tour in `docs/product/feature-tour.md`. Add descriptive alt text and captions.

- [ ] **Step 6: Verify image quality and size**

Inspect every PNG at full resolution, confirm text is legible, ensure images contain no transient timestamps that make them immediately misleading, and compress losslessly if practical.

- [ ] **Step 7: Commit the visual documentation**

```bash
git add app/package.json app/scripts app/e2e docs/assets README.md docs/product docs/architecture
git commit -m "add reproducible visuals to the documentation"
```

Stage exact paths rather than broad directories if unrelated files exist.

### Task 9: Add documentation checks and perform the drift audit

**Files:**

- Create: `app/scripts/check-doc-links.test.ts`
- Modify: `app/package.json` only if a dedicated docs check command is useful
- Modify: `.github/workflows/ci.yml` only if the check is fast, deterministic, and dependency-free
- Modify: any active documentation found inaccurate

- [ ] **Step 1: Write a failing internal-link test**

Create a Vitest test that walks active Markdown files, resolves repository-relative file/image links, ignores `http(s)`, `mailto`, anchors, and code fences, and reports the source file plus broken target. Exclude the archived snapshots from link validity because they intentionally preserve old relative paths.

- [ ] **Step 2: Run it and confirm it finds an intentional broken fixture**

Use a temporary in-test fixture, not a deliberately broken repository document. Expected: the fixture fails with a useful source/target message.

- [ ] **Step 3: Make the repository pass the link test**

Fix all broken active links and missing image alt text found during the audit. Do not rewrite archived snapshots to make their old links current.

- [ ] **Step 4: Run a contradiction search**

Search active docs for stale phrases and facts, including: zero claims, barcode not built, old branch names presented as current, dormant enforcement, nutrition UI absent, unqualified “feature-complete”, and old test counts presented without dates.

- [ ] **Step 5: Audit duplication and ownership**

For every repeated mutable fact, choose one owning page and replace duplicates with a short summary plus a link. Confirm README remains an outline rather than a second manual.

- [ ] **Step 6: Commit the documentation guard**

```bash
git add app/scripts/check-doc-links.test.ts app/package.json .github/workflows/ci.yml README.md PRODUCT.md DESIGN.md docs app/src/consent-enforcement.test.ts app/src/guards-enforcement.test.ts
git commit -m "keep documentation links and status claims honest"
```

Review `git diff --cached --name-only` before committing so `docs/handoffs/` is not included.

### Task 10: Final verification and handoff

**Files:**

- Modify only files required by verification findings

- [ ] **Step 1: Regenerate and verify claims have not drifted**

```bash
cd app
npm run claims
git diff --exit-code -- src/generated/claims.ts
```

Expected: no generated claim diff.

- [ ] **Step 2: Run all deterministic checks**

```bash
npm test -- --run
npm run typecheck
npm run build
npm --prefix server test
npm --prefix server run typecheck
```

- [ ] **Step 3: Run browser verification**

```bash
npm run e2e
npm run docs:screenshots
```

Expected: e2e passes and the screenshot command reproduces the committed assets without unexpected diffs.

- [ ] **Step 4: Perform visual review**

Render every active Markdown document or inspect it in the Codex Markdown view. Verify Mermaid diagrams, tables, captions, heading hierarchy, and screenshots at mobile and desktop widths.

- [ ] **Step 5: Perform final repository checks**

```bash
git diff --check
git status --short --branch
git log --oneline --decorate -12
```

Expected: no whitespace errors; only intentional documentation/tooling changes are committed; `docs/handoffs/` remains untouched and untracked if it was still present.

- [ ] **Step 6: Commit any verification-only correction separately**

Use a precise human message such as:

```bash
git commit -m "fix the last documentation cross-links"
```

- [ ] **Step 7: Report completion with evidence**

Summarise the document map, archive location, screenshot set, known product gaps, exact commands/results, and commit list. Do not call the app feature-complete beyond the scoped status matrix.

---

## Plan self-review

- **Spec coverage:** app explanation, trackers, every route, feature criteria, claims, JSON Logic, data structures, storage, sync, algorithms, safety, privacy, tests, deployment, visuals, archival preservation, and README scope all have explicit tasks.
- **Archive safety:** canonical originals are copied and hash-verified before editing; prior research/history remains untouched.
- **Status honesty:** the plan explicitly separates user-wired features, helper-only code, contract verification, full e2e, and planned work.
- **Maintenance:** mutable detail has an owning page; links and screenshots are reproducible and checked.
- **Commit cadence:** ten reviewable checkpoints are named, with additional small correction commits permitted.

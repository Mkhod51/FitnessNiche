# MyoStat Documentation Overhaul — Design

**Date:** 2026-09-19

**Status:** proposed execution design

**Branch:** `codex/documentation-overhaul`

## Purpose

Turn the repository's documentation from a build diary into an accurate, navigable explanation of both:

1. **MyoStat as an app** — who it serves, what each tracker and screen does, how the evidence experience works, what is complete, and what remains incomplete.
2. **MyoStat as a technical system** — its local-first architecture, schemas, domain algorithms, evidence model, JSON Logic rules, sync protocol, privacy and safety enforcement, testing, and deployment.

The root `README.md` becomes a concise front door. Detailed material lives below `docs/` and is linked from the README and from a documentation index.

## Why an accuracy pass must come first

The current documentation contains valuable reasoning, but it describes several different points in the project's history as if they were simultaneous. Verified examples:

- `PRODUCT.md` says the claim base does not exist and has zero claims; `app/claims/` and the generated bundle contain 32 claims.
- `docs/PROJECT-STATE.md` describes the barcode scanner as shipped, then later lists camera barcode scanning as absent. `BarcodeScanner.tsx` is wired into `FoodPicker.tsx` and has an extensive unit suite.
- `docs/PROJECT-STATE.md` names an old `m6` branch, while the documentation work starts from the current local `main` on `codex/documentation-overhaul`.
- `docs/BUILD-PLAN.md` pins an older `Claim` interface that lacks `peekStatement`, `trigger`, `surfaceContexts`, `unstated` population, and the expanded advice surface types now present in code.
- Requirements describe Hevy CSV import as a product capability, but the repository currently contains a tested parser with no user-facing import route.
- Comments in `consent-enforcement.test.ts` and `guards-enforcement.test.ts` still call their checks dormant even though the relevant screens exist.

The rewrite must therefore use the following precedence when sources disagree:

1. Runtime code and database migrations.
2. Tests and browser specifications.
3. Claim YAML plus the review ledger.
4. Current product requirements and decision log.
5. Historical plans, handoffs, and research notes.

No document may promote a requirement or tested helper into a shipped UI feature without tracing the user-facing route.

## Approaches considered

### 1. One exhaustive README

This would be easy to discover but difficult to maintain. Product explanation, JSON Logic grammar, database tables, screenshots, and deployment would compete for attention, and repeated facts would drift.

### 2. Audience-layered documentation portal — recommended

Keep the root README intentionally short, make `docs/README.md` the navigation hub, and separate product, architecture, guides, and reference material. Reuse existing specialist documents rather than copying them. This creates one obvious route for a recruiter, user, contributor, and future maintainer without building a documentation website.

### 3. Generated documentation site or wiki

A generated site would improve navigation, but it adds build and hosting machinery before the content is trustworthy. It is unnecessary for the current portfolio scope. The Markdown set can be migrated later because the proposed structure and links are generator-friendly.

## Chosen information architecture

```text
README.md                                  concise repository front door
PRODUCT.md                                 current product contract, audited
DESIGN.md                                  current visual/interaction system, audited
docs/
  README.md                                documentation index and reading paths
  product/
    overview.md                            app purpose, users, principles, boundaries
    feature-tour.md                        every visible workflow and tracker
    safety-privacy.md                      harm guards, consent, privacy, data rights
  architecture/
    system-overview.md                     components and end-to-end data flows
    data-model.md                          local schema, remote schema, ownership
    local-first-storage.md                 worker, SQLite WASM, OPFS, fallback, PWA
    advice-engine.md                       claim lifecycle and four selection paths
    json-logic.md                          allowed grammar, variables, examples, failure rules
    domain-algorithms.md                   e1RM, trends, volume, protein, reconciliation, targets
    sync.md                                queue, protocol, LWW, server sequence, failure modes
  guides/
    development.md                         setup, commands, project structure, conventions
    testing.md                             unit/integration/e2e/provenance/guard tests
    deployment.md                          PWA, Worker, D1, environment configuration
    evidence-curation.md                   map to the existing claim-authoring authorities
  reference/
    feature-status.md                      implemented, partial, planned, explicit gaps
    requirements-traceability.md           G/NG/T/FR/NFR/GR/DM/AC to code/tests/docs
    repository-map.md                      directory and file responsibility map
    terminology.md                         product and evidence vocabulary
  assets/
    screenshots/                           deterministic synthetic-data captures
    diagrams/                              only if a diagram cannot remain maintainable inline
  archive/
    documentation-pre-overhaul-2026-09-19/
      MANIFEST.md                          origin, reason, replacement for every snapshot
      ...                                  untouched copies of replaced canonical docs
```

Existing research, thesis review, decision logs, historical plans, claim authoring docs, and server README remain available. They are linked as source material, not silently rewritten into current-state documentation.

## Documentation responsibilities

### Root README

The README should answer only: what MyoStat is, why it is unusual, what can be demonstrated today, how to run it, its architecture in one diagram, its honest current status, and where to read more. It should not duplicate detailed algorithms, schema fields, or deployment instructions.

### Product documentation

The feature tour covers the complete user-visible surface:

- Consent and local health-data storage.
- Hub, smoothed bodyweight summary, evidence search, automatic general evidence, cooldown, and suppression.
- Workout lifecycle: start/resume, recent-session repeat, exercise picker, working/warm-up classification, weight/reps/RIR entry, previous-set fallback, finish summary, and one-card advice budget.
- Bodyweight logging.
- Nutrition day, meal slots, local/recents/common foods, gram entry, quick add, Open Food Facts search, barcode entry/camera scan, offline behaviour, incomplete-food rejection, and numbers-hidden behaviour.
- Goal setup: profile inputs, Mifflin–St Jeor range, maintenance default, guarded deficit slider, calorie/protein target storage, and general evidence on a bulk draft.
- Trends: EWMA bodyweight, qualifying e1RM regression and confidence band, noise-floor language, fractional weekly volume, and population-range framing.
- Weekly review: reconciliation verdict, unresolved signals, confidence, volume, protein on training days, and claim-backed interpretation.
- Settings: theme, training experience, numbers-hidden mode, sync configuration, manual sync, JSON/CSV export, device erasure, privacy explanation, and Beat/NHS signposting.
- PWA/offline install and storage fallback warning.
- Explicitly partial or absent UI, including the parser-only Hevy importer, server-side erasure, larger CoFID seed, USDA fallback, and real browser-to-D1 end-to-end verification.

### Technical documentation

The technical set must explain, with code links rather than pasted implementation:

- React routes and feature boundaries.
- SQLite WASM in a Web Worker, OPFS `opfs-sahpool`, memory/IndexedDB fallback, migrations, and seeding.
- All nine local tables and which six replicate remotely.
- Why the D1 schema stores each row as JSON and uses `server_seq` separately from device `updated_at`.
- Claim YAML to Zod validation to generated TypeScript to runtime selection to cited UI.
- Claim fields, citation fields, contested clusters, `null` semantics, review ledger, and DOI audit.
- JSON Logic's intentionally small language: `var`, `and`, `or`, `!`, comparisons, and `some`; root and nested variables; arity/scoping rules; the `proteinPerKg7d != null` guard; and silent-safe runtime failure.
- Advice paths: keyword query, snapshot predicate, data-earned/session advice, and general surface-context advice. Explain one-card limits, seven-day cooldown, suppression, numbers-hidden filtering, and grade ranking.
- Domain algorithms and honesty thresholds, including what they deliberately do not claim.
- Local write, pending queue, POST push/pull, deterministic content tie-break, server sequence watermark, tombstones, reconnect behaviour, and known sync gaps.
- Guardrail enforcement tests and provenance tests as architecture, not merely QA.

## Visual design

Use Mermaid diagrams inline where the relationship is the subject. The minimum useful set is:

1. App/system context.
2. Local write and optional sync sequence.
3. Claim authoring and runtime advice trust chain.
4. Local/remote data model ER diagram.
5. Advice selection decision flow.
6. Reconciliation input-to-verdict flow.

Use screenshots where the interface itself is the subject. Capture synthetic data only, from a reproducible mobile viewport, in the app's default theme. A compact README montage may use three representative screens; the feature tour should include focused captures of consent, Hub/evidence, workout, food picker, goal guard, trends, weekly review, evidence depth, and settings/privacy. Every image needs meaningful alt text and a caption that explains what to notice. Text remains authoritative when an image becomes stale.

## Archive policy

Before rewriting a canonical document, copy its exact pre-overhaul bytes into the dated archive and record:

- original path;
- archived path;
- whether the source was active, stale, or historical;
- its replacement or new authority;
- useful sections carried forward;
- known inaccuracies that must not be copied as present fact.

Do not archive or rewrite research simply because it is old. Research remains source material. Do not edit pre-existing historical archive contents. The new dated archive is append-only after the snapshot commit.

## Maintenance policy

- One fact has one owner. Other pages link to it.
- Mutable counts are dated or generated; they do not appear in the README unless they are central to the product status.
- Product claims distinguish **implemented**, **tested but not wired**, **partially verified**, and **planned**.
- Every requirement/status statement links to code, a test, or a source document.
- Internal Markdown links and checked-in image paths are verified automatically.
- Documentation-only work must not weaken runtime guardrails or alter the claim corpus.

## Success criteria

- A new reader can understand the app in under five minutes from the README.
- A contributor can trace every feature, data table, advice path, JSON Logic rule, requirement family, and known gap from the docs index.
- Historical content remains recoverable and clearly labelled.
- No active document asserts a known contradiction with code or tests.
- Screenshots are reproducible, privacy-safe, captioned, and linked.
- Documentation links, claims generation, unit tests, typecheck, production build, server tests, and relevant e2e checks pass.

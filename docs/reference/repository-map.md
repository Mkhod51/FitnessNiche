# Repository map

**Status:** Current orientation guide. This page links representative authorities instead of duplicating the repository tree.

## How to resolve conflicting information

For claims about implemented behavior, prefer current source, SQL migrations, authored claim YAML, and tests. [`REQUIREMENTS.md`](../REQUIREMENTS.md) is the normative target, not proof that every requirement ships. [`feature-status.md`](feature-status.md) records the current implementation and verification boundary. Dated research, plans, and archives explain decisions but do not override runtime evidence.

## Repository-root documents

| Document | Responsibility and source-of-truth role | Change when |
| --- | --- | --- |
| [`README.md`](../../README.md) | Short public entry point: product summary, current caveats, quick start, compact architecture, and navigation. It should agree with current docs but remain brief. | The top-level product story, setup entry point, or most important current gaps change. |
| [`PRODUCT.md`](../../PRODUCT.md) | Durable product contract: audience, promise, operating context, capabilities, constraints, and product principles. | Product intent or a durable boundary changes, not for routine implementation progress. |
| [`DESIGN.md`](../../DESIGN.md) | Normative visual and interaction contract: color, type, components, controls, motion, accessibility, and prohibitions. | A deliberate design-system or interaction decision changes. |
| [`AGENTS.md`](../../AGENTS.md) | Codex-specific project instructions and links to standing application context. | The required agent workflow or repository guardrails change. |
| [`app/CLAUDE.md`](../../app/CLAUDE.md) | Standing engineering context inherited from the earlier toolchain: product guardrails, architecture capsule, and definition of done. | A non-negotiable engineering or safety convention changes. |

## Documentation areas

| Area | Responsibility and authority | Change when |
| --- | --- | --- |
| [`docs/README.md`](../README.md) | Documentation router and document-status legend. | Pages move, status changes, or a reader path changes. |
| [`docs/REQUIREMENTS.md`](../REQUIREMENTS.md) | Normative requirement IDs, data-model targets, non-functional requirements, guardrails, and acceptance criteria. | Product requirements change; do not edit merely to describe current implementation. |
| [`docs/product/`](../product/) | Current product overview, feature tour, and user-facing safety/privacy boundaries. | The shipped user journey or communicated boundary changes. |
| [`docs/architecture/`](../architecture/) | Source-traced system, data, storage, advice, algorithm, and sync explanations. | Runtime architecture, schema, or algorithm behavior changes. Start at the [system overview](../architecture/system-overview.md). |
| [`docs/guides/`](../guides/) | Repeatable contributor, testing, deployment, and evidence-curation procedures. | A command, prerequisite, release step, or operational workflow changes. |
| [`docs/reference/`](./) | Lookup material: feature status, repository map, requirements traceability, and terminology. | Current status, verification evidence, mappings, or shared vocabulary changes. |
| [`docs/BUILD-PLAN.md`](../BUILD-PLAN.md) | Maintained compatibility/roadmap ledger with historical milestone structure. | A roadmap or compatibility decision changes; current completion claims belong in feature status. |
| [`docs/PROJECT-STATE.md`](../PROJECT-STATE.md) and [`docs/OPEN-QUESTIONS.md`](../OPEN-QUESTIONS.md) | Project ledger and explicitly unresolved implementation questions. | A recorded question or state entry is answered, superseded, or newly discovered. |
| [`docs/ios-gate.md`](../ios-gate.md) | Human-run iOS/OPFS verification procedure and result form. | The platform gate, tunnel setup, or recorded device result changes. |
| [`docs/00-meta/`](../00-meta/), [`01-research/`](../01-research/), [`03-thesis-review/`](../03-thesis-review/), and [`04-sources/`](../04-sources/) | Research, evidence standards, source notes, and dated decision context. These are audit material, not runtime authority. | New research or review work is deliberately added with provenance. |
| [`docs/archive/`](../archive/) | Preserved build history and dated pre-overhaul documentation. Treat the dated archive as read-only. | Only when adding an intentional historical snapshot or archive index. |

## Application top level

| Area | Responsibility and authority | Change when |
| --- | --- | --- |
| [`app/package.json`](../../app/package.json), [`vite.config.ts`](../../app/vite.config.ts), and [`playwright.config.ts`](../../app/playwright.config.ts) | Application dependencies, scripts, build/PWA behavior, development food proxy, and browser-test runtime. | A dependency, command, bundling rule, service-worker asset rule, or e2e environment changes. |
| [`app/claims/`](../../app/claims/) | Authored claim YAML, authoring contract, and review ledger. This is the source for claim statements, grades, citations, predicates, and review metadata. | Evidence curation adds or revises a claim; follow [ADDING-A-CLAIM.md](../../app/claims/ADDING-A-CLAIM.md). |
| [`app/scripts/`](../../app/scripts/) | Build-time claim generation and DOI audit tooling. | The claim source contract, generated output, or audit process changes. |
| [`app/e2e/`](../../app/e2e/) | Playwright coverage for real browser, service-worker, OPFS, fallback, offline, and primary user flows. | Behavior depends on browser APIs, navigation, installation, or persistence rather than unit-level code alone. |
| [`app/public/`](../../app/public/) | Static icons and public assets copied into the build. | Install icons, favicon, or other immutable public assets change. |
| [`app/server/`](../../app/server/) | Optional Cloudflare Worker/D1 deployment: schema, bearer auth, push/pull merge, food-search proxy, and Worker tests. [`schema.sql`](../../app/server/schema.sql) and [`src/index.ts`](../../app/server/src/index.ts) are representative authorities. | The remote wire contract, D1 envelope, auth, food proxy, deployment config, or server tests change. |
| [`app/.impeccable/`](../../app/.impeccable/) | Checked-in configuration for the frontend design-review tooling; it is not application runtime state. | The design tool's project configuration changes. |

Generated `dist/`, test reports, dependency directories, local Graphify output, and other ignored tooling caches are not sources of truth and should not be documented as application modules.

## `app/src/` modules

| Area | Responsibility and authority | Change when |
| --- | --- | --- |
| [`App.tsx`](../../app/src/App.tsx), [`main.tsx`](../../app/src/main.tsx), [`pwa.ts`](../../app/src/pwa.ts), and [`index.css`](../../app/src/index.css) | Application composition: boot, routing shell, theme/PWA startup, storage warning, and global tokens/styles. | Startup order, routes, navigation, global presentation, or PWA registration changes. |
| [`src/advice/`](../../app/src/advice/) | Framework-free claim validation, snapshot construction, deterministic predicate evaluation, search, and advice selection. [`engine.ts`](../../app/src/advice/engine.ts) and [`types.ts`](../../app/src/advice/types.ts) define the central runtime contract. | Advice inputs, allowed predicates, selection policy, or claim types change. |
| [`src/assets/`](../../app/src/assets/) | Source-controlled in-app assets and their attribution/ownership notes. | A runtime asset or its provenance changes. |
| [`src/components/`](../../app/src/components/) | Reusable presentational components for evidence cards, charts, meters, marks, and icons. | A shared UI primitive or accessibility behavior changes. |
| [`src/db/`](../../app/src/db/) | Local persistence authority: Drizzle schema, worker/RPC transport, migrations, snapshots, seeds, exports, and table-specific accessors. Start with [`schema.ts`](../../app/src/db/schema.ts), [`client.ts`](../../app/src/db/client.ts), and [`sqlite.worker.ts`](../../app/src/db/sqlite.worker.ts). | A local table, migration, persistence behavior, seed, export, or data-access invariant changes. Append migrations under [`src/db/migrations/`](../../app/src/db/migrations/); do not rewrite deployed history. |
| [`src/domain/`](../../app/src/domain/) | Pure calculations and hard policy guards for energy, e1RM, trends, volume, protein, and reconciliation. | A formula, qualification rule, uncertainty treatment, or safety threshold changes; update adversarial tests with it. |
| [`src/features/`](../../app/src/features/) | Route- and workflow-level React slices. Feature components orchestrate domain, advice, and database modules rather than redefining their policy. | A user flow, screen state, or feature-specific interaction changes. See the slice map below. |
| [`src/food/`](../../app/src/food/) | Food-provider boundary: local cache queries, Open Food Facts parsing/client, barcode normalization, connectivity signal, macro scaling, and types. | Provider schema, honesty filter, cache behavior, lookup path, or portion math changes. |
| [`src/generated/`](../../app/src/generated/) | Generated TypeScript consumed at runtime. [`claims.ts`](../../app/src/generated/claims.ts) is produced by `npm run claims` and must not be hand-edited. | Regenerate after claim YAML or generator changes. |
| [`src/sync/`](../../app/src/sync/) | Optional client replication: shared protocol/allowlist, queue and watermark, D1 merge, table mapping, runtime configuration, and retry orchestration. | A replicated table, wire shape, conflict rule, queue behavior, or sync setting changes. Start with [`protocol.ts`](../../app/src/sync/protocol.ts). |
| Colocated `*.test.ts` and `*.test.tsx` files | Fast behavioral contracts beside the implementation they protect; [`test-setup.ts`](../../app/src/test-setup.ts) owns shared jsdom setup. | Behavior changes or a regression needs an executable guard. |

## Feature slices

| Slice | Responsibility | Representative source |
| --- | --- | --- |
| `features/advice/` | Feed, search, cards, and evidence presentation | [`AdviceFeed.tsx`](../../app/src/features/advice/AdviceFeed.tsx) |
| `features/exercises/` | Exercise selection | [`ExercisePicker.tsx`](../../app/src/features/exercises/ExercisePicker.tsx) |
| `features/hub/` | Home/hub composition | [`Hub.tsx`](../../app/src/features/hub/Hub.tsx) |
| `features/import/` | Tested Hevy CSV parsing; not currently a routed import UI | [`hevy.ts`](../../app/src/features/import/hevy.ts) |
| `features/log/` | Workout/set and bodyweight logging | [`LogWorkout.tsx`](../../app/src/features/log/LogWorkout.tsx) |
| `features/nutrition/` | Day log, goals, food picker, and barcode scanner | [`EatDay.tsx`](../../app/src/features/nutrition/EatDay.tsx) |
| `features/onboarding/` | Explicit consent gate | [`ConsentGate.tsx`](../../app/src/features/onboarding/ConsentGate.tsx) |
| `features/review/` | Weekly review surface | [`Review.tsx`](../../app/src/features/review/Review.tsx) |
| `features/settings/` | Export, deletion, theme, attributions, and optional sync configuration | [`Settings.tsx`](../../app/src/features/settings/Settings.tsx) |
| `features/trends/` | Strength, bodyweight, and volume trend presentation | [`Trends.tsx`](../../app/src/features/trends/Trends.tsx) |

For a behavioral inventory rather than a code map, use [feature status](feature-status.md). For component and data flow, start with the [system overview](../architecture/system-overview.md).

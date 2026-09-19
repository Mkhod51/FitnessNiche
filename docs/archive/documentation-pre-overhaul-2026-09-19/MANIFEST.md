# Pre-overhaul documentation manifest

**Baseline date:** 2026-09-19

**Branch:** `codex/documentation-overhaul`

**Baseline commit:** `e000868` (`prepare the documentation agent handoff`)

This manifest records the implementation and documentation baseline before any canonical document is rewritten. Runtime code and database migrations outrank tests; tests outrank claim metadata and current requirements; historical plans, handoffs, and research notes are context rather than present-state authority.

The Task 2 snapshot is complete. The pre-existing untracked `docs/handoffs/` directory is outside this work and was not edited, staged, archived, deleted, or committed.

## Archive inventory

Every possible Task 2 target is listed before copying. Rows marked **conditional** are archived only if the original will be edited; otherwise the original remains the linked specialist authority.

| Original path | Archived path | Original role | Known drift | New authority | Carried-forward content |
| --- | --- | --- | --- | --- | --- |
| `README.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/root-README.md` | Repository front door | Broadly calls M0–M5 and the food database feature-complete; lacks a scoped status matrix and explicit product gaps. | Rewritten `README.md`, `docs/README.md`, and `docs/reference/feature-status.md` | Product promise, quick start, guardrail summary, stack overview, and links to deeper documentation. |
| `PRODUCT.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/root-PRODUCT.md` | Durable product contract | Presents Hevy import and roughly 50-claim retrieval as confirmed capabilities, then says the claim base has zero claims. Runtime has a tested but unwired parser and 32 generated claims. | Audited `PRODUCT.md`; `docs/product/overview.md`; `docs/product/feature-tour.md`; `docs/reference/feature-status.md` | Thesis, target users, principles, non-goals, evidence-grading promise, and stable requirement references. |
| `DESIGN.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/root-DESIGN.md` | Visual and interaction contract | Predates parts of the shipped tracker/advice surface and the planned screenshot set; implementation claims require source revalidation. | Audited `DESIGN.md`; `docs/product/feature-tour.md`; `docs/assets/screenshots/README.md` | Visual language, typography, colour, interaction principles, and accessibility intent. |
| `docs/README.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/README.md` | Documentation index | Organises a build diary and historical corpus rather than clear product, developer, evidence, and history reading paths. | Rewritten `docs/README.md` | Useful corpus map and links to retained research, decisions, plans, and specialist guides. |
| `docs/REQUIREMENTS.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/REQUIREMENTS.md` | Normative product and acceptance requirements | Some requirements describe target scope as shipped behaviour, notably user-facing Hevy import; amendments and implementation state need separation. | Audited `docs/REQUIREMENTS.md`; `docs/reference/requirements-traceability.md`; `docs/reference/feature-status.md` | Stable requirement IDs, goals, non-goals, guardrails, acceptance criteria, and documented amendments. |
| `docs/BUILD-PLAN.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/BUILD-PLAN.md` | Historical implementation plan and pinned architecture | Calls milestones feature-complete while retaining unchecked historical tasks; its pinned claim interface predates the current schema and advice surfaces. | Compact audited `docs/BUILD-PLAN.md`; architecture pages; this dated snapshot for full history | Rationale, locked stack, milestone history, interface decisions that remain true, and links to requirement IDs. |
| `docs/PROJECT-STATE.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/PROJECT-STATE.md` | Current-state ledger | Names `m6` as the current branch; contains contradictory barcode status, stale dormant-guard wording, and a dated verification snapshot. | Audited `docs/PROJECT-STATE.md`; `docs/reference/feature-status.md`; current architecture and testing guides | Decision history, milestone evidence, dated verification notes, and still-open gaps after source validation. |
| `docs/OPEN-QUESTIONS.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/OPEN-QUESTIONS.md` | Open/closed product and technical question register | Mixes resolved historical questions with genuinely open work and can be mistaken for current implementation status. | Rewritten `docs/OPEN-QUESTIONS.md`; `docs/reference/feature-status.md`; decision log | Question IDs, resolution rationale, reversal triggers, and unresolved decisions that remain current. |
| `app/server/README.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/server-README.md` (**conditional**) | Worker/D1 setup and deployment entry point | Must be checked against the current bearer-authenticated `POST /sync`, six-table replica, and server-sequence watermark contract if edited. | Unchanged `app/server/README.md` when possible; otherwise `docs/guides/deployment.md` and `docs/architecture/sync.md` | D1 setup, secret configuration, local development, tests, typecheck, and deployment commands. |
| `app/claims/ADDING-A-CLAIM.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/claims-ADDING-A-CLAIM.md` (**conditional**) | Claim-authoring procedure | Specialist content should remain authoritative and be linked, not duplicated; any mutable counts or old schema examples require validation if edited. | Unchanged `app/claims/ADDING-A-CLAIM.md` when possible; `docs/guides/evidence-curation.md` as the routing guide | Authoring workflow, validation steps, calibrated language, citations, figures, and review procedure. |
| `app/claims/schema.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/claims-schema.md` (**conditional**) | Human-readable claim schema contract | Review-ledger records remain pending; examples and fields must match `claim-schema.ts` if edited. | `app/src/advice/types.ts`, `app/src/advice/claim-schema.ts`, and unchanged `app/claims/schema.md`; explanatory pages under `docs/architecture/` | Field definitions, predicate grammar, citation/figure rules, review metadata, and authoring constraints. |
| `docs/ios-gate.md` | `docs/archive/documentation-pre-overhaul-2026-09-19/ios-gate.md` (**conditional**) | iOS validation and release gate | Retain as an operational procedure; only current command, capability, or cross-link drift warrants editing. | Unchanged `docs/ios-gate.md` when possible; `docs/guides/deployment.md` for discovery | Platform test procedure, go/no-go criteria, evidence capture, and release safeguards. |

## Snapshot identity

**Final snapshot status:** complete. Each unconditional original/archive pair below was verified with `shasum -a 256` and an exact byte comparison before any canonical document edit.

| Original | Archived snapshot | Original SHA-256 | Archived SHA-256 | Byte comparison |
| --- | --- | --- | --- | --- |
| `README.md` | `root-README.md` | `1df1ef57e25cafe52fd44fa5941b4c0f24a345c5ba1fa056f8d3876d080a0954` | `1df1ef57e25cafe52fd44fa5941b4c0f24a345c5ba1fa056f8d3876d080a0954` | identical |
| `PRODUCT.md` | `root-PRODUCT.md` | `cd54580ea211b609e6ad6fa3fddc425c4fcfddc4eacab9e3df93f96e423bf961` | `cd54580ea211b609e6ad6fa3fddc425c4fcfddc4eacab9e3df93f96e423bf961` | identical |
| `DESIGN.md` | `root-DESIGN.md` | `5c0ecc530fdf305cff4dd900ede0ae85ec5059af35eb78b0831d7a4402d4ae46` | `5c0ecc530fdf305cff4dd900ede0ae85ec5059af35eb78b0831d7a4402d4ae46` | identical |
| `docs/README.md` | `README.md` | `f12c96133e75e869f38f7d24a83dd1368d68864099e7907401752c0462bd5747` | `f12c96133e75e869f38f7d24a83dd1368d68864099e7907401752c0462bd5747` | identical |
| `docs/REQUIREMENTS.md` | `REQUIREMENTS.md` | `8cb95a0fb8b1abab03c8d2be49c6b16bdaa93bcda40139d52fadd144e81f6bf2` | `8cb95a0fb8b1abab03c8d2be49c6b16bdaa93bcda40139d52fadd144e81f6bf2` | identical |
| `docs/BUILD-PLAN.md` | `BUILD-PLAN.md` | `316d949e2528beb3ed8f34219c50b915e1ac87b87d6e44d1f8cacbd40782f7cb` | `316d949e2528beb3ed8f34219c50b915e1ac87b87d6e44d1f8cacbd40782f7cb` | identical |
| `docs/PROJECT-STATE.md` | `PROJECT-STATE.md` | `207011e538ac5b96e32f6e2c4733ce77380248ecfb8e05047de102b935823cc3` | `207011e538ac5b96e32f6e2c4733ce77380248ecfb8e05047de102b935823cc3` | identical |
| `docs/OPEN-QUESTIONS.md` | `OPEN-QUESTIONS.md` | `d8c303ea2d0ed374d5abd14822de8d0f1a9234365e2cc68a574d8d723d9eb1da` | `d8c303ea2d0ed374d5abd14822de8d0f1a9234365e2cc68a574d8d723d9eb1da` | identical |

The conditional operational documents (`app/server/README.md`, `app/claims/ADDING-A-CLAIM.md`, `app/claims/schema.md`, and `docs/ios-gate.md`) were not archived because this execution leaves them unchanged.

## Truth audit

### Worktree and authority boundary

- The worktree was inspected on `codex/documentation-overhaul` at `e000868`; `docs/handoffs/` was the only untracked path and was not touched.
- The existing `docs/archive/build-history/`, `docs/archive/phase1-ideation/`, `docs/archive/phase1-research/`, and `docs/archive/phase2-ideation/` trees remain historical records and are not re-archived or rewritten.
- Current implementation claims below were checked against routes, migrations, exported code seams, authored claims, generated claims, tests, package scripts, and tracked Markdown. The existing `graphify-out/graph.json` was used as an index, then material claims were verified in source.

### Implementation inventory

- **Routes:** `app/src/App.tsx` declares exactly eight routes: `/`, `/train`, `/eat`, `/goal`, `/weight`, `/settings`, `/trends`, and `/review`. Hub, Train, and Eat are the three persistent navigation tabs. There is no catch-all route.
- **Storage schema:** `app/src/db/schema.ts` defines nine domain tables: `users`, `exercises`, `workouts`, `sets`, `weights`, `advice_events`, `food_items`, `food_log_entries`, and `sync_meta`. Migration machinery also creates `_migrations`, so the physical local database has ten tables including bookkeeping.
- **Migrations:** six ordered SQL migrations exist: `0001_init.sql`, `0002_trackers.sql`, `0003_nutrition.sql`, `0004_goal_clock.sql`, `0005_training_experience.sql`, and `0006_advice_surface.sql`.
- **Reference seeds:** source contains 56 authored exercises and 38 audited common-food rows.
- **Claims:** 32 YAML claims generate `app/src/generated/claims.ts`, with 36 citations. Grades are A 6, B 16, C 10, D 0; status is 30 settled and 2 contested across 11 domains. Seven claims have predicates (six `rule`, one `data-earned`); no claim has a non-null `supersededBy`.
- **Exported code seams:** a bounded scan found 271 `export` declarations across `app/src`, `app/server/src`, and `app/scripts`. The documentation-facing seams include calorie guards and energy estimates; e1RM, EWMA, volume, protein, and reconciliation; claim validation/evaluation/search/surface/session selection; local database read/write/export/erasure APIs; sync protocol/queue/merge/configuration; and Worker request validation/application. These are module APIs, not evidence of user-facing navigation by themselves.
- **Tests:** 84 test/spec files are tracked: 68 under `app/src`, 2 under `app/scripts`, 1 under `app/server`, and 13 Playwright specs under `app/e2e`. Vitest discovers the 68 source plus 2 script files as the 70-file app suite.
- **Scripts:** the app exposes `dev`, `build`, `preview`, `test`, `typecheck`, `e2e`, `claims`, and `claims:audit-dois`. The server exposes `dev`, `deploy`, `typecheck`, and `test`. No documentation-link checker, screenshot-capture script, or committed screenshot directory exists yet.
- **Markdown:** 80 tracked Markdown files contain 741 headings and 220 Markdown links. The baseline audit found all 89 repository-relative targets resolvable, but 15 target directories and should become explicit file links. No tracked Markdown image reference exists. `docs/brand/icon-prompts.md` has multiple level-one headings; the remaining mechanical scan found no heading-level jumps.

### Verification baseline

The untouched baseline completed successfully before this manifest was written:

| Command (from `app/`) | Result |
| --- | --- |
| `npm run claims` | Passed; wrote 32 claims to `src/generated/claims.ts` and produced no tracked diff. |
| `npm test -- --run` | Passed: 70 files, 770 tests. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed; only the existing dynamic-import and chunk-size warnings were emitted. |
| `npm --prefix server test` | Passed: 1 file, 24 tests. |
| `npm --prefix server run typecheck` | Passed. |

These are dated baseline results, not permanent counts. Later status documentation must rerun or date mutable totals.

### Material discrepancies and limits to preserve

1. **Hevy import is parser-only.** `parseHevyCsv()` is implemented and unit-tested, but no route, screen, file input, persistence adapter, navigation entry, or production caller exposes it. Requirements and old product prose must not call it a shipped import flow.
2. **Numbers-hidden coverage is incomplete.** Settings says calorie and bodyweight figures are hidden everywhere, but Hub and the bodyweight logging history do not read `numbersHidden` and still render weight values. Goal setup deliberately shows figures as an explained exception.
3. **Erasure is device-only after sync is enabled.** `deleteEverything()` hard-deletes local user data and recreates an unconsented local user. There is no server-erasure request or cross-device erasure propagation path.
4. **Offline writes are stronger than offline deep reloads.** Core logging survives offline and reload when the precached root shell is used, but a hard offline reload at a client route such as `/train` is not served; the e2e test deliberately navigates to `/` before reload.
5. **Several initial reads fail silently.** Review, online food search, and barcode scanning expose failures, while Hub, Train initial load, Weight history, Eat day load, Trends, Goal profile, Settings profile, and FoodPicker initial local-data reads lack a visible rejected-read state.
6. **Warm-ups currently count toward weekly volume.** `weeklySetsByMuscle()` excludes deleted and out-of-window sets but does not inspect `setType`, despite the schema comment saying warm-ups are excluded. No test asserts warm-up exclusion.
7. **Barcode camera status in old prose is contradictory.** `BarcodeScanner.tsx` is wired into `FoodPicker.tsx` and covered by unit tests; `docs/PROJECT-STATE.md` both describes it as wired and later lists it as absent.
8. **Claim structure is validated; literature review is not complete.** The ledger is not runtime input and the inspected records remain `pending-M6-review`, without direct-source locations or hostile-reviewer sign-off. DOI/schema tests do not prove literature truth.
9. **Sync lacks a deployed browser round trip.** Protocol, merge, queue, retry, Worker auth, LWW, server sequence, and tombstone behaviour are unit-tested, but no Playwright test exercises a real browser-to-deployed-Worker/D1 multi-device exchange.
10. **Fallback durability has a narrower proof.** The fallback e2e covers explicit flush and a 500 ms wait, not real tab-close timing. Its “~250ms” debounce comment is stale; source sets the coalescing delay to 0 ms.
11. **Active documentation and enforcement comments carry historical state.** `PRODUCT.md` contains zero-claim and roughly-50-claim language; `docs/PROJECT-STATE.md` names `m6`, mixes current and historical verification, and contradicts itself; comments in `consent-enforcement.test.ts` and `guards-enforcement.test.ts` still call live enforcement dormant.
12. **Feature-complete is too coarse.** Training, nutrition, advice, reconciliation, and optional sync have substantial implemented and tested flows, but the parser-only importer, device-only erasure, offline deep-route limitation, missing deployed sync e2e, pending claim review, and incomplete error states require explicit `implemented`, `implemented but not user-wired`, `partial`, `planned`, or `out of scope` labels.

## Task 2 checkpoint rules

Before the first edit to any canonical target:

1. Copy each unconditional target byte-for-byte to the archived path above.
2. Copy a conditional target only when that original will be edited.
3. Add the original and archived SHA-256 values to this manifest and confirm they match.
4. Do not change the copied snapshot after the archive checkpoint; only manifest corrections are allowed.
5. Keep `docs/handoffs/` and the pre-existing historical archive out of the commit.

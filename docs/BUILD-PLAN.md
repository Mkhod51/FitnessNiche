# Master Build Plan — MyoStat (Evidence-Graded Lifting & Nutrition PWA)

> **For agentic workers:** This is the top-level plan. Before coding each milestone, the orchestrator MUST expand it into a detailed task plan using `superpowers:writing-plans`, then execute via `superpowers:subagent-driven-development` (fresh Sonnet subagent per task, review between tasks). Milestone tasks below use checkbox syntax for tracking.

**Goal:** Ship the v1 defined in [REQUIREMENTS.md](REQUIREMENTS.md) — an offline-first PWA combining lift + nutrition tracking with a structurally-honest, citation-graded advice engine — in ~12 weeks of solo build via Claude Code.

**Architecture:** Local-first React PWA. All user data lives in SQLite (WASM, OPFS) on-device; a thin sync layer (append-log push/pull, LWW) replicates to a Cloudflare Worker + D1 backend. The advice engine is a deterministic predicate evaluator over a versioned, hand-curated claim base bundled as data — no LLM anywhere in the runtime (GR-6). UI renders claim · grade · citation from the claim record only (T1).

**Tech stack (locked — deviations go in the decision log with a reason):**

| Layer | Choice | Why |
|---|---|---|
| Build/app | Vite + React 18 + TypeScript `strict` | Boring, fast, Claude Code fluent |
| PWA | `vite-plugin-pwa` (Workbox) | App-shell precache + manifest, one plugin |
| Local DB | `@sqlite.org/sqlite-wasm` with OPFS VFS (IndexedDB VFS fallback) | Real relational store for DM-*; OPFS is the durable path, fallback covers older Safari |
| Schema/migrations | `drizzle-orm` + `drizzle-kit` | Typed schema, generated migrations, works over wasm driver |
| State | `zustand` | Minimal; local-first means no server-cache library |
| Routing | `react-router` v7 | Boring, fine |
| Styling | Tailwind CSS v4 | Speed; design pass uses the frontend-design/dataviz skills |
| Charts | `recharts` (custom SVG only if a band/annotation need exceeds it) | Trend lines + confidence bands via stacked Area |
| Search (claims) | `minisearch` | S2 question surface at 50-claim scale; no embeddings infra |
| Predicates | `json-logic-js` + Zod-validated rule shapes | Auditable data-as-logic for FR-ADV-2; no custom DSL to invent |
| Barcode | `@zxing/browser` | Camera barcode scan in PWA |
| Tests | Vitest + React Testing Library; Playwright (incl. offline emulation) | AC-1 needs a real offline E2E |
| Sync backend | Cloudflare Worker (Hono) + D1, single-user bearer token | Cheapest real sync target for NFR-2/AC-1 |
| CI | GitHub Actions: typecheck → vitest → build → playwright | Green main, always |

## Global constraints (every task inherits these — verbatim from REQUIREMENTS.md)

- **T1/GR-6:** no code path may display advice without a stored `claim_id`; citations/grades render from the claim record only. No LLM in the trust path (NG1).
- **GR-1 (in code, not copy):** calorie floor ≈1400F/1800M defaults, no sub-1200-net override; deficit cap ≤500 kcal/day; maintenance default; numbers-hidden mode first-class; no streaks/leaderboards/rapid-loss targets/eat-back-to-zero.
- **GR-2:** wellness framing only; no disease detection/screening; signpost Beat/NHS in settings.
- **GR-3:** figures re-plotted from extracted numbers; never embed publisher figure images; no bulk ingestion of proprietary tables.
- **GR-4:** no individualized MEV/MRV; no phone-camera velocity autoregulation; deloads never dressed as evidence-backed.
- **FR-SIG-1:** e1RM = regression over many points; only sets with RIR ≤ 3 and reps ≤ 10 qualify; always shown with a confidence band; noise-floor honesty (FR-SIG-2).
- **FR-LOG-3:** approximate logging is the default path; gram precision optional depth.
- **NFR-1/2:** offline-first, append-log + LWW sync, **no CRDTs/OT**.
- **NFR-4/GR-5:** explicit separate health-data consent before logging; export + delete; on-device by default.
- Evidence grading per [00-meta/evidence-standards.md](00-meta/evidence-standards.md); claim curation quality per FR-CLAIM-5.

## Commit discipline (standing convention, applies to every subagent)

- Commit at every green test cycle / completed step — target several commits per task, dozens per milestone. Small diffs.
- **Human-sounding messages, no AI attribution footers.** Natural imperative style, e.g. `get the sqlite wasm layer booting under opfs`, `e1rm regression now ignores junk high-rep sets`, `wire the grade chip into advice cards`. Never `feat(scope): ...` boilerplate spam, never "Generated with Claude".
- Main stays green: typecheck + unit tests pass before every commit; push at least at each task boundary.

## Model routing (token discipline)

| Work | Model |
|---|---|
| Orchestration, milestone plan-writing, architecture calls, code review of safety-critical code (GR-1 floors, GR-6 provenance, sync correctness, e1RM stats), **claim curation & grading (research + citations)** | **Opus (main session)** |
| Component implementation from a written task spec, test authoring, ETL scripts, Playwright specs, styling/polish, CSV parsers, migrations, refactors | **Sonnet subagents** (fresh one per task, `superpowers:subagent-driven-development`) |

Curation note: the running app never calls scholarly APIs (FR-CLAIM-3). Opus curates claims at build time using OpenAlex/Europe PMC/CrossRef + WebSearch, extracts figures, grades per the rubric, and writes YAML claim files. Sonnet may fetch/format; **grading judgment stays with Opus.**

---

## Repo layout

Code lives in the existing git repo (`FitnessNiche/`), sibling to the research:

```
FitnessNiche/
├── docs/                       # research corpus + build docs (read-only reference; never edit archive/)
│   ├── REQUIREMENTS.md, BUILD-PLAN.md, PROJECT-STATE.md, decision-log.md, etc. — build-facing
│   ├── 00-meta/ 01-research/ 03-thesis-review/ 04-sources/ archive/ — the research corpus proper
│   ├── ios-gate.md                # human platform-gate procedure (M0)
│   └── superpowers/plans/         # milestone task plans (subagent-driven-development)
└── app/
    ├── CLAUDE.md                  # tenets, guardrails, commit rules for every session
    ├── package.json  vite.config.ts  tsconfig.json  tailwind.config.ts
    ├── public/                    # manifest icons etc.
    ├── claims/                    # THE CLAIM BASE — one YAML per claim, e.g. c-volume-dose-response.yaml
    │   └── schema.md              # authored format doc
    ├── scripts/
    │   ├── build-claims.ts        # YAML → validated JSON bundle (Zod), fails build on schema violation
    │   └── food-etl/              # OFF UK dump filter, CoFID ingest, FDC fallback → seed sqlite
    ├── src/
    │   ├── db/                    # drizzle schema.ts, migrations/, client.ts (wasm+OPFS boot)
    │   ├── domain/
    │   │   ├── e1rm.ts            # pure: set → e1rm, series → trend + band
    │   │   ├── volume.ts          # fractional per-muscle weekly sets
    │   │   ├── trends.ts          # EWMA weight/intake smoothing
    │   │   ├── reconcile.ts       # verdict matrix (FR-SIG-5)
    │   │   └── guards.ts          # GR-1 floor/cap enforcement (single choke point)
    │   ├── advice/
    │   │   ├── types.ts           # Claim, Citation, AdviceItem, UserStateSnapshot
    │   │   ├── engine.ts          # evaluateClaims(snapshot, claims) → AdviceItem[]
    │   │   ├── language.ts        # grade → calibrated verb map (FR-ADV-5)
    │   │   └── search.ts          # minisearch question surface (FR-ADV-3)
    │   ├── sync/                  # append-log queue, push/pull, LWW merge
    │   ├── features/              # UI by feature: log-workout/, log-food/, trends/, advice/, onboarding/, settings/
    │   ├── components/            # shared: GradeChip, ClaimCard, EvidencePanel, TrendChart
    │   └── app.tsx  routes.tsx  sw registration
    ├── server/                    # Cloudflare Worker (Hono) + D1 schema — sync target only
    └── e2e/                       # Playwright, incl. offline scenarios
```

## Interfaces pinned now (type-consistency contract for all milestones)

Fields that aren't always known (`n`, `effectSize`, `ci`, `quote`, `clusterId`,
`supersededBy`) are required-but-nullable (e.g. `string | null`), not optional
(`string?`) — an explicit `null` forces the claim author to decide rather than forget a
field, and YAML/JSON have no notion of an absent key that survives a round trip cleanly.

```ts
// src/advice/types.ts
type Grade = 'A' | 'B' | 'C' | 'D';
type Population = 'trained' | 'untrained' | 'mixed';
interface Figure { label: string; value: number; unit?: string; }
interface Citation { id: string; claimId: string; doi: string; authors: string; year: number;
  journal: string; n: number | null; population: Population;
  effectSize: string | null; ci: string | null; figures: Figure[];
  quote: string | null; }
interface Claim { id: string; statement: string; grade: Grade; status: 'settled'|'contested';
  domain: string; predicates: JsonLogicRule | null;        // null = only surfaced via search
  clusterId: string | null;                                 // contested claims share a cluster
  phrasingKey: string; supersededBy: string | null; lastReviewed: string; citations: Citation[]; }
interface UserStateSnapshot { goal: 'cut'|'bulk'|'maintain'; deficitWeeks: number;
  weightTrend: 'down_fast'|'down'|'flat'|'up'|'unknown';
  e1rmTrend: 'up'|'holding'|'down'|'insufficient_data';
  weeklySetsByMuscle: Record<string, number>; proteinPerKg7d: number | null;
  numbersHidden: boolean; }
interface AdviceItem { claimId: string; trigger: 'rule'|'query'|'data-earned';
  headline: string;        // calibrated-language rendering, grade-derived
  snapshot: UserStateSnapshot; }

// src/advice/engine.ts
function evaluateClaims(snapshot: UserStateSnapshot, claims: Claim[]): AdviceItem[];

// src/domain/e1rm.ts   (Epley on effective reps = reps + RIR; qualifying sets only)
function setE1rm(weightKg: number, reps: number, rir: number): number | null;  // null if reps>10 || rir>3
function e1rmTrend(points: {date: string; e1rm: number}[]): { slopePctPerWeek: number;
  ci95: [number, number]; withinNoise: boolean; band: {date: string; lo: number; hi: number}[] } | 'insufficient_data';

// src/domain/reconcile.ts
function reconcile(weight: WeightTrendInput, lifts: E1rmTrendInput, goal: Goal):
  { verdict: 'on_track'|'deficit_too_aggressive'|'programming_not_food'|'bulk_on_track'|'insufficient_data';
    confidence: 'low'|'moderate'|'high'; claimIds: string[] };   // claimIds → data-earned advice

// src/domain/guards.ts  — the ONLY place targets are set/changed
function clampCalorieTarget(user: UserProfile, requested: number): { value: number; clamped: boolean };
```

Claim YAML mirrors `Claim` 1:1; `scripts/build-claims.ts` is the schema gate (a malformed or grade-less claim fails the build — T1 enforced at compile time).

---

## Milestones

Each milestone: orchestrator writes the detailed TDD task plan (writing-plans), executes with Sonnet subagents, runs `verification-before-completion` against the listed checks, updates `PROJECT-STATE.md`, pushes.

### M0 — Skeleton that proves the platform (week 1)
- [ ] Scaffold Vite+TS+React+Tailwind in `app/`; CI workflow; `CLAUDE.md` (tenets T1–T6, GR table, commit rules, model routing — condensed from REQUIREMENTS)
- [ ] SQLite WASM + OPFS boot with graceful IndexedDB fallback; drizzle schema v1 (DM-USER, DM-EXERCISE, DM-WORKOUT/SET, DM-WEIGHT, DM-SYNCMETA) + migration runner
- [ ] PWA shell: manifest, install prompt, Workbox precache; **airplane-mode reload works**
- [ ] Seed exercise table (open exercise list with muscle mappings, license-checked)
- **Checks:** app installs to home screen; kill network → reload → app boots and reads/writes SQLite. (Foundations of AC-1.)
- **Platform gate (TA-1):** verify OPFS persistence on a real iPhone Safari now, not in week 10 — if storage proves unreliable, log the decision and pivot shell to Expo per the REQUIREMENTS revisit trigger while `src/domain` + `src/advice` carry over unchanged.

### M1 — The A+C interaction on real claims (weeks 2–4) ← the risk-retiring milestone
- [ ] Claim schema (Zod) + `build-claims.ts` + `claims/schema.md`
- [ ] **Opus curates 15–20 claims end-to-end** (volume, frequency, protein dose, protein timing [contested exemplar], failure proximity, bulk rate, deloads, rest intervals) — DOIs, extracted figures, grades, predicates, calibrated phrasing
- [ ] `language.ts` grade→verb map with exhaustive-union test (a [C] literally cannot render "proven")
- [ ] `engine.ts` predicate evaluation + unit tests per trigger
- [ ] UI: `GradeChip`, `ClaimCard` (decisive default + chip), `EvidencePanel` (tap-1 "why", tap-2 re-plotted figures with n + population first-class), contested cluster rendering both sides
- [ ] Advice feed page + minisearch "ask the evidence" surface
- **Checks:** AC-3 (static claims), AC-4/T1 (grep-proof + test: no render path without claimId), AC-6 partially (≥15 claims). **Gate: does the interaction feel decisive AND honest? User reviews before M2.**

### M2 — Training loop + honest signals (weeks 5–6)
- [ ] Workout logging UI (fast set entry, rest-friendly, offline)
- [ ] `e1rm.ts` (+ property tests: high-rep/high-RIR sets excluded; band widens with fewer points), `volume.ts` fractional counting, trend charts with bands; `withinNoise` renders as honest copy, not a line (FR-SIG-2)
- [ ] Hevy CSV import (fixture-driven; resolve OQ-2 — if RIR column absent, imported sets get `rir: null` and e1RM uses qualifying native sets only)
- [ ] Weight logging + EWMA trend
- **Checks:** AC-2; volume vs population range (never personal MEV/MRV — GR-4).

### M3 — Nutrition loop (weeks 7–8)
- [ ] Food ETL scripts → bundled starter DB (OFF UK-filtered + CoFID + FDC fallback, ODbL/OGL attribution page)
- [ ] Food logging: quick-add, portion tiers, recents as the default path; grams optional; @zxing barcode
- [ ] Onboarding + goal setup: maintenance default, consent flow (GR-5), **`guards.ts` floors/caps with adversarial tests** (every path that sets a target goes through the choke point), numbers-hidden mode
- **Checks:** AC-5; FR-LOG-3 defaults; consent precedes first log.

### M4 — The differentiator closes the loop (weeks 9–10)
- [ ] `reconcile.ts` verdict matrix + confidence, multi-week windows (FR-SIG-5)
- [ ] Data-earned advice: snapshot builder wires reconcile outputs into `evaluateClaims`; advice cards state *why now* ("your e1RM held through 6 weeks of deficit — consistent with [A/B]…")
- [ ] Weekly review screen (verdict + volume + protein-per-kg vs target on training days)
- **Checks:** AC-3 fully (advice triggered by user's own logged state); OQ-4 review — does the verdict read as more than two overlaid charts? User gate.

### M5 — Sync + data rights (week 11)
- [ ] Worker (Hono) + D1: push/pull endpoints, bearer token, per-record `updated_at` LWW; client sync queue draining on reconnect
- [ ] Export (JSON/CSV) + delete-account; privacy notice; signposting links (GR-1/GR-5)
- **Checks:** AC-1 end-to-end (airplane-mode Playwright: log offline → reconnect → verify server state); no health data in URLs.

### M6 — Full claim base + hardening + demo (week 12 + buffer)
- [ ] Opus completes curation to ~50 claims (AC-6); steelman pass on contested clusters; calibrated-language sweep
- [ ] Guardrail audit: scripted checks + manual review against GR-1…GR-6; `last_reviewed` dates + review-queue doc
- [ ] Playwright suite green (offline, guards, provenance); Lighthouse PWA pass; demo script (A+C interaction + one data-earned moment)
- **Checks:** all AC-1…AC-6; README for the app; PROJECT-STATE final update.

**Cut lines if time runs short (in order):** barcode scanning → question surface (S2) → sync goes manual-export-only (renegotiates AC-1; log the decision). The A+C interaction, guards, provenance, and reconciliation are never cut — they are the product.

## Risks the plan actively manages
- **iOS storage (OQ-3):** M0 platform gate, tested on-device in week 1, with a named pivot path.
- **Demand risk (OQ-1):** M1 user gate exists to feel this early; the milestone order front-loads it.
- **Curation stall (the long pole):** claims are curated in two tranches (M1: 20, M6: 50) so the engine never waits on the full corpus.
- **Scope creep:** NG-1…NG-5 are hard fences; anything new goes to the decision log, not the sprint.

## Self-review (done)
Spec coverage: every FR/NFR/GR/AC in REQUIREMENTS.md maps to a milestone above (FR-LOG→M2/M3, FR-SIG→M2/M4, FR-ADV→M1/M4, FR-CLAIM→M1/M6, FR-ONB→M3, NFR-1/2→M0/M5, NFR-4→M3/M5, guards→M3/M6). Types referenced across milestones are pinned in one place (§Interfaces). No TBDs; detailed per-step code is deliberately delegated to milestone-time task plans per the scope check.

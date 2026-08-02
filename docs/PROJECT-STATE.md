# Project State

**Updated:** 2026-07-31 · **Phase:** Build · **Branch:** `main` — M0–M5 and
FR-LOG-6 food database are feature-complete at `a380c9a`.
`main`, `OpenSourceMod`, `origin/main`, and `origin/OpenSourceMod` all contain this commit in
the current workspace. Older notes saying this work is unmerged from `OpenSourceMod` are stale.

---

## ▶ START HERE (new session)

1. **Read [`agent-handoff/README.md`](agent-handoff/README.md).**
   This is the fresh handoff packet for the next agent, including ranked remaining work and
   a paste-ready kickoff prompt.
2. **Read [`superpowers/plans/2026-07-27-trackers-redesign.md`](superpowers/plans/2026-07-27-trackers-redesign.md).**
   Six consulted design gates for the health-hub trackers, the schema plan, and the build
   order. It supersedes the unfinished tail of the M2 plan.
3. **Read [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md)** — five questions awaiting the developer,
   each with the default that was taken so work could continue.
4. **Verify state before trusting any document, including this one.** Documents here have gone
   stale mid-flight more than once:
   ```bash
   cd app && ls src/domain src/features && npm run typecheck && npm test -- --run
   ```

**Verified 2026-07-31 (handoff):** typecheck clean · **639 unit tests / 61 files** ·
production build OK · full Playwright e2e **23/23** after clearing a stale preview on `:4173`.

**Gates closed 2026-07-30 (developer verdict: yes on both):** the M1 A+C interaction is
decisive-and-honest enough to ship, and the M4 reconciliation verdict earns its keep beyond
two overlaid charts. OQ-4 is resolved. **M5 (sync + data rights) and FR-LOG-6 food database
are feature-complete on current `main`.** Next on the agenda: M6 curation expansion and
hardening, plus the named food/sync follow-ups below.

## What exists now

**Training.** Explicit session start/finish (`workouts.name`, `finished_at`), the Hevy-idiom
set table with queued rows, optional-but-visible RIR, warm-ups excluded from volume and e1RM,
the exercise picker sheet, session summary, and repeat-a-previous-session carrying its sets.

**Nutrition.** `domain/guards.ts` (GR-1 floors and the deficit cap, with a dormant enforcement
test), migration `0003`, the Eat day view with FoodPicker, quick-add fallback, recents/common
foods, submitted Open Food Facts keyword search, barcode lookup, CoFID common-food seed, goal
setup with the Mifflin–St Jeor estimate and its error band, and numbers-hidden as a real state.

**Advice.** `peekStatement` on every claim with guards against overstating it, one-per-session
selection with a 7-day cooldown, and the peek wired to real logged data.

**Reconciliation (M4).** `reconcile.ts` reads the weight trend against the e1RM trend and
returns a verdict *plus* the list of signals it could not resolve; `advice/snapshot.ts` feeds
that into the claim engine, so `deficitWeeks`/`weightTrend`/`e1rmTrend` are real instead of the
placeholders the session peek used to hand-fill. Weekly review screen at `/review`.

**Sync (M5).** Append-log push/pull to a Cloudflare Worker + D1, last-write-wins on
`updated_at`, queue fed from every write, token + Worker URL runtime-configurable in Settings.
See the M5 section for the two gaps it ships with.

**Also.** Three-tab shell with animated pane transitions, dark ground, Trends (bodyweight,
e1RM with FR-SIG-2 noise honesty, volume vs the population range), Settings with GR-5 export
and erasure plus the GR-1 Beat/NHS signpost, and the Hevy CSV parser.

## M4 — the differentiator closes the loop (2026-07-29)

**Partially delivered on `main`.** `domain/reconcile.ts` (FR-SIG-5), the snapshot builder that
makes advice data-earned (FR-ADV-4/AC-3), migration `0004_goal_clock`, and the weekly review
screen at `/review`.

**Verified 2026-07-29:** typecheck clean · **511 unit tests / 48 files** · build OK · **e2e 21/21**.

Two things worth knowing about how it was scoped:

- **No rate-of-loss threshold exists in the engine, deliberately.** GR-4 forbids invented
  precision and no such boundary is evidenced anywhere in this repo, so `down_fast` is never
  emitted and a strength trend is only called falling when its own 95% interval excludes zero.
  The only cutoffs are data-sufficiency ones. If a rate threshold is ever wanted it needs a
  curated claim first, not a constant.
- **OQ-4 has a candidate answer, not a verdict.** What distinguishes the screen from two
  overlaid charts is the *refusal*: it names the half it cannot read and holds the verdict back
  rather than guessing. That is a design claim that still needs the developer's eye on it — the
  gate is not self-certifying.

**M4 is now feature-complete.** `proteinPerKg7d` reads from food logged on training days
(`domain/protein.ts`) — the "on training days" qualifier is load-bearing, since rest-day intake is
a different question. Sets per muscle render against the studied 10-20 range via the shared
`components/Meter`, with marks past the range faint rather than red. The review screen carries the
same motion system as the rest of the app.

**What M4 does NOT close:** the OQ-4 gate itself. The screen is built and the refusal behaviour is
real, but whether the verdict earns its keep is the developer's call, not a passing test.

## M5 — sync + data rights (2026-07-30)

**Feature-complete on current `main`.** A Cloudflare Worker (Hono) + D1
endpoint takes a single `POST` push/pull: bearer-token auth (`timingSafeEqual` against
`SYNC_TOKEN`), a validated `PushPullRequest`, and `applySync` settling every row by `updated_at`
last-write-wins (no CRDT — NFR-2). The client (`src/sync/`) keeps an append-log queue fed from
every write (`markPending`), merges incoming with `incomingWins`, and drains on reconnect. The
token and Worker URL are runtime-configurable in Settings and live in `localStorage`, never in
the replicated DB — the server's own credential doesn't cross the wire.

**Data rights (GR-5).** Settings exports everything (JSON, the portability obligation) and the
training log (CSV, sets only), erases the device (`deleteEverything` — `--flag` text, never a
filled red button), shows an honest privacy notice, and signposts Beat/NHS (GR-1). No health
data is in a URL or query string — sync is a POST body (NFR-4).

**Verified 2026-07-30:** typecheck clean · **579 unit tests / 54 files**, of which M5's own 63
(sync, protocol, server `applySync`, queue marking, `Settings.sync`) pass with **zero** unhandled
errors · build OK · **e2e 21/21**. AC-1's offline halves are e2e-proven (`log-offline.spec.ts`
logs a set with the network cut and reads it back from sqlite three ways after a reload); "data
syncs on reconnect" is proven at the **contract** level (`server/src/index.test.ts` settles a real
push/pull against a fake D1), not by a browser → Worker Playwright run.

Two things M5 does **not** close, both disclosed in the UI rather than hidden:

- **Server-side erasure is not wired.** "Delete all my data" erases this device only; the privacy
  notice says so plainly (T6). A full delete-account needs a Worker erasure endpoint.
- **No Playwright round-trip against a real Worker/D1.** The e2e harness builds + previews the
  client only (`playwright.config.ts`); standing the Worker up in e2e (Miniflare + D1 + token) is
  the remaining verification, recorded rather than faked. Same discipline M4's OQ-4 used: the
  in-process contract is tested; the real-world round-trip is a named, open check, not a
  self-certified one.

**Operational notes (not M5 defects):**

- If e2e ever reports `window.__db` undefined, a stale `vite preview` is lingering on :4173 and
  Playwright's `reuseExistingServer: !CI` is reusing it instead of rebuilding — kill it and re-run.
  The hatch itself is correct.
- The old unit-test isolation issue that emitted 43 unhandled DB/mock errors from
  `LogWorkout.test.tsx` and `App.test.tsx` is fixed on this branch.

## Food database (FR-LOG-6) — feature-complete on current `main` (2026-07-31)

FR-LOG-6 is feature-complete on current `main`: FoodPicker opens from each meal on the Eat day,
loads recents and a curated CoFID common-food seed, filters local foods while typing, searches
Open Food Facts automatically as search text changes, routes 8-14 digit barcode submissions and
camera scans through OFF product lookup, caches selected OFF items into `food_items`, and logs grams-first quantities into
`food_log_entries`. The picker keeps source labels visible (`CoFID` / `OFF`), drops OFF rows
missing energy or protein rather than zero-filling them, and keeps quick-add as the offline
fallback.

**Verified 2026-07-31:** focused food/provider/privacy tests passed, focused food
Playwright spec **2/2** passed during the food-picker polish pass. See the handoff snapshot
above for the current full baseline.

Honest gaps:

- **Seed size is 38 rows, not 150-200.** The first CoFID seed is deliberately small because every
  macro was audited against CoFID 2021. Expanding the seed is an M6 curation task, not a reason
  to invent values.
- **Cross-device recents are not synced.** `food_log_entries` sync, but `food_items` remain local
  reference/cache data, so selected OFF cache rows and recents are device-local in v1.
- **OFF keyword search is proxied through `/api/food/search`.** Vite dev/preview and the Cloudflare
  Worker both forward POST requests to Search-a-licious so the browser does not depend on
  cross-origin search CORS. Static production deployments must build with `VITE_FOOD_SEARCH_URL`
  pointed at the Worker unless app and Worker share an origin. Barcode lookup still calls the OFF
  product endpoint directly.

## What does not exist

**Food data beyond v1** — CoFID expansion toward the original larger seed target, USDA FDC
fallback integration, Worker-side OFF proxy/self-hosting, and barcode camera scanning are not
built yet · the predicate-focused curation tranche that would make the advice peek fire more
than rarely.

**Sync (M5) shipped with two honest gaps** (detailed in the M5 section):
server-side erasure is not wired — "Delete all my data" is device-only and says so — and the
browser → Worker round-trip is proven at the contract level, not by a Playwright run against a
real D1 (the e2e harness serves the client only).

**No food data has been invented.** CoFID values in the seed are copied from the dataset; OFF
values are parsed as returned and incomplete rows are hidden rather than guessed.

## Recently answered

- **OQ-2 is closed.** Hevy's free CSV carries `rpe`, so RIR is recoverable as 10 − RPE, and
  imported history *can* feed the e1RM trend. See decision-log entry 32.
- **GR-1 was pressed and held.** The day view has no eat-back-to-zero counter; the calorie bar
  fills toward the target. The one spec change made was FR-LOG-3 (gram-first entry).

---

## Where this stands

Re-scoped per user direction: leaner (Sonnet workers + Opus-main synthesis, small batches after a session-limit interruption), focused on the **science-based lifting** niche. Two research streams landed cleanly; ideation, ranking and recommendation done.

**Recommendation: the Cut Reconciler (SBL-6 bounded frame over SBL-2 engine)** — a science-based, bounded-duration cut companion that reconciles weight/intake trend against training performance, refuses to fake precision, and is designed to be finished at maintenance. Full case archived in `archive/phase2-ideation/recommended-cut-reconciler.md` (the reconciliation engine is now a component of the chosen Phase 3 product).

**Premise resolved:** e1RM trend is *wounded, not killed* — usable only as a many-point regression from RIR≤3, ≤10-rep sets, with honesty about the noise floor for advanced lifters. See `00-meta/decision-log.md`.

## Open verification items before any build

- Do RP users actually also pay for MacroFactor? (the WTP-for-the-seam argument rests on this; currently inference)
- Does Hevy's free CSV export carry RIR, or only weight×reps? (affects imported-history quality)
- Does the reconciliation verdict earn its keep as more than two overlaid charts? (the core product risk)

## Parked (the original exhaustive plan, if ever wanted)

The seven-stream Wave 1 was abandoned in favour of the lean pivot. Salvaged before the interruption and still on disk: three nutrition-incumbent teardowns (`myfitnesspal`, `cronometer`, `macrofactor`) and Stream C1's behaviour-change raw notes. The full resume checklist remains in `00-meta/decision-log.md` for anyone wanting the exhaustive version later.


## Phase 3 — thesis under review

Stress-testing one specific idea rather than generating breadth: **a combined training+nutrition tracker whose differentiator is citation-grounded advice (naming the studies, showing figures on request) delivered with nuance rather than confident directives.** Treated as a hypothesis to test, not a spec. Outputs land in `03-thesis-review/`.

- [x] Housekeeping reorg + MIGRATION.md
- [x] Wave 1 — Streams A (landscape), B (literature), C (infrastructure), D (credibility, in-house)
- [x] Wave 2 — synthesis → `03-thesis-review/findings.md`
- [x] Wave 3 — grounded brainstorm → `03-thesis-review/feature-brainstorm.md`
- [x] Deliverable → `03-thesis-review/review.md`

**Phase 3 verdict:** the citation thesis holds only when reframed — *citations and nuance are one feature and its safety system.* The honest product is "grade the evidence (including the sacred cows [C]) with the citation as the receipt," because Stream B found the science-based-lifting evidence base is mostly small-n/untrained/thin. Market slot is empty (all citation-rich competitors are content, not in-app); solo-feasible if scoped to ~50 curated claims; biggest risk is demand-side (whether de-mythologising is a product people sustain using), not technical. Build the A+C interaction first.

## Idea chosen — moving toward build

The developer has committed to the citation-graded advice product. Repo restructured into a live/archive split (see `archive/build-history/MIGRATION.md`): all other ideas are in `archive/`; the live product knowledge base is `03-thesis-review/` plus the research it points to. Two build-facing docs added:
- `03-thesis-review/advice-strategies.md` — how advice is generated. **Load-bearing decision:** claim provenance is *structural* — advice is `claim_id`-bound, citations/grades app-rendered, no ungrounded text path. Deterministic engine (rules + retrieval + data-earned triggers) is the trust root; no LLM in the trust path for v1 (LLM fabricates citations 20–47% of the time — disqualifying here). LLM later only as a validated phrasing layer.
- `03-thesis-review/feasibility.md` — buildable as a portfolio v1 in 2–3 months; infrastructure is solved, the long pole is ~50 claims of human curation (~50–75 hrs) and the A+C interaction UX. Rough 12-week shape included.

**Next:** prove the A+C interaction on ~15–20 real claims in month one (the risk-retiring milestone); then the tracker + reconciliation engine; then curation to ~50 claims.

## Build phase ready

Planning is complete; the project hands off to a build session now:
- `REQUIREMENTS.md` — the spec (FR/NFR/GR/AC IDs are the shared vocabulary)
- `BUILD-PLAN.md` — master plan: locked stack (React+TS PWA, sqlite-wasm/OPFS, drizzle, json-logic predicates, CF Worker+D1 sync), repo layout under a new top-level `app/`, pinned interfaces, milestones M0–M6 with checks and cut lines
- `archive/build-history/KICKOFF-PROMPT.md` — paste into a fresh Claude Code session (Opus orchestrator, Sonnet implementers, frequent human-style commits, claim curation reserved to Opus, human gates at M0/M1/M4)

## M0 — status (2026-07-24)

Code-complete on branch `m0-skeleton`, **not merged to `main`**. Delivered and verified: Vite 8 / React 19 / TypeScript 6 (strict) / Tailwind v4 / Vitest 4 / Playwright scaffold in `app/`, CI at `.github/workflows/ci.yml`, standing rules in `app/CLAUDE.md`; SQLite compiled to WASM running in a Web Worker on the OPFS `opfs-sahpool` VFS, persistence proven across a hard reload in Chromium (reviewer fault-injected a `clearOnInit` flag to confirm the test wasn't a spurious pass); drizzle-orm over `sqlite-proxy` plus a hand-written transactional migration runner with an ordering/uniqueness guard; schema v1 (users, exercises, workouts, sets, weights, sync_meta); PWA installable with the ~1.5 MB sqlite `.wasm` confirmed in the Workbox precache manifest (14 entries, ~1580 KiB); 56 hand-authored exercises seeded, idempotent across reload; offline gate passed — boots, reads seeded data, and writes to SQLite with the network cut, served from the service-worker precache, with two independent fault injections (no service worker at all; wasm dropped from the precache glob) both making the test fail, so it isn't a spurious pass either. Final state: typecheck clean, 26/26 unit tests, build OK, 5/5 Playwright e2e. Full build ledger: `.superpowers/sdd/progress.md`.

Three decisions from this milestone are logged in `00-meta/decision-log.md` (#7–9): the stack resolving newer than planned (accepted, version currency only); the non-OPFS fallback shipping in-memory-only rather than the IndexedDB fallback BUILD-PLAN specified (a scoped, deliberate deviation that must close before M2 introduces user writes); and four review-caught defects that would each have caused silent data loss or a hang.

**TA-1 platform gate: PASSED (2026-07-25).** Run on a real iPhone over an HTTPS tunnel per `docs/ios-gate.md`; storage read `opfs-sahpool` on-device, surviving force-quit and airplane-mode relaunch. The riskiest assumption in the whole plan — that SQLite on OPFS actually persists in iOS Safari — is now measured rather than assumed, in week 1 rather than week 10. **No Expo/React Native pivot needed; the PWA shell stands.** Result table and a "before you conclude anything" checklist are in `docs/ios-gate.md`. Note for anyone re-running it: `exercise-count: 56` does *not* confirm persistence (memory-fallback re-seeds to 56 on every load) — `storage-mode` is the only field that distinguishes the two.

## M1 — the A+C interaction on real claims (2026-07-25/26)

Code-complete on branch `m1-advice-interaction`, **not merged**, **awaiting the human gate**. Full ledger: `.superpowers/sdd/progress.md`.

Delivered: a Zod-validated claim schema and a build pipeline that turns hand-written YAML into a typed, committed bundle and fails the build on a malformed claim; **17 curated claims across all eight BUILD-PLAN topics** (volume, frequency, protein dose, protein timing as the contested exemplar, failure proximity, energy balance, deloads, rest intervals) carrying 21 citations over 12 DOIs, every one independently resolved against CrossRef before it went in a file; a grade→language map whose exhaustiveness is enforced by the compiler, so a [C] claim cannot render "proven"; a deterministic json-logic predicate engine that pulls both sides of a contested cluster; the card, evidence-panel and figure components; a minisearch question surface; and provenance enforcement that is provable both by test and by a CI grep.

Final state: typecheck clean, **189 unit tests** across 19 files, build OK (precache 14 entries), **e2e 7/7**. Verified in a real browser at 375×812, not only in jsdom.

**Grades: A×4, B×11, C×2.** Deliberately not everything is [A]. The honest-absence figures are the point rather than a shortfall: sample size stated in 11 of 21 citations, a confidence interval in 5, and population recorded as `unstated` in 7 — most of this literature is paywalled, so extraction stopped at the abstract on a majority of papers and those fields are null. There are **no [D] claims**, because every citation needs a resolvable DOI and [D]-tier sources do not have one; the [D] rung is exercised by unit tests only. Worth a decision at M6.

Eight decisions logged in `00-meta/decision-log.md` (#10–17), including the visual world (`DESIGN.md`, established this milestone) and the whole-branch review blocking on a *claim record* rather than on code.

**The gate: does the interaction feel decisive AND honest?** M2 must not start before that verdict.

**Debt carried forward.** D6 (non-OPFS fallback is still in-memory-only) — now confirmed reachable in a real browser: a second tab genuinely falls back, and it must close before M2's first user write. D7's UI half is closed — `memory-fallback` now renders a red data-loss warning instead of a bare value — though the banner has no `role="alert"` yet. D8, D9, D10 unchanged and none blocking. D11 (new): 8 high-severity `npm audit` advisories via `vite-plugin-pwa → workbox-build → brace-expansion`, build tooling only, not shipped runtime.

Open review findings deliberately not fixed before the gate, all recorded in the ledger: the render-level provenance walk starts from tagged statements so it cannot catch untagged advice prose (the invariant holds by construction today); the source scan misses paraphrases and does not cover `src/App.tsx`; the CI dist grep is close to vacuous because every chunk carrying grade language also carries `claimId`; and the evidence panel's 12–14px body text sits below the ≥16px floor `DESIGN.md` sets for itself.

## Constraints in force (non-negotiable)

Inherited from Phase 1 Stream D, which holds veto power: hard calorie floor and ≤500 kcal/day deficit cap enforced in code · maintenance default · numbers-hidden mode as a first-class state · no restriction gamification, streaks, or weight leaderboards · no disease detection, management, or in-app screening (medical-device line) · health data is special-category under UK GDPR, keep on-device where possible · offline-first is a hard requirement.

# Project State

**Updated:** 2026-07-24 · **Phase:** 3 (Thesis Review) begun, on top of completed Phase 2 (Deep Ideation, science-based-lifting pivot) · **Stage:** Phase 2 recommendation reached; Phase 3 housekeeping done, tree is clean — see `MIGRATION.md`

**Structure note:** `04-sources/` (renamed from the prior sources dir to clear the numbering for `03-thesis-review/`), `archive/phase1-ideation/` (consolidated Phase 1 ideation archive), `03-thesis-review/` (new, empty, Phase 3 output). Full detail in `MIGRATION.md`.

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

The developer has committed to the citation-graded advice product. Repo restructured into a live/archive split (see `MIGRATION.md`): all other ideas are in `archive/`; the live product knowledge base is `03-thesis-review/` plus the research it points to. Two build-facing docs added:
- `03-thesis-review/advice-strategies.md` — how advice is generated. **Load-bearing decision:** claim provenance is *structural* — advice is `claim_id`-bound, citations/grades app-rendered, no ungrounded text path. Deterministic engine (rules + retrieval + data-earned triggers) is the trust root; no LLM in the trust path for v1 (LLM fabricates citations 20–47% of the time — disqualifying here). LLM later only as a validated phrasing layer.
- `03-thesis-review/feasibility.md` — buildable as a portfolio v1 in 2–3 months; infrastructure is solved, the long pole is ~50 claims of human curation (~50–75 hrs) and the A+C interaction UX. Rough 12-week shape included.

**Next:** prove the A+C interaction on ~15–20 real claims in month one (the risk-retiring milestone); then the tracker + reconciliation engine; then curation to ~50 claims.

## Build phase ready

Planning is complete; the project hands off to a build session now:
- `REQUIREMENTS.md` — the spec (FR/NFR/GR/AC IDs are the shared vocabulary)
- `BUILD-PLAN.md` — master plan: locked stack (React+TS PWA, sqlite-wasm/OPFS, drizzle, json-logic predicates, CF Worker+D1 sync), repo layout under a new top-level `app/`, pinned interfaces, milestones M0–M6 with checks and cut lines
- `KICKOFF-PROMPT.md` — paste into a fresh Claude Code session (Opus orchestrator, Sonnet implementers, frequent human-style commits, claim curation reserved to Opus, human gates at M0/M1/M4)

## Constraints in force (non-negotiable)

Inherited from Phase 1 Stream D, which holds veto power: hard calorie floor and ≤500 kcal/day deficit cap enforced in code · maintenance default · numbers-hidden mode as a first-class state · no restriction gamification, streaks, or weight leaderboards · no disease detection, management, or in-app screening (medical-device line) · health data is special-category under UK GDPR, keep on-device where possible · offline-first is a hard requirement.

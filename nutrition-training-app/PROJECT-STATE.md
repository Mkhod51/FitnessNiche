# Project State

**Updated:** 2026-07-24 · **Phase:** 3 (Thesis Review) begun, on top of completed Phase 2 (Deep Ideation, science-based-lifting pivot) · **Stage:** Phase 2 recommendation reached; Phase 3 housekeeping done, tree is clean — see `MIGRATION.md`

**Structure note:** `04-sources/` (renamed from the prior sources dir to clear the numbering for `03-thesis-review/`), `archive/phase1-ideation/` (consolidated Phase 1 ideation archive), `03-thesis-review/` (new, empty, Phase 3 output). Full detail in `MIGRATION.md`.

## Where this stands

Re-scoped per user direction: leaner (Sonnet workers + Opus-main synthesis, small batches after a session-limit interruption), focused on the **science-based lifting** niche. Two research streams landed cleanly; ideation, ranking and recommendation done.

**Recommendation: the Cut Reconciler (SBL-6 bounded frame over SBL-2 engine)** — a science-based, bounded-duration cut companion that reconciles weight/intake trend against training performance, refuses to fake precision, and is designed to be finished at maintenance. Full case in `02-ideation/recommended.md`.

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

## Constraints in force (non-negotiable)

Inherited from Phase 1 Stream D, which holds veto power: hard calorie floor and ≤500 kcal/day deficit cap enforced in code · maintenance default · numbers-hidden mode as a first-class state · no restriction gamification, streaks, or weight leaderboards · no disease detection, management, or in-app screening (medical-device line) · health data is special-category under UK GDPR, keep on-device where possible · offline-first is a hard requirement.

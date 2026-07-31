# Agent Handoff

**Updated:** 2026-07-31  
**Current baseline:** `main` at `a380c9a` (`polish food picker navigation`)  
**Branch state:** `main`, `OpenSourceMod`, `origin/main`, and `origin/OpenSourceMod` all contain the same current commit in this workspace. Do not trust older notes saying M5 or FR-LOG-6 are still unmerged from `OpenSourceMod`.

This folder is the fresh handoff packet for a new agent. Treat it as the quickest orientation layer, then verify the repo state yourself before changing code.

## Read First

1. `app/CLAUDE.md` — project guardrails and definition of done.
2. `docs/agent-handoff/REMAINING-WORK.md` — ranked work still left.
3. `docs/agent-handoff/NEXT-AGENT-PROMPT.md` — paste-ready kickoff prompt.
4. `docs/PROJECT-STATE.md` — broad historical state, recently corrected at the top but still older in places.
5. `docs/BUILD-PLAN.md` and `docs/REQUIREMENTS.md` — milestone and requirement IDs.
6. `docs/00-meta/food-data-provider-research.md` — provider decision for food search/barcodes.
7. `docs/superpowers/plans/2026-07-30-food-database.md` — food implementation plan and its known deviations.

## What Is Built

- Local-first React PWA under `app/`, backed by SQLite WASM/OPFS with migrations and tests.
- Training log, Hevy CSV import, weight logging, trends, e1RM/volume signal logic, and weekly review.
- Evidence-graded advice system with 17 authored YAML claims, deterministic predicates, provenance tests, and claim-bound UI.
- Nutrition day view with GR-1 calorie guards, goal setup, numbers-hidden mode, quick-add, and grams-first logging.
- Food picker with CoFID seed, recents/common foods, Open Food Facts keyword search on submit, manual barcode lookup, selected OFF item caching, source labels, and no zero-filled incomplete foods.
- Cloudflare Worker + D1 sync contract, append-log client sync queue, runtime sync settings, local export, and device-only erasure.

## Fresh Verification Snapshot

Freshly run during this handoff:

```bash
cd app
npm run typecheck
npm test -- --run --reporter=dot
npm run build
npm run e2e
```

Result: typecheck clean, 61 files passed, 639 tests passed, production build completed, and
full Playwright e2e passed 23/23 after clearing a stale preview on `:4173`.

Run the full baseline before implementation:

```bash
cd app
npm run typecheck
npm test -- --run
npm run build
npx playwright test e2e/food.spec.ts
```

Use full Playwright (`npm run e2e`) before claiming a milestone-level finish. If Playwright reuses a stale preview server and reports `window.__db` missing, kill the lingering `vite preview` process and rerun.

## Known Stale Notes

- Older `PROJECT-STATE.md` sections and food plans refer to `OpenSourceMod` as unmerged. Current git says that is stale.
- `BUILD-PLAN.md` still shows old unchecked milestone boxes; use it for target scope, not checkbox truth.
- `OPEN-QUESTIONS.md` still lists food-source and maintenance-calorie questions that are effectively resolved by the current food picker and goal flow. Q2 (`LogWeight` input polish) and Q3 (`exercises` table harden/delete/leave) remain useful.
- The tracker redesign plan is historical design context, not current implementation state.

## Working Rules For The Next Agent

- Verify before trusting docs. This repo has moved faster than its handoff notes.
- Keep product guardrails from `app/CLAUDE.md` intact: no ungrounded advice, no weakened GR-1 calorie floors/caps, no fabricated food or evidence precision, local-first writes, privacy by default.
- Use TDD for feature work and bug fixes.
- Use subagents for independent implementation/review tasks, but keep claim grading, guardrail changes, and sync correctness under the strongest model.
- Commit at green checkpoints with human-sounding messages and no AI attribution.

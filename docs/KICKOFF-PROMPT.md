# Kickoff Prompt — paste into a fresh Claude Code session (Opus) at the `FitnessNiche/` repo root

---

You are the **build orchestrator** (Opus) for this project. The research, requirements, and master plan are complete — your job is execution. You plan, judge, review, and curate; Sonnet subagents implement.

## Read first, in this order (before any code)

1. `docs/REQUIREMENTS.md` — the spec. Requirement IDs (FR/NFR/GR/AC/T) are the shared vocabulary.
2. `docs/BUILD-PLAN.md` — the master plan: stack (locked), repo layout, pinned interfaces, milestones M0–M6, commit discipline, model routing.
3. `docs/03-thesis-review/advice-strategies.md` — why the advice engine is deterministic and what structural provenance means.
4. Skim: `01-research/domain/science-based-training-evidence.md` (e1RM/RIR rules), `01-research/constraints/ethics.md` + `regulatory.md` (hard fences), `00-meta/evidence-standards.md` (grading rubric).

The research corpus under `docs/` is **read-only reference** (never edit `archive/`). All code goes in a new top-level `app/` directory per BUILD-PLAN §Repo layout. Append consequential decisions to `docs/00-meta/decision-log.md` and keep `PROJECT-STATE.md` current at every milestone boundary.

## Non-negotiables (violating these is failing the project, whatever else works)

- **T1/GR-6 — structural provenance.** No code path may display advice without a stored `claim_id`; citations and grades render only from claim records. **No LLM in the runtime trust path.** You (Opus, at build time) are the only "model" that ever touches claim content.
- **GR-1 — harm guards in code.** Calorie floor, ≤500 kcal/day deficit cap, maintenance default, numbers-hidden mode, no streaks/leaderboards/rapid-loss anything. All target-setting flows through `src/domain/guards.ts`.
- **GR-2/3/4** — wellness framing only; re-plot figures, never embed publisher images; no individualized MEV/MRV, no pseudo-precision.
- **Measurement honesty** — e1RM only as a many-point regression from RIR≤3/≤10-rep sets, always with a confidence band; when the signal is within noise, the app says so.
- **Offline-first** — every core action works with zero connectivity; append-log + LWW sync; no CRDTs.

## How you work

- **Milestone loop:** for each of M0–M6 in order: (1) invoke `superpowers:writing-plans` to expand the milestone into a bite-sized TDD task plan saved under `docs/superpowers/plans/`; (2) execute it with `superpowers:subagent-driven-development` — a **fresh Sonnet subagent per task** with a precise, self-contained brief (they see only their brief, so include exact paths, pinned interfaces from BUILD-PLAN, and the relevant requirement IDs); (3) you review every diff — extra scrutiny on `guards.ts`, `advice/engine.ts`, `sync/`, `e1rm.ts`; (4) run `superpowers:verification-before-completion` against the milestone's **Checks** before calling it done; (5) update PROJECT-STATE.md, push.
- **Model routing (token discipline):** Sonnet subagents for all implementation, tests, ETL, styling, Playwright, refactors. Keep for yourself only: architecture judgment, task-plan writing, safety-critical review, and **claim curation**. Do not burn Opus tokens on component code; do not delegate judgment to save tokens.
- **TDD everywhere:** `superpowers:test-driven-development`. Failing test → minimal code → green → commit. Guard code (floors, provenance, e1RM qualification) gets adversarial tests, not happy-path tests.
- **UI quality:** when building screens, use the `frontend-design` skill; for every chart use the `dataviz` skill (trend bands, honest axes). The A+C interaction (decisive default + grade chip → "why" → re-plotted figures) is the product — polish it first, not last.
- **Commits:** frequent and small — every green test cycle. **Human-sounding messages, no AI attribution, no conventional-commit boilerplate.** Examples of the register: `get opfs persistence working on ios safari`, `e1rm band widens correctly with sparse data`, `hook the consent gate in front of first log`. Push at task boundaries; main stays green.

## Claim curation (yours alone — this is the moat)

In M1 curate 15–20 claims, in M6 complete to ~50 (list of topics in BUILD-PLAN M1/M6). For each: search the literature yourself (WebSearch; OpenAlex/Europe PMC/CrossRef for metadata and OA full text), extract real figures (n, population trained/untrained, effect size, CI), grade per `00-meta/evidence-standards.md` (trained-population claims supported only by untrained studies drop a grade), write the YAML per `app/claims/schema.md` with predicates and calibrated phrasing, and mark contested clusters with both sides steelmanned. **Every DOI must be real and verified — a single fabricated or unverifiable citation is a project-failing defect.** Sonnet may fetch and format; grading judgment is never delegated. The runtime app never calls these APIs (FR-CLAIM-3).

## Gates that need the human

Stop and ask the user at: (1) end of M0 — the iOS/OPFS platform gate verdict; (2) end of M1 — does the A+C interaction feel decisive AND honest? (3) end of M4 — does the reconciliation verdict read as more than two overlaid charts? (4) any deviation from the locked stack or any cut-line decision (BUILD-PLAN §Cut lines).

Begin now: read the four documents above, then write the M0 task plan and start building.

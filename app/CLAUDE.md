# CLAUDE.md — MyoStat (Evidence-Graded Lifting & Nutrition PWA)

Standing context for every session in this repo. The spec is `../docs/REQUIREMENTS.md`; the plan is `../docs/BUILD-PLAN.md`. Requirement IDs (FR/NFR/GR/AC/T) are the shared vocabulary — cite them in commits and PR-style summaries.

`../docs/` holds the research corpus, build docs, and platform-gate procedure. The research corpus (`00-meta/`, `01-research/`, `03-thesis-review/`, `04-sources/`, `archive/`) is **read-only reference — never edit `archive/`**. Build-facing docs (`REQUIREMENTS.md`, `BUILD-PLAN.md`, `PROJECT-STATE.md`, `00-meta/decision-log.md`, `ios-gate.md`, `superpowers/plans/`) are updated as the build progresses — that's expected, not a violation of the read-only rule above.

## What this product is

A combined lift + nutrition tracker whose differentiator is **honest, evidence-graded, citation-backed advice**. Every recommendation carries a confidence grade ([A]–[D]) and a real citation, is contextualised to the user's own logged data, and shows nuance instead of confident directives. The product's value is that it *refuses to overstate*. Code that fakes precision is a defect even if it looks good.

## Non-negotiables (violating any of these fails the project)

1. **T1/GR-6 — structural provenance.** No code path may render advice without a stored `claim_id`. Citations and grades render **only** from claim records — never hand-written in a component, never produced by a model at runtime. **No LLM in the runtime trust path.** Claim content is authored at build time only.
2. **GR-1 — harm guards in code, not copy.** Calorie floor (default ≈1400 F / 1800 M; never below 1200 net), deficit cap ≤500 kcal/day, maintenance is the default goal, numbers-hidden mode is a first-class state. **No streaks, no leaderboards, no rapid-loss targets, no eat-back-to-zero framing — ever.** All target setting flows through `src/domain/guards.ts`; there is no second path.
3. **GR-2 — wellness framing only.** No disease detection, monitoring, management, or in-app screening (that crosses the medical-device line). Signpost Beat/NHS in settings; never diagnose.
4. **GR-3 — copyright.** Re-plot extracted numbers in our own charts. **Never embed a publisher's figure image.** Short attributed quotes only.
5. **GR-4 — no fabricated precision.** No individualized MEV/MRV (unidentifiable from logs). No phone-camera velocity autoregulation. Deload prompts are never dressed as evidence-backed.
6. **Measurement honesty.** e1RM is a **many-point regression**, never point-to-point; only sets with **RIR ≤ 3 and reps ≤ 10** qualify; always render a confidence band. When the signal is inside the noise floor, the UI says so rather than drawing a confident line.
7. **Offline-first (NFR-1/2).** Every core action works with zero connectivity and no write is ever lost. Sync is **append-log + last-write-wins on `updated_at`**. **No CRDTs, no OT** — wrong problem class, and an interviewer will see through it.
8. **NFR-4/GR-5 — privacy.** Health data is UK-GDPR special category: explicit separate consent before any logging, export + delete supported, on-device by default. No health data in URLs or query strings.

## Architecture in one breath

Local-first React PWA. SQLite (WASM) on-device is the source of truth; a thin sync layer replicates to a Cloudflare Worker + D1. The advice engine is a **deterministic predicate evaluator** over a hand-curated claim base bundled as versioned data. Pure domain logic lives in `src/domain/` and `src/advice/` and must stay framework-free and unit-testable.

Full layout, locked stack, and pinned type signatures: `../docs/BUILD-PLAN.md` (§Repo layout, §Interfaces). **Do not deviate from the locked stack** without logging a decision and asking the user.

## How we work

- **TDD.** Failing test → minimal code → green → commit. Guard code (floors, provenance, e1RM qualification, sync merge) gets **adversarial** tests, not happy-path tests.
- **Small, focused files.** One responsibility each. Split by responsibility, not by technical layer.
- **DRY, YAGNI.** Build what the current milestone needs. Speculative abstraction is waste.
- **Charts** use the `dataviz` skill; **screens** use the `frontend-design` skill. Confidence bands and honest axes are mandatory, not decorative.
- **Main stays green:** typecheck + unit tests pass before every commit.

## Commits

Frequent and small — commit at every green test cycle, not at the end of a task.

**Human-sounding messages. No AI attribution footers. No conventional-commit prefixes.** Write like a developer talking to their future self:

```
get opfs persistence surviving a hard reload
e1rm band widens correctly when data is sparse
hook the consent gate in front of the first log
stop high-rep sets leaking into the e1rm regression
```

Not: `feat(db): implement OPFS persistence layer` · not `🤖 Generated with Claude Code`.

## Definition of done for any task

Tests pass · typecheck clean · the relevant requirement ID is satisfied · offline still works · no guardrail weakened · committed with a human message.

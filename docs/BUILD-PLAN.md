# Current build plan

The original milestone plan is complete as a historical build record, not an
accurate checklist. Its pre-overhaul form is preserved at
[archive/documentation-pre-overhaul-2026-09-19/BUILD-PLAN.md](archive/documentation-pre-overhaul-2026-09-19/BUILD-PLAN.md).
Current implementation state is [PROJECT-STATE](PROJECT-STATE.md); requirements
remain the target contract in [REQUIREMENTS](REQUIREMENTS.md).

## Near-term roadmap

1. **Close safety and measurement mismatches.** Hide Hub/Log Weight figures in
   numbers-hidden mode and exclude warm-ups from weekly volume, with focused
   adversarial tests.
2. **Finish incomplete user journeys.** Wire the existing Hevy parser through a
   consent-gated file review/import flow and database writes; add honest failure
   states where initial reads currently fail silently.
3. **Prove deployment boundaries.** Add a browser→Worker→D1 sync acceptance
   path, offline deep-route navigation fallback, and real-device persistence /
   camera checks without weakening offline-only operation.
4. **Complete data rights.** Design authenticated server erasure and
   cross-device propagation; keep device-only wording until it is verified.
5. **Finish evidence curation.** Move the 32-claim corpus toward the roughly 50
   target and close direct-source/reviewer ledger work. Do not equate schema or
   DOI validation with editorial truth.
6. **Align automatic advice.** Preserve both sides of contested evidence in the
   workout path and record Hub rule-card impressions so cooldown behavior matches
   what was actually shown.

## Invariants for every change

- Advice remains deterministic, claim-bound, graded, and citation-backed; no
  runtime LLM or hand-authored citation path.
- `src/domain/guards.ts` remains the sole calorie-target choke point; maintenance
  stays default and the 500 kcal cap / calorie floors remain code-enforced.
- Core writes remain local-first and survive network failure; sync stays
  optional append-log/LWW, never CRDT/OT.
- No disease claims, fabricated personal thresholds, publisher figure images,
  health data in URLs, or silent numeric invention.
- Preserve archives and dated handoffs. Update
  [feature status](reference/feature-status.md) and
  [requirements traceability](reference/requirements-traceability.md) when a gap
  actually closes.

Contributor commands and release gates are in [development](guides/development.md),
[testing](guides/testing.md), and [deployment](guides/deployment.md).

# Next Agent Prompt

Paste this into the next agent session from the repo root.

```text
You are taking over FitnessNiche / MyoStat, an evidence-graded lifting and nutrition PWA.

Start by reading:
- app/CLAUDE.md
- docs/agent-handoff/README.md
- docs/agent-handoff/REMAINING-WORK.md
- docs/PROJECT-STATE.md
- docs/BUILD-PLAN.md
- docs/REQUIREMENTS.md
- docs/00-meta/food-data-provider-research.md

Important: older docs may say M5 and FR-LOG-6 are feature-complete on OpenSourceMod and not merged. Verify git before trusting that. At handoff on 2026-07-31, main, OpenSourceMod, origin/main, and origin/OpenSourceMod all contained a380c9a.

Run the baseline before editing:

git status --short --branch
git log --oneline -8
git branch --all --contains HEAD
cd app && npm run typecheck && npm test -- --run

Product guardrails are non-negotiable:
- No advice without a stored claim_id.
- Citations and grades render only from claim records.
- No LLM in the runtime trust path.
- Calorie floors, deficit cap, maintenance default, and numbers-hidden mode stay structural.
- No streaks, eat-back-to-zero framing, rapid-loss targets, medical-device claims, or fabricated precision.
- Food and evidence data must not be invented.
- Local-first writes and privacy defaults must remain intact.

Use TDD for feature work and bug fixes. Use subagents for independent implementation/review tasks where helpful. Keep claim grading, guardrail changes, sync correctness, and food-data honesty decisions in the main/strong model; lower-intelligence subagents are fine for repetitive tests, mechanical adapters, docs review, or UI verification.

Commit at green checkpoints with human-sounding commit messages and no AI attribution. Do not push, merge, or open a PR unless the user explicitly asks.

Recommended next work, in priority order:
1. M6 claim curation expansion from 17 claims toward roughly 50, with contested-cluster steelman review and calibrated-language sweep.
2. Sync/data-rights hardening: server-side erasure endpoint and browser-to-real-Worker/D1 e2e verification.
3. Food provider production hardening: proxy Open Food Facts, rate-limit/cache, and introduce a FoodProvider adapter for future USDA/FatSecret-style providers.
4. Barcode camera scanner with @zxing/browser, preserving manual barcode entry as fallback.
5. CoFID seed expansion, cross-device food recents strategy, LogWeight input polish, exercises table decision, Lighthouse/PWA/demo script.

If the user has not named a specific next item, ask which of those priorities to start with rather than guessing.
```

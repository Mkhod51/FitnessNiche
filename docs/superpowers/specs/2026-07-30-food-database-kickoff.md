# Hand-off prompts — 2026-07-30

Two self-contained prompts to paste into fresh sessions. Copy each block verbatim.

---

## PROMPT 1 — build the food database (FR-LOG-6)

```
You are picking up the MyoStat build mid-flight, on branch `OpenSourceMod`. HARD CONSTRAINT: never merge to `main` — the developer merges it themselves. Keep all work on the branch; commit small, human-sounding messages with no AI attribution (see app/CLAUDE.md).

TASK: build the food database (FR-LOG-6). The design is APPROVED and fully specced — do not re-litigate it.

READ FIRST, in this order:
1. docs/superpowers/specs/2026-07-30-food-database-design.md  ← the design, source of truth
2. docs/mockups/food-picker.html (and .png)                    ← the 5 approved UI mockups
3. docs/PROJECT-STATE.md                                       ← overall state (M5 just closed; food DB is next)
4. app/CLAUDE.md                                               ← tenets T1–T6, GR guardrails, commit rules
5. DESIGN.md                                                   ← the visual system (controls, meters, type, motion)
6. Existing nutrition code: app/src/db/nutrition.ts, app/src/db/migrations/0003_nutrition.sql (food_items + food_log_entries ALREADY EXIST and are sync-marked), app/src/features/nutrition/EatDay.tsx.

KEY CONSTRAINTS (non-negotiable):
- Never merge to main. Offline-first; never lose a write.
- NO fabricated food data: CoFID macros verbatim; OFF values as-given. Pull real CoFID numbers (don't guess).
- Honest UI: filter OFF items missing kcal or protein (no zero-fill), show source per item (CoFID vs OFF), and surface "results hidden — incomplete data".
- Grams is the primary quantity control (FR-LOG-3, amended); show quantity as entered.
- Every food action needing the network must show a plain "you'll need wifi" message when offline; recents + common foods + quick-add stay usable offline.
- No LLM in the trust path; no shadow anywhere a meter must not deplete to zero (GR-1).

HOW TO WORK:
- Graphify MCP: this repo has a knowledge graph at graphify-out/graph.json. Run `graphify query "<question>"` BEFORE reading source files (there's a PreToolUse hook enforcing this), and `graphify update .` after code changes (AST-only, no API cost). Use `graphify path`/`explain`/`god-nodes` freely.
- Skills: superpowers:writing-plans to expand the spec into a task plan; superpowers:subagent-driven-development to execute it; superpowers:test-driven-development (failing test → minimal code → green → commit); frontend-design and impeccable for the picker UI (build to the mockups + DESIGN.md); superpowers:verification-before-completion before declaring done.
- MCPs as needed: Playwright to render/verify the picker against the mockups and to run e2e; perplexity / firecrawl / WebSearch to CONFIRM the exact Open Food Facts v2 search + barcode endpoints, browser CORS, and the `nutriments` field names BEFORE coding the client; web/firecrawl to fetch real CoFID values for the curated seed.

SUBAGENT / TOKEN DISCIPLINE (important):
- Delegate mundane, low-judgment work to a SMALLER subagent (glm-4.7) to save tokens — e.g. wiring the idempotent seed loader, building a presentational list component from a written spec, writing straightforward tests from fixtures, mechanical refactors, mechanical text edits.
- ONLY delegate where you are sure the weaker model will NOT lower quality. KEEP THE STRONG MODEL for: the OFF response parser (correctness-critical), food-data curation (accuracy/honesty-critical), the connectivity gate, anything touching an honesty guard or a GR guardrail, and every design decision. When in doubt, do it yourself.

START BY: (1) a quick web check to pin down the OFF API endpoints/CORS/fields; (2) write the task plan from the spec (writing-plans); (3) TDD the OFF parser first. Report what you build at each step. Run typecheck + unit tests + the relevant e2e before committing; never merge to main.
```

---

## PROMPT 2 — remove AI prose tells from the app text

```
TASK: remove obvious AI-generated prose tells from the text throughout the MyoStat app, on branch `OpenSourceMod` (never merge to main).

SCOPE, in priority order: (1) all USER-FACING copy — UI strings, the privacy notice, settings, advice/claim language, empty states, error/notice messages; then (2) code comments; then (3) docs/*.md. Start with user-facing copy (highest impact, lowest risk).

REMOVE these tells:
- Em-dashes (—) used as connective punctuation. Replace with a period + new sentence, a comma, a colon, or restructure the sentence. Do NOT just swap — for a hyphen, and don't delete the information the dash carried.
- "It's not X, it's Y" / "not just X, but Y" / "X, not Y" / "X — never Y" contrast constructions. Rewrite as plain statements.
- AI intensifiers and hedges: "deliberately", "genuinely", "precisely", "importantly", "notably", "it's worth noting", "the fact that".
- Over-explanatory breathless cadence — state the thing once, plainly.

PRESERVE (do not change):
- Meaning and technical accuracy. The product's PLAIN, HONEST register is intentional — do NOT soften the privacy notice, the honesty guards, the GR guardrail language, or the numbers-hidden copy; their plainness is the point, not an AI tell.
- Identifiers, code, keys, URLs, numbers, and requirement IDs (FR-/GR-/T-/AC-/NFR-).
- If unsure whether something is deliberate house style vs. an AI tell, leave it and flag it rather than guess.

HOW: grep/ripgrep first to find every em-dash and the named patterns, so nothing is missed. Edit PROSE ONLY — never logic, imports, or types. Run `npm run typecheck` and `npm test -- --run` after; commit small human messages with no AI attribution; never merge to main.

SUBAGENT / TOKEN DISCIPLINE: delegate the mechanical find-and-rewrite across files to a SMALLER subagent (glm-4.7), but KEEP THE STRONG MODEL to review that meaning and the honest register survived each batch unchanged. Only delegate where you're sure quality won't drop.
```

# Prompt for the Codex implementation agent

Paste the text below into a Codex task running from the FitnessNiche repository.

---
You are the Sol coordinator responsible for executing the MyoStat documentation overhaul on the existing `codex/documentation-overhaul` branch.

Start by reading, in full:

1. `AGENTS.md`
2. `app/CLAUDE.md`
3. `docs/superpowers/specs/2026-09-19-documentation-overhaul-design.md`
4. `docs/superpowers/plans/2026-09-19-documentation-overhaul.md`

Then use the `subagent-driven-development` workflow to execute the plan task by task. This is a documentation implementation task, not a new product-feature task.

## Repository state you must preserve

- Work only on `codex/documentation-overhaul`. Confirm it before editing.
- The branch was created from the user's current local `main`, which was 35 commits ahead of `origin/main`. Do not reset, rebase, force-checkout, or discard that history.
- `docs/handoffs/` was already untracked before this work. It belongs to the user: do not edit, stage, archive, delete, or commit it.
- Existing documentation must not disappear. Before changing canonical documents, copy their exact pre-overhaul contents to `docs/archive/documentation-pre-overhaul-2026-09-19/`, record them in `MANIFEST.md`, and verify original/archive hashes.
- Do not edit old historical archive material or the research corpus merely to make it look current. Preserve it and label/link it as historical.

## Agent routing and token discipline

Use the Sol agent for synthesis, information architecture, technical judgment, conflict resolution, and final prose. Deploy bounded subagents for repetitive independent work so Sol does not spend its token budget on inventories:

- Use **Terra** subagents for read-only domain audits such as: user-facing feature inventory; storage/sync/data-model inventory; advice/claim/JSON-Logic inventory; requirements-to-code/test traceability.
- Use **Luna** subagents for mechanical work such as: Markdown/link inventories; archive manifest cross-checks; screenshot filename/alt-text audits; repeated code-link verification; stale-phrase searches.
- Give subagents narrow prompts, exact files, and an explicit instruction to report findings without editing shared files unless they own a disjoint deliverable.
- Prefer `fork_turns="none"` or a short recent-turn fork plus a self-contained brief to reduce context cost.
- Keep at most three workers active alongside Sol. Do not delegate product-safety, evidence-grade, provenance, or final status judgments.
- Review every subagent result against source code and tests before it enters documentation.

## Execution rules

- Follow the implementation plan exactly, checking off steps as they complete.
- Treat runtime code/migrations first, then tests, claim YAML/review ledger, active requirements/decisions, and only then historical plans as the truth hierarchy.
- Use Graphify for architecture/file-relationship questions because `graphify-out/graph.json` already exists, but verify important claims in the current files because the graph may predate the latest code.
- Keep `README.md` concise: product promise, a few visuals, current status, quick start, architecture summary, and links. Put detail under `docs/`.
- Explain MyoStat both as an app and as a technical system. Cover every tracker, route, feature, criterion family, data structure, database table, JSON Logic rule, advice selection path, algorithm, guardrail, test layer, deployment path, and known gap named in the plan.
- Preserve requirement IDs and the product's non-negotiables. Never invent evidence, citations, claim completion, user results, test results, or precision.
- Use Mermaid for systems/data flows and Playwright-generated screenshots with deterministic synthetic data for UI explanation. No personal health data. Every screenshot needs useful alt text and a caption.
- Do not alter runtime behaviour or the claim corpus. If you discover a real product bug, record it in the status/open-questions documentation and continue; do not widen this branch into a feature fix.

## Commit discipline

Create small, regular commits—at least one at the end of every numbered plan task and more often when a slice is independently reviewable. Never save all documentation for one final commit.

Before every commit:

1. Review `git diff --cached --name-only`.
2. Confirm `docs/handoffs/` is not staged.
3. Run the focused validation for that slice.
4. Use a short human message without a conventional-commit prefix or AI footer.

The plan suggests messages such as:

- `record the documentation truth baseline`
- `archive the pre-overhaul documentation`
- `give MyoStat a clear documentation front door`
- `document the complete MyoStat product experience`
- `explain the local-first architecture and data model`
- `trace the evidence and advice trust path`
- `finish the engineering and requirements reference`
- `add reproducible visuals to the documentation`
- `keep documentation links and status claims honest`

## Completion bar

Do not stop after drafting prose. Finish only when:

- the dated archive and manifest exist;
- README is a concise outline linked to detailed docs;
- the app and technical documentation sets are complete;
- contradictions identified in the plan are resolved in active docs;
- screenshots and Mermaid diagrams render correctly;
- internal links and image paths pass the docs check;
- claim generation produces no diff;
- app unit tests, typecheck, build, server tests/typecheck, and Playwright pass;
- the screenshot command reproduces the committed images without unexpected diffs;
- the final git status contains no accidental files and the user's `docs/handoffs/` remains untouched.

At handoff, report the documentation map, archive location, screenshot inventory, known product gaps, exact verification results, and the commit list. Use evidence from the commands you actually ran, and do not describe partial or contract-only work as end-to-end complete.

---

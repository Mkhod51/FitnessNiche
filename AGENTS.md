# Codex Project Instructions

This project previously used Claude Code. For Codex, treat
`app/CLAUDE.md` as standing project context and follow it unless the user
explicitly overrides it.

Use the globally installed Codex skills when their triggers match the work:

- `using-superpowers` at the start of a new conversation or substantial task.
- `test-driven-development` for feature work and bug fixes.
- `systematic-debugging` for bugs, test failures, and unexpected behavior.
- `verification-before-completion` before claiming a fix or task is complete.
- `subagent-driven-development` for plans with independent implementation tasks.
- `impeccable` for frontend design, redesign, critique, polish, hardening,
  responsive behavior, accessibility, visual hierarchy, UX copy, and UI audits.
- `graphify` for architecture, codebase, file-relationship, or project-content
  questions, especially when `graphify-out/` is present.
- `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-gain`, and
  `ponytail-debt` when their respective workflow prompts are relevant.

Keep the product guardrails from `app/CLAUDE.md` intact: deterministic
evidence-graded advice, harm guards in code, wellness framing, copyright
care, no fabricated precision, local-first persistence, and privacy by default.

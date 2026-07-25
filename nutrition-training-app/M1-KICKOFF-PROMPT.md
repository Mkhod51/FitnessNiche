# M1 kickoff — paste into a fresh Claude Code session

You are the **build orchestrator** (Opus) starting milestone **M1** of an evidence-graded lifting/nutrition PWA. M0 is complete, merged, and verified on real hardware. You plan, judge, review, and **personally curate the claims**; Sonnet subagents implement everything else.

## Working directory

`/Users/mkhoder/Career/Internship apps /Projects/FitnessNiche`
**Note the real space character after "apps"** — quote every path.

Branch: `main` (M0 merged at `195cbb5`). Not pushed to origin — don't push without asking.

## First: verify state, don't trust this summary

```bash
cd "/Users/mkhoder/Career/Internship apps /Projects/FitnessNiche"
cat .superpowers/sdd/progress.md        # durable ledger — trust this over any prose
git log --oneline | head -20
cd app && npm run typecheck && npm test -- --run && npm run build && npm run e2e
```

Last known green: **typecheck clean · 26/26 unit · build OK · 5/5 e2e**.

## Read for context, in this order

1. `PRODUCT.md` (repo root) — durable product truth, written 2026-07-25. Seven product principles; principle 7 is the design mandate for this milestone.
2. `nutrition-training-app/REQUIREMENTS.md` — the spec. FR/NFR/GR/T/AC/DM/OQ IDs are the shared vocabulary.
3. `nutrition-training-app/BUILD-PLAN.md` §M1 — the milestone's checklist and gate.
4. `nutrition-training-app/00-meta/evidence-standards.md` — **the [A]–[D] grading rubric. You will apply this by hand to every claim.**
5. `nutrition-training-app/03-thesis-review/advice-strategies.md` and `wave1-d-credibility-risk.md` — the D1–D7 risk register that justifies the whole design.
6. `app/CLAUDE.md` — standing rules, tenets, commit style.
7. `.superpowers/sdd/progress.md` — ledger, decisions, open debt D6–D10.

## Where M0 left things

- Vite 8 / React 19 / TS 6 strict / Tailwind v4 / Vitest 4 / Playwright. CI at `.github/workflows/ci.yml`.
- SQLite-WASM in a Web Worker on the OPFS `opfs-sahpool` VFS. **Persistence proven on desktop Chromium and on a real iPhone** (TA-1 gate passed 2026-07-25 — no Expo pivot; the PWA shell stands).
- Drizzle over `sqlite-proxy`; hand-rolled transactional migration runner with an ordering guard. Schema v1: users, exercises, workouts, sets, weights, sync_meta.
- PWA installable, ~1.5 MB `.wasm` in the precache manifest, offline boot + offline write both proven in e2e.
- 56 hand-authored exercises seeded, idempotent.

**The current UI is a debug harness, not a design.** `app/src/App.tsx` renders a heading plus `storage-mode` and `exercise-count` readouts that existed only to prove the platform. Treat it as anti-reference, not as incumbent visual identity — but keep the `data-testid` hooks alive or update the e2e specs deliberately, never silently.

## M1 — what to build (BUILD-PLAN §M1)

The **risk-retiring milestone**. If this interaction doesn't feel honest *and* pleasant, the thesis is in trouble — that's the point of building it first.

- [ ] Claim schema (Zod) + `build-claims.ts` + `claims/schema.md`
- [ ] **You (Opus) curate 15–20 claims end-to-end** — see the curation contract below
- [ ] `language.ts` grade→verb map with an exhaustive-union test (a [C] must be *incapable* of rendering "proven")
- [ ] `engine.ts` predicate evaluation + unit tests per trigger
- [ ] UI: `GradeChip`, `ClaimCard` (decisive default + chip), `EvidencePanel` (tap-1 "why", tap-2 re-plotted figures with n and population first-class), contested clusters rendering both sides
- [ ] Advice feed page + minisearch "ask the evidence" surface

**Checks:** AC-3 (static claims) · AC-4/T1 (grep-proof *and* test: no render path without a `claimId`) · AC-6 partially (≥15 claims).
**Gate at the end: the user reviews. Does the interaction feel decisive AND honest?** Do not start M2 before that verdict.

## The claim curation contract — read this twice

This is the moat and the single most dangerous surface in the product. **Fabricating a citation is worse than shipping nothing.**

**Available tooling.** Three MCP servers are configured for this work — `perplexity`, `firecrawl`, and `playwright` — alongside `WebSearch` and `WebFetch`. If they don't appear in your tool list, they are scoped to the wrong project; check with `claude mcp list` and see the note at the end of this section.

The curation-time sources REQUIREMENTS TA-5 names remain the authority:
- **OpenAlex** (`api.openalex.org`) — CC0 metadata, abstracts, citation graph. The backbone.
- **Europe PMC** — open-access full text where available.
- **CrossRef** — DOI resolution.

**How to use each tool — this distinction is the whole ballgame:**

- **Perplexity is a discovery tool, never an evidence tool.** It is an LLM with web search: its output is *generated prose that carries citations*, and it can mis-attribute a finding, merge two studies, or state a sample size that appears nowhere in the paper. Use it to find *which* papers exist on a question and to surface candidate DOIs. **Never copy a number, a grade, a population, or a conclusion out of a Perplexity answer into a claim record.** Every DOI it hands you gets independently resolved against OpenAlex or CrossRef; every extracted figure comes from the paper itself. If a Perplexity summary and the source disagree, the source wins and the summary was noise.
- **Firecrawl** is the right tool for turning a real paper or Europe PMC record into readable text you can extract from. Numbers pulled from a Firecrawl scrape of the actual source are legitimate evidence; numbers pulled from a search-engine summary are not.
- **Playwright MCP** is not a curation tool. It's useful later in the milestone for driving the advice feed in a real browser during the Impeccable design loop. Don't confuse it with the project's own Playwright e2e harness in `app/e2e/`, which stays the source of truth for tests.
- **WebFetch** against `api.openalex.org` and `api.crossref.org` is often faster and more reliable than any of the above for straight DOI resolution and metadata. Prefer it for verification.

**The verification rule that follows from all of this:** a claim record may only contain numbers you traced to the source document. The chain must be *discovery → resolve the DOI → read the source → extract*. Skipping the middle two steps is how a product whose premise is "structurally incapable of fabricating a citation" ends up shipping a fabricated citation, and no test in this repo would catch it.

**If the MCPs are missing from your session:** they're configured under the `/Users/mkhoder` project scope in `~/.claude.json`, not under this repo, so a session started here won't load them. Either add them to this project's scope or promote them to user scope (`claude mcp add --scope user ...`). Proceed with WebSearch/WebFetch if they're unavailable, and say so rather than pretending you searched.

**Hard rules, non-negotiable:**
1. **Every DOI must resolve.** If you cannot fetch a real record for it, the citation does not go in the file.
2. **Every extracted number — n, effect size, CI, duration, population — must come from a source you actually read.** Never infer, never round from memory, never "typical values."
3. If a field can't be sourced, **leave it null and let the UI handle absence.** A missing CI is honest; an invented one is fraud.
4. **Grade by the rubric in `00-meta/evidence-standards.md`**, not by vibes. Per FR-CLAIM-5, a trained-population claim supported only by untrained studies **drops a grade**.
5. **Never embed a publisher's figure image** (GR-3). Extract the numbers and re-plot them in the app's own chart style. Facts aren't copyrightable; figures are.
6. Mark `status: contested` honestly. **Protein timing is the required contested exemplar** — it must render both sides, steelmanned, not one side with a hedge.
7. Record `last_reviewed` on every claim (FR-CLAIM-4).

**Topic coverage** (BUILD-PLAN names these): volume, frequency, protein dose, protein timing (contested exemplar), failure proximity, bulk rate, deloads, rest intervals.

**Sanity check before you commit any claim file:** re-read each claim as a hostile evidence-literate lifter — the audience for this product can and will check your work. If a grade looks generous, it is.

## Design — use the Impeccable skill

`PRODUCT.md` exists; **`DESIGN.md` does not.** There is no visual world yet, so this milestone establishes one.

- Invoke `/impeccable shape advice feed` to plan the surface before writing UI code, then let it route into new-work for the visual world.
- Mode is **Operate** (the user completes a task), but the surface must satisfy PRODUCT.md principle 7.
- **The design mandate, from risk D3:** nuance is the *default state*, not a disclosure layer. A citation reads as "proven" to most people, so the grade must be as prominent as the claim and dissent must be first-class. If nuance only appears when someone digs, the thesis has already failed. The research is explicit that if nuance degrades under interface constraints, the thesis is compromised rather than merely softened.
- **The usage scene is real:** one hand, phone at arm's length, ~90 seconds between sets. The developer's ruling when readers conflict: **lifter first, but the thesis must survive the glance.**
- **M1 has no user data.** Logging arrives in M2, data-earned advice in M4. The advice surface must be honest and useful against an empty database — claims are browsable and searchable before they are ever data-earned. Design for that truthfully; do not mock up fake user data to make it look alive.

## How to work

- **Write a task plan first** (`superpowers:writing-plans`), then execute it with `superpowers:subagent-driven-development`. Scripts live at `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.1.1/skills/subagent-driven-development/scripts/`.
- **Dispatch a fresh Sonnet subagent per task** with a self-contained brief — exact paths (mind the space after "apps"), pinned interfaces, requirement IDs. Never paste session history into a dispatch.
- **Claim curation stays with you (Opus).** BUILD-PLAN's model routing reserves it. Sonnet does schema, engine, UI, and tests.
- **Review every diff yourself.** Extra scrutiny on `advice/engine.ts`, `language.ts`, anything touching `claim_id` provenance, and `src/db/`.
- Use `superpowers:verification-before-completion` before any completion claim, and dispatch a whole-branch review before merge.
- **Append to the ledger after every task:** `Task N: complete (commits <base>..<head>, review clean)`.
- **Commits: small, frequent, human-sounding, lowercase, no prefixes, no AI attribution.** e.g. `grade the protein timing claim as contested and show both sides`.
- Run the full suite (`typecheck && test && build && e2e`) before declaring anything done. A truthful failure beats a weakened assertion — if a test fails, report it.

## Non-negotiables

- **T1 / GR-6 / AC-4** — no advice rendered without a stored `claim_id`; citations and grades render **only** from claim records; **no LLM anywhere in the runtime trust path**. This must be provable by grep *and* by test.
- **FR-ADV-5** — grade→verb map is a fixed, exhaustive union. A [C] claim must be structurally incapable of rendering "proven".
- **FR-ADV-6** — contested claims return the cluster and render both sides.
- **FR-ADV-8** — every figure card shows sample size and trained/untrained population as first-class fields, never footnotes.
- **GR-2/3/4** — wellness framing only; re-plot figures, never embed publisher images; no individualized MEV/MRV.
- **GR-1** — harm guards (calorie floor, ≤500 kcal/day deficit cap, maintenance default, numbers-hidden mode) land in M3 via `src/domain/guards.ts` as a single choke point. Don't create a competing path now.
- **Offline-first**; append-log + LWW sync; **no CRDTs**.

## Open debt carried in from M0

- **D6 — must close before M2.** The non-OPFS fallback is `:memory:` with no IndexedDB export, deviating from BUILD-PLAN §M0's "graceful IndexedDB fallback". Reachable *today* by opening a second tab (SAHPool is single-connection). Harmless only while nothing writes. Logged as decision #8 in `00-meta/decision-log.md`.
- **D7** — `memory-fallback` is a data-loss mode rendered as a bare value with no warning. Needs UI honesty before any write path ships.
- **D8** — `db.changes()` is never surfaced over the worker RPC, so drizzle `.run()` can't report rows-affected. Trigger: first M2 update path or the M5 sync drain.
- **D9** — `pwa.spec.ts` reads `dist/sw.js` off disk with no build dependency; a stale `dist` can green it locally. CI is safe.
- **D10** — `sqlite.worker.ts`'s `onmessage` is async and unserialised; an exec arriving before init errors instead of queueing. Unreachable today.

## At the end of M1

1. Run `superpowers:verification-before-completion` against BUILD-PLAN §M1's checks.
2. Dispatch a whole-branch review with the most capable model; point it at D6–D10 for triage.
3. Update `PROJECT-STATE.md` and append M1 decisions to `00-meta/decision-log.md`.
4. **STOP and ask the user.** M1 ends at a human gate: *does the interaction feel decisive AND honest?* Do not start M2 before that verdict, and don't merge without asking.

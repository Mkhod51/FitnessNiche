# MyoStat

A combined strength-training and nutrition tracker whose differentiator is **honest, evidence-graded, citation-backed advice**. Every recommendation carries a confidence grade ([A]–[D]) and a real citation, is contextualised to the user's own logged data, and is shown with nuance rather than as a confident directive. The product's value is that it *refuses to overstate* — code that fakes precision is a defect even if it looks good.

Offline-first PWA. SQLite (WASM) on-device is the source of truth; a thin sync layer replicates to a Cloudflare Worker + D1. Aimed at science-based / evidence-based lifters.

**Status:** portfolio v1 in active development (solo, UK). The training, nutrition, advice, reconciliation, and sync milestones (M0–M5) plus the food database are feature-complete; curation expansion and hardening are the open work. See [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) for the live ledger.

---

## Why this exists

The in-app market slot is empty: every citation-rich product (MASS, Examine, Helms, Stronger By Science) keeps evidence in a *content* layer, never inside the tracker at the point of decision. At the same time the "science-based lifting" evidence base is mostly small-n, short, and untrained-dominated — so a bare citation launders weak evidence. The honest answer is to **grade the evidence, including the sacred cows, with the citation as the receipt.** Full thesis: [`docs/03-thesis-review/review.md`](docs/03-thesis-review/review.md).

The advice can only ever come from a curated, graded claim base. It is structurally incapable of fabricating a citation: no code path may render advice without a stored `claim_id`, and there is no LLM in the runtime trust path.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript 6 (strict), Vite 8, Tailwind v4 |
| Storage | SQLite compiled to WASM, in a Web Worker on the OPFS `opfs-sahpool` VFS |
| ORM / migrations | drizzle-orm over `sqlite-proxy` + a hand-written transactional migration runner |
| Advice engine | deterministic json-logic predicate evaluator over a curated claim base (YAML → build pipeline → typed, committed bundle) |
| Sync | Cloudflare Worker (Hono) + D1, append-log push/pull, last-write-wins on `updated_at` |
| PWA | vite-plugin-pwa (Workbox) |
| Food data | Open Food Facts search + barcode lookup, CoFID common-food seed, quick-add fallback |

No CRDTs, no operational transform — wrong problem class for this shape of data.

---

## Getting started

All commands run from [`app/`](app/).

```bash
cd app
npm install
npm run dev        # Vite dev server
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` for app + node configs |
| `npm run build` | Typecheck, then production build |
| `npm run e2e` | Playwright end-to-end suite |
| `npm run claims` | Build the advice claim bundle from YAML |
| `npm run claims:audit-dois` | Resolve every claim DOI against CrossRef |

The sync server lives in [`app/server/`](app/server/) (see its README for the Worker/D1 setup).

---

## Repo layout

```
app/                  the application
  src/
    domain/           pure, framework-free domain logic (guards, e1RM, reconcile)
    advice/           the deterministic claim engine + snapshot builder
    features/         screens (log, nutrition, advice, hub, review, trends, settings, …)
    db/               SQLite client, schema, migrations
    sync/             append-log queue + push/pull merge
    food/             Open Food Facts + CoFID + picker
    components/       shared UI
  claims/             hand-curated, graded YAML claims (the advice source of truth)
  server/             Cloudflare Worker + D1 sync endpoint
  e2e/                Playwright specs
docs/                 research corpus, spec, build plan, project state
```

`docs/` holds the research corpus and build docs. The corpus (`00-meta/`, `01-research/`, `03-thesis-review/`, `04-sources/`, `archive/`) is read-only reference. Build-facing docs (`REQUIREMENTS.md`, `BUILD-PLAN.md`, `PROJECT-STATE.md`) are updated as the build progresses.

---

## Non-negotiables

These shape everything; violating any of them fails the project. Full detail in [`app/CLAUDE.md`](app/CLAUDE.md).

- **Structural provenance.** Advice renders only from claim records — never hand-written in a component, never produced by a model at runtime. Claim content is authored at build time.
- **Harm guards in code, not copy.** Calorie floor, ≤500 kcal/day deficit cap, maintenance as the default goal, numbers-hidden as a first-class state. No streaks, leaderboards, rapid-loss targets, or eat-back-to-zero framing.
- **Wellness framing only.** No disease detection, monitoring, or in-app screening. Signpost Beat/NHS; never diagnose.
- **No fabricated precision.** No individualised MEV/MRV, no phone-camera velocity autoregulation. e1RM is a many-point regression with a rendered confidence band; when the signal is inside the noise floor, the UI says so.
- **Offline-first.** Every core action works with zero connectivity and no write is ever lost.
- **Privacy.** Health data is UK-GDPR special category: explicit consent before logging, export + delete supported, on-device by default, never in a URL or query string.

---

## Documentation

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — the spec; requirement IDs (FR/NFR/GR/AC) are the shared vocabulary
- [`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md) — master plan, locked stack, repo layout, pinned interfaces, milestones
- [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) — live status ledger (start here for a new session)
- [`app/CLAUDE.md`](app/CLAUDE.md) — standing engineering context and the guardrails

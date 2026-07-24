# Project Zero — Combined Nutrition + Training App: Ideation & Thesis Review

A three-phase research and ideation project to land a differentiated, buildable concept for a solo UK developer's 2–3 month portfolio app (strength-training logging + nutrition tracking). Orchestrated by an architect model dispatching bounded research subagents; every consequential call is logged in [00-meta/decision-log.md](00-meta/decision-log.md), with evidence graded [A]–[D] throughout ([00-meta/evidence-standards.md](00-meta/evidence-standards.md)).

## The three phases

| Phase | Question | Outcome |
|---|---|---|
| **1 — Ideation sprint** | Where are incumbents structurally weak, and what can a combined app do that two separate apps can't? | Killed the "computational moat" premise; recommended **Verdict** (an honest weight-trend × strength-trend read). Archived in [archive/phase1-ideation/](archive/phase1-ideation/) and [01-research/](01-research/). |
| **2 — Deep ideation (science-based-lifting pivot)** | For the evidence-based lifting niche specifically, what holds up? | e1RM trend is *wounded, not killed*; produced the **Cut Reconciler** engine. Archived in [archive/phase2-ideation/](archive/phase2-ideation/). |
| **3 — Thesis review + commit** | Does "citation-grounded, nuanced advice" hold as the differentiator? | **Holds, reframed** — and now the chosen direction. [03-thesis-review/review.md](03-thesis-review/review.md). |

> **Status: idea chosen.** The project has committed to the citation-graded advice product. All other ideas are in [archive/](archive/); the live product knowledge base is [03-thesis-review/](03-thesis-review/) (thesis, findings, advice-strategies, feasibility) plus the supporting research it points to.

## Phase 3 headline (current)

The thesis under test was: a tracker whose differentiators are (1) advice backed by cited studies and (2) nuance instead of confident directives. Wave 1 found:

- **The in-app market slot is empty** — every citation-rich product (MASS, Examine.com, Helms, Menno, Stronger By Science) keeps evidence in a *content* layer, never inside the tracker at the point of decision. ([Stream A](04-sources/raw-notes/phase3-a-landscape.md))
- **The evidence base is mostly thin** — small-n (10–40/arm), short, untrained-dominated. Flagship "science-based" claims (per-meal protein/leucine timing, mandatory periodization, optimal bulk rate) are far weaker than the content ecosystem implies; the field even reversed itself on lengthened partials. ([Stream B](04-sources/raw-notes/phase3-b-literature.md))
- **Infrastructure is solved; curation is the cost** — OpenAlex (CC0) + Europe PMC + CrossRef; extracted numbers aren't copyrightable (re-plot, don't embed figures); a ~50-claim curated DB is solo-feasible, but grading is irreducible ongoing human labour. ([Stream C](01-research/technical/citation-infrastructure.md))
- **Citations amplify trust more than the evidence warrants** — so a bare citation on this literature launders weak evidence. ([Stream D](03-thesis-review/wave1-d-credibility-risk.md))

**The reframe (the review's core):** citations and nuance are not two differentiators but **a feature and its safety system.** The honest product is not "the app that cites studies" but **"the app that grades the evidence honestly — including grading the sacred cows [C] — with the citation as the receipt."** Full synthesis in [03-thesis-review/findings.md](03-thesis-review/findings.md).

## Recommended, and the strongest objection

**Verdict:** the reframed thesis holds and is now the chosen product — an honest-grading advice layer (features **A** evidence-grade primitive + **C** progressive disclosure at its core; [feature-brainstorm.md](03-thesis-review/feature-brainstorm.md)), attached to the archived Phase 2 cut/bulk reconciliation engine so citations are earned by the user's own data. How the advice is actually generated is worked out in [advice-strategies.md](03-thesis-review/advice-strategies.md); the build assessment is in [feasibility.md](03-thesis-review/feasibility.md).

**Strongest objection:** the biggest risk is neither technical nor competitive — it's whether de-mythologising is a product people *sustain using*. An app that tells science-based lifters their favourite protocols are [C] earns respect, but respect and daily engagement are different things, and no evidence settles which way it goes. For a portfolio piece that risk is acceptable; for a business it's the first thing to validate.

## What planning should tackle first

1. **Prove the A+C interaction** — a confidence-graded claim with decisive default + depth-on-demand that feels honest *and* pleasant. This single interaction is the thesis standing or falling.
2. **Curate ~50 high-leverage claims**, graded properly, treated as the product (not 500 shallow ones).
3. **Attach citations to the reconciliation engine** so evidence is contextual to logged data.
4. Carry forward all prior constraints (ED-safe baseline, medical-device fence, offline-first, open-data food stack) — see [00-meta/decision-log.md](00-meta/decision-log.md).

## Repo map

- [03-thesis-review/](03-thesis-review/) — **the live product**: thesis (review), findings, feature brainstorm, advice-strategies, feasibility, credibility-risk
- [01-research/](01-research/) — supporting research kept live: evidence base, citation infrastructure, audience, constraints, competitor intel, tech patterns, food data
- [00-meta/](00-meta/) — decision log, evidence standards, carryover, migration maps
- [04-sources/](04-sources/) — raw subagent notes
- [archive/](archive/) — all other, non-chosen ideas: Phase 1 ideation & research, Phase 2 ideation (incl. the Cut Reconciler)
- [PROJECT-STATE.md](PROJECT-STATE.md) · [MIGRATION.md](MIGRATION.md)

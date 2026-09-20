# Product

<!-- impeccable:product-schema 1 -->

Derived from `docs/REQUIREMENTS.md` (the build's source of truth), the Phase 3 thesis review, and two confirmed answers from the developer on 2026-07-25. Requirement IDs (FR/NFR/GR/T/AC/DM/OQ) are the shared vocabulary across every document here — use them rather than paraphrasing.

This file is the durable product contract: thesis, users, principles, and non-goals. Use the [product overview](docs/product/overview.md) and [feature tour](docs/product/feature-tour.md) for the current experience, the [safety and privacy guide](docs/product/safety-privacy.md) for guardrails, and the [feature status matrix](docs/reference/feature-status.md) for mutable implementation and verification claims.

## Platform

web

PWA, installable to home screen, offline via service worker + local wasm-SQLite (TA-1, NFR-7). Mobile-first by usage scene, not by wrapper — this is not a native app and a native design language would be wrong. Native wrap via Capacitor is explicitly post-v1 (NG5). The iOS platform gate passed on real hardware on 2026-07-25, so the PWA shell is confirmed rather than provisional.

## Users

**Science-based / evidence-based lifters.** Followers of RP, Stronger By Science/MASS, Jeff Nippard, Menno Henselmans; reachable via r/weightroom and r/naturalbodybuilding. Evidence-literate, and already paying for tools — RP app ~$25–35/mo and MacroFactor ~$6–12/mo, frequently stacked.

The specific user v1 must serve well: **an intermediate lifter running a structured program, mid-cut or mid-bulk, who currently stitches a training app + a nutrition app + their own head.** The reconciliation they do in their head is the gap the product fills.

This audience is unusual in a way that shapes everything: they can evaluate a citation, they argue about this evidence recreationally, and they will notice a misgraded claim. They are the one audience equipped to value intellectual honesty — and equipped to catch dishonesty.

## Product Purpose

A combined strength-training and nutrition tracker whose differentiator is **honest, evidence-graded, citation-backed advice**. Every recommendation carries a confidence grade and a real citation, is contextualised to the user's own logged data, and is presented with confidence and dissent rather than as a confident directive.

Success for v1 (G1–G4): prove the **A+C interaction** — a confidence-graded claim with a decisive default plus depth-on-demand that feels both honest *and* pleasant; ship a working offline-first tracker with honest computed trends; ~50 curated graded claims; and one data-earned advice moment where the user's own logged reality triggers the claim.

The developer's stated priority when readers conflict: **the lifter mid-workout comes first, and legibility of the thesis is a hard constraint on that design rather than a separate presentation mode.** If the nuance only appears when someone digs for it, the thesis has already failed (see D3 under Product Principles).

## Positioning

**Intellectual honesty operationalised** — and operationalised *structurally*, not as a tone of voice. The mechanism a neighbouring product cannot truthfully copy without rebuilding: advice is bound to a stored `claim_id`, and the citation and grade are rendered *from the claim record*, never authored as free text. The app is structurally incapable of fabricating a citation or of saying "proven" about a [C] claim.

The competitive read is honest about its own fragility: defensibility is *"they haven't,"* not *"they can't"* (OQ-5). MacroFactor is researcher-built, trusted, and already a tracker; it could occupy this slot. The moat is the curated claim base itself (FR-CLAIM-1), which is depth over breadth and expensive to assemble.

Positioned explicitly *against* the confident-directive content ecosystem — which is also the source of its most dangerous failure mode (D3).

## Operating Context

- **The real usage scene:** one hand, phone at arm's length, ~90 seconds between sets, gym lighting, possibly sweaty hands. Rapid use between sets is a stated design target (NFR-3).
- **Connectivity is not assumed.** Gym basements have no signal. The core loop must work at zero connectivity and never lose a write (T4, NFR-1, AC-1).
- **The user arrives mid-programme, not at week zero.** They have training history elsewhere. Hevy CSV is the chosen v1 import format (FR-LOG-5), but current source exposes only a tested parser; no user-facing import workflow is shipped. Onboarding must not depend on an import that is not wired into the product.
- **Food logging is approximate by default** — quick-add, portion tiers, recents, barcode. Gram precision is optional depth, never the required path, because approximate-sustained beats precise-abandoned (FR-LOG-3).
- **Advice at M1 has no user data to stand on.** Logging arrives in M2 and reconciliation in M4, so the first advice surface must be honest and useful with an empty database — claims are browsable and searchable before they are ever data-earned.
- **The developer is solo, UK-based**, building with Claude Code on a ~2–3 month v1 horizon. Curation is manual and one-time-per-claim; the running app never queries scholarly APIs (FR-CLAIM-3).

## Capabilities and Constraints

**Confirmed capabilities (v1 scope):** offline set/bodyweight/food logging · Hevy CSV import target (currently parser-only) · e1RM as a many-point regression with a confidence band · per-muscle weekly volume against population ranges · smoothed weight/intake trends · cut/bulk reconciliation verdict · deterministic predicate-driven advice engine · free-text "what does the evidence say about X" retrieval over a curated claim corpus · progressive disclosure to re-plotted figures · append-log sync with last-write-wins.

**Hard fences, enforced in code and not by warnings:**

- **No LLM in the advice trust path** (NG1, FR-ADV-9, GR-6). Substance, citations and grades are deterministic and app-rendered. A future phrasing layer sits behind a validator that rejects any output introducing an unlisted citation or altering a grade.
- **No advice without a stored `claim_id`** (T1, FR-ADV-1, AC-4). Verifiable by grep and by test; there must be no render path for an ungraded or uncited recommendation.
- **Grade-calibrated language** via a fixed map (FR-ADV-5): [A] "well-supported" … [C] "suggested, limited evidence" … [D] "anecdotal". Enforced as an exhaustive union so a [C] literally cannot render "proven".
- **ED safety** (GR-1): hard calorie floor, ≤500 kcal/day deficit cap, maintenance as the default goal, numbers-hidden as a first-class state. No restriction streaks, "days under budget", rapid-loss targets, weight/shape leaderboards, or eat-back-to-zero framing. Performance framing by default.
- **Wellness, never clinical** (GR-2, T6): no disease detection, monitoring or management; no in-app ED screening; hard refusal and signpost on clinical questions, which the citation feature actively invites (D7).
- **Copyright** (GR-3): re-plot extracted numbers in the app's own chart style; **never embed a publisher's figure image**; short attributed quotes only.
- **No fabricated precision** (GR-4): no individualized MEV/MRV, no phone-camera velocity autoregulation. Population statistics are never presented as personal predictions (D6).
- **Every figure card shows sample size and trained/untrained population as first-class fields** (FR-ADV-8) — not as footnotes.
- **No CRDTs** (NFR-2): append-log plus last-write-wins on a server timestamp.

The product name is decided (see Brand Commitments). Whether de-mythologising is a product people sustain using remains the top open risk (OQ-1) and is not resolvable by design alone.

**Known open technical questions:** whether Hevy's free CSV carries RIR (OQ-2); whether the reconciliation verdict reads as more than two overlaid charts (OQ-4) — the core product-value risk, and a design problem as much as an engineering one.

## Brand Commitments

**The name is confirmed: MyoStat**, decided by the developer on 2026-07-26. It replaces the M0 scaffold placeholder "Evidence-graded training log" wherever that string functioned as the product's name. Runtime visual assets now include the PWA install icons and favicon, the UI has an established colour/type system, and the `Logo` component renders the name as text. Those assets do not constitute an approved logo, wordmark, or typographic lockup. Treat the name as settled and the formal visual identity as still requiring a deliberate decision; see [brand asset notes](docs/brand/README.md).

**The one confirmed voice constraint is mechanical, not stylistic:** advice phrasing is generated from the evidence grade via a fixed map, so the product's register is set by the grade rather than chosen per sentence. Everything the app says about certainty must be traceable to a stored grade.

**Confirmed stance** (FR-ONB-1): onboarding states plainly that science-based lifting is more equivocal than the surrounding content implies, and that the app will show the user where their own protocols are weakly evidenced. This deliberately self-selects the audience — it is a positioning instrument, not a disclaimer.

## Evidence on Hand

**Real and available now:**
- `docs/REQUIREMENTS.md` — v1 requirements, the build's source of truth.
- `docs/03-thesis-review/` — the thesis review, findings, advice strategies, feasibility, and the D1–D7 credibility risk register.
- `docs/01-research/` — incumbent teardowns (MyFitnessPal, Cronometer, MacroFactor), the science-based-lifter segment, abandonment research, ethics/regulatory constraints, and the technical findings.
- `docs/00-meta/evidence-standards.md` — the [A]–[D] grading rubric.
- The current application in `app/`: eight routes spanning training, nutrition, bodyweight, goals, trends, review, evidence, settings, and optional sync; local SQLite/PWA infrastructure; authored exercises and food seed data.
- 32 authored claim YAML files, a generated claim bundle, deterministic selection, citation/grade rendering, and structural provenance tests. This is a working corpus, not completion of the roughly 50-claim v1 target or of every editorial review.
- Runtime PWA icons and favicon plus the current UI design system. These are product assets, not a settled formal logo/wordmark.

**Absences that future work must not paper over:**
- **The claim base is incomplete.** The generated bundle is built from 32 authored claims rather than the roughly 50-claim v1 target, and the review ledger has mixed states including pending work. A corpus count or latest-review date is not evidence that every claim has completed editorial review. Fabricating or overstating a citation remains the single most damaging failure for the premise.
- **Hevy import is not a shipped workflow.** The parser is tested, but there is no route, file picker, production caller, persistence step, or browser flow.
- **Remote integration and erasure are incomplete.** Optional sync code and Worker/D1 contracts exist, but no browser-to-D1 end-to-end test proves the deployed path and no server/cross-device erasure workflow exists.
- **No users, no testimonials, no case studies, no press, no benchmarks, no pricing, no revenue.** Nothing exists to quote and nothing may be invented.
- **No approved formal brand identity** — runtime icons, favicon, typography, and colour tokens exist, but no approved logo/wordmark, photography system, or illustration library is established.

## Product Principles

The first six are the product's own tenets (T1–T6); a change that violates one is wrong even if it tests well. The seventh is the design mandate that follows from the risk register.

1. **Structural claim provenance (T1).** Every piece of advice is bound to a `claim_id`; citation and grade render from the claim record, never as free text. This is what makes fabrication impossible rather than merely discouraged.
2. **Honesty over confidence (T2).** Show grades and dissent; never overstate. Tell the user when their favourite protocol is [C], and when their own progress is below the measurement noise floor.
3. **Measurement honesty (T3).** Never display a number the app can't defend — study statistic or the user's own noisy data alike. Trends carry confidence; pseudo-precise point values are not shown as truth.
4. **Offline-first (T4).** The core loop works at zero connectivity and never loses a write.
5. **Harm-aware by construction (T5).** ED safety lives in floors, caps and removed affordances — enforced, not warned.
6. **Wellness, never clinical (T6).** Signpost; never screen or diagnose.
7. **Nuance is the default state, not a disclosure layer (D1–D3).** A citation reads as "proven" to most people, so attaching one raises believed certainty beyond what the evidence often warrants. The grade must be as prominent as the claim; dissent is a first-class element, not a footnote. A citation-backed app *without* visible nuance is strictly more dangerous than a plain tracker. The research states the design stakes directly: if nuance degrades under interface constraints, the thesis is compromised rather than merely softened.

## Accessibility & Inclusion

- Basic WCAG conformance is a stated requirement (NFR-6): contrast, touch targets, screen-reader labels.
- **One-handed operation mid-workout is the design case**, not an edge case. Touch targets and reach zones should assume a thumb, a moving user, and a short attention window.
- **Numbers-hidden mode is a first-class application state** (GR-1), not a settings toggle bolted on — it must be designed for, since it is a harm-reduction mechanism for users for whom seeing calorie and weight figures is itself the risk.
- Health data is special-category under UK GDPR (NFR-4): explicit separate consent precedes any logging, and data stays on-device wherever possible.

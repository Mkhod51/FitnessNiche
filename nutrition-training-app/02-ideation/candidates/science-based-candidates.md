# Science-Based Lifting — Candidate Set (Phase 2)

Eight candidates, generated against the science-based/evidence-based lifting niche and the Phase 2 findings. Leaner than the Phase 2 brief's 20–30 (per the token-economy re-scope), but generated with the same divergent strategies: segment-first, constraint-as-feature, conventional-wisdom-gap, measurement-honesty, inversion, cross-domain transplant.

All candidates inherit the standing constraints (hard calorie floor, ≤500 kcal deficit cap, maintenance default, numbers-hidden option, offline-first, on-device data, no disease detection, open-data food stack) and the e1RM design constraints from `00-meta/decision-log.md` (regression trend not point value, RIR ≤3 and ≤10-rep sets only, honest confidence bands). Not repeated per candidate.

Evidence grades: [A] meta/RCT · [B] single good study/consistent obs · [C] mechanistic/consensus · [D] industry/anecdote.

---

## SBL-1 · The honest volume tracker
- **Pitch:** Tracks weekly hard sets per muscle against the *evidenced* population range and refuses to invent the personal MEV/MRV numbers RP sells.
- **Origin:** conventional-wisdom-gap + measurement-honesty.
- **Segment:** science-based lifters running their own programs (r/weightroom, r/naturalbodybuilding).
- **Weakness exploited:** RP charges $25–35/mo for individualized landmark detection that is [C/D]; Hevy/Strong don't do per-muscle volume at all.
- **Evidence:** [A] directional dose-response (Schoenfeld 2017); [C/D] for the individualized landmarks it deliberately won't fake.
- **Technical challenge:** exercise→muscle-group mapping with fractional set-counting (compound lifts), set-quality weighting by RIR.
- **Why now:** the audience is newly literate enough (post-2023 volume debates) to *prefer* the honest version.
- **v1:** volume dashboard vs range, RIR-weighted set counts, Hevy import. Cut: nutrition, autoregulation.
- **Copyability:** Hevy could add a volume view in a sprint; the *refusal to fake MRV* is a positioning RP can't copy without repricing its whole product.
- **Ethical risk:** low.
- **Failure mode:** "does less than RP, honestly" may not feel like a product to people already paying RP for the confident version.

## SBL-2 · Cut/bulk performance reconciler  ★
- **Pitch:** Answers the one question no single tool can — "is my cut eating my gains, or working? Hold, or end it?" — by reconciling weight/intake trend against e1RM + volume-tolerance trend.
- **Origin:** integration-gap (the one job that structurally needs both halves).
- **Segment:** science-based lifters mid-cut or mid-bulk who already pay for RP *and* MacroFactor.
- **Weakness exploited:** MacroFactor is blind to training performance; RP/Hevy are blind to intake. Neither can reconcile.
- **Evidence:** [A/B] strength robust to moderate deficit / lean-mass isn't (Murphy & Koehler 2022); e1RM trend usable within constraints [B].
- **Technical challenge:** the honest reconciliation engine — combining two noisy trends into a calibrated verdict with confidence, not false precision.
- **Why now:** MacroFactor proved the adaptive-nutrition audience; the reconciliation is the unbuilt half.
- **v1:** weight+intake trend, regression e1RM, volume-tolerance trend, the verdict; Hevy import. Cut: full program templating.
- **Copyability:** MacroFactor is one lift-logger away — the standing threat. But the reconciliation logic + honesty is the defensible part.
- **Ethical risk:** low-medium (must never nudge toward deeper deficits; cap enforced).
- **Failure mode:** the verdict needs multi-week data; also MacroFactor could ship it.

## SBL-3 · Mesocycle report card
- **Pitch:** At the end of each training block, one page: did volume progress, did e1RM trend up per lift, did bodyweight move as the phase intended.
- **Origin:** cross-domain transplant (the "diff between releases" retrospective).
- **Segment:** structured-program runners who think in mesocycles.
- **Weakness exploited:** logging apps show sessions, not cross-mesocycle deltas; spreadsheet users compute this by hand.
- **Evidence:** [B]/(inference) — rides the same regression-trend signal, and the block cadence *matches* the multi-week window e1RM actually needs.
- **Technical challenge:** block detection/segmentation from a continuous log; cross-block normalization.
- **Why now:** —
- **v1:** block boundaries, per-block deltas, one-page report. Cut: live dashboard.
- **Copyability:** medium; it's a reporting layer.
- **Ethical risk:** low.
- **Failure mode:** periodic (silent between blocks) — likely a *presentation mode* of SBL-2, not a standalone product.

## SBL-4 · e1RM done honestly
- **Pitch:** A strength-progress tracker that computes e1RM only from valid sets, shows a trend with a confidence band, and tells advanced lifters when their gain is below the noise floor.
- **Origin:** measurement-honesty.
- **Segment:** intermediate–advanced lifters obsessed with progression.
- **Weakness exploited:** every app shows a confident e1RM that is [B] pseudo-precision as a point value.
- **Evidence:** [B] directly — this candidate *is* the e1RM findings turned into a product.
- **Technical challenge:** the regression + confidence-band + RIR/rep filtering pipeline; communicating uncertainty without deterring users.
- **Why now:** —
- **v1:** valid-set filtering, trend + band, noise-floor honesty. Cut: nutrition.
- **Copyability:** fast to copy the math; slow to copy the willingness to show uncertainty.
- **Ethical risk:** low.
- **Failure mode:** a feature, not a product — likely the engine inside SBL-2/SBL-3.

## SBL-5 · Nutrition-informs-training (the reverse arrow)
- **Pitch:** Runs the causal arrow Phase 1 never did — underfueling/under-sleeping autoregulates *today's session target down*: "3 days into a steep deficit; aim RIR 3, not RIR 1."
- **Origin:** inversion (direction of data flow).
- **Segment:** science-based lifters cutting hard who over-reach and stall.
- **Weakness exploited:** no tool lets nutrition state modulate the training prescription.
- **Evidence:** [C] — plausible mechanistically (deficit impairs recovery/performance) but no RCT says an app-issued acute down-regulation improves outcomes. Weakest evidence base in the set.
- **Technical challenge:** turning intake/sleep/weight state into a defensible RIR adjustment without pseudo-precision.
- **Why now:** —
- **v1:** deficit-aware session-target nudges. Cut: most else.
- **Copyability:** novel; nobody's near it.
- **Ethical risk:** medium — telling people to train less is safe, but the inference is thin.
- **Failure mode:** builds a recommendation on [C]; the honest audience may reject an under-evidenced nudge — the very thing SBL-1's brand promises not to do.

## SBL-6 · Bounded cut companion (the app designed to end)  ★
- **Pitch:** A science-based companion for one defined cut — evidence-capped rate, weekly reconciliation of weight-trend vs training performance, explicitly built to be *finished and put down at maintenance*, not used forever.
- **Origin:** inversion (bounded-duration product) + integration-gap.
- **Segment:** lifters running a discrete N-week cut before a holiday/meet/summer.
- **Weakness exploited:** every incumbent optimizes for indefinite engagement; the retention evidence [A/B] says approximate-sustained-then-done beats precise-abandoned — a bounded product leans into that instead of fighting it.
- **Evidence:** [A/B] recomp + retention; [A/B] e1RM within constraints. Same evidence spine as SBL-2.
- **Technical challenge:** same reconciliation engine as SBL-2, plus a "you're done, here's your maintenance handoff" exit.
- **Why now:** GLP-1 era + cut-culture make discrete cuts common and legible.
- **v1:** cut setup with rate cap, weekly reconcile verdict, planned exit. Cut: bulk mode (add later).
- **Copyability:** incumbents *won't* copy — a product that tells you to stop using it contradicts their business model. Strongest structural moat in the set.
- **Ethical risk:** medium — a "cut" product near the ED line; the bounded, capped, performance-framed design is the mitigation, and must be strict.
- **Failure mode:** bounded engagement = smaller LTV (fine for a portfolio piece, bad for a business); ED-adjacency demands constant care.

## SBL-7 · Template-runner's phone companion
- **Pitch:** Ingests a known program template (SBS Hypertrophy, 5/3/1, nSuns), does phone-native logging + rest timer, auto-tallies volume and autoregulates from RIR — replacing the spreadsheet stitch.
- **Origin:** segment-first + toolchain-gap.
- **Segment:** the LiftVault/SBS-spreadsheet crowd.
- **Weakness exploited:** spreadsheets have the logic but no phone-native logging; RP has the app but locks you to RP's method.
- **Evidence:** [A] directional volume; [C] autoregulation heuristics — implement without overclaiming.
- **Technical challenge:** a template DSL/importer that maps arbitrary community spreadsheets into a logging engine.
- **Why now:** —
- **v1:** 2–3 built-in templates, logging, volume tally. Cut: arbitrary spreadsheet import (hard).
- **Copyability:** Boostcamp is close (hosts programs); differentiation is volume-honesty + being method-agnostic + cheap.
- **Ethical risk:** low.
- **Failure mode:** competes with Boostcamp/RP on their turf; template ingestion is deceptively large scope for 2–3 months.

## SBL-8 · The evidence layer
- **Pitch:** Every recommendation the app makes is tap-to-source: "deload suggested — here's the [C] evidence and the one RCT against it." A tracker whose differentiator is showing its own evidence grades.
- **Origin:** constraint-as-feature (the audience's literacy becomes the UI).
- **Segment:** MASS subscribers / the most literature-driven tier.
- **Weakness exploited:** incumbents present heuristics as fact; this audience distrusts that.
- **Evidence:** meta — it's a transparency layer over whatever features ship.
- **Technical challenge:** a maintained claim→evidence-grade mapping; low CS-difficulty, high content-maintenance cost.
- **Why now:** —
- **v1:** evidence tags on each recommendation. Cut: standalone — it's a layer.
- **Copyability:** easy to copy, but culturally off-brand for incumbents who don't want to show their [C]s.
- **Ethical risk:** low (arguably risk-reducing).
- **Failure mode:** a feature/brand principle, not a product — belongs *inside* SBL-2/SBL-6, and probably should.

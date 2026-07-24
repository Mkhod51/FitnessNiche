# Phase 3 Feature Brainstorm — Building the Thesis Well, and Against Its Own Weaknesses

Grounded in `findings.md`. These are not new product candidates; they are ways *this specific thesis* is built well or hedged against the weaknesses Wave 1 surfaced. Each feature names the finding/risk it addresses, so nothing here is justified by "users would like it."

Weakness map (from findings.md / wave1-d):
- **W1** Naive citation launders weak evidence (§2, D1)
- **W2** Cherry-picking / hidden dissent (D2)
- **W3** Overconfidence inheritance — the app out-confidents what it critiques (§3, D3)
- **W4** Stale citations (D4)
- **W5** False precision from figures (§2 measurement error, D6)
- **W6** Nuance degrades under UI constraints → unusable or wishy-washy (§4)
- **W7** Curation labour is the real, ongoing cost (§5)
- **W8** Market risk: honest grading may not be a product people enjoy using (§3, §6)
- **W9** Copyright on figures (§5)

---

## A. The evidence-grade primitive  ▸ W1, W3
Every claim in the app renders as a unit: **claim · confidence grade ([A]–[D]) · one-tap source.** The grade is not optional metadata — it is as visually prominent as the claim, using the same [A]/[B]/[C]/[D] scale this whole project has used. A bare citation without a grade is *impossible to display* by construction. This is the single most important feature; it is what converts the thesis from "cites studies" to "grades evidence honestly." Directly neutralises the laundering risk: you cannot show a citation while hiding that it's n=20 untrained.

## B. Settled vs contested, shown visually  ▸ W2, W3, W8
A binary the audience actually respects: claims are marked **Settled** (e.g. frequency-at-equated-volume [A]) or **Contested** (e.g. lengthened partials — Wolf 2023 vs 2025). Contested claims render both/all sides with their studies, not one. This makes cherry-picking structurally hard and turns the field's genuine disagreements into a feature rather than something to paper over. It's also the honest de-mythologiser: the leucine-threshold card is visibly Contested/[C], not a confident directive.

## C. Progressive disclosure: decisive default, depth on demand  ▸ W6
The resolution to "does nuance survive the UI." Three layers:
1. **Default:** a clear, actionable recommendation with a visible confidence chip ("Aim ~10–20 sets/wk · direction well-supported").
2. **Tap once — "why":** the reasoning and the grade in a sentence.
3. **Tap twice — "show me":** the studies, re-plotted figures, sample sizes, dissent.
Advice stays decisive (not wishy-washy); honesty is one tap away, never blocking the action. This is the design bet the whole thesis rests on — if this interaction doesn't work, the thesis is compromised (findings §4).

## D. "Show me the study" as re-plotted data, not embedded images  ▸ W5, W9
The figures layer surfaces the *extracted numbers* (effect size, n, duration, population, CI) re-plotted in the app's own chart style — never the publisher's figure image (copyright, §5). Two birds: legally safe (facts aren't copyrightable) and it forces honest presentation — showing n=17 and a wide CI next to the effect is itself the nuance. Every figure card carries population (trained/untrained) and sample size as first-class fields, because Stream B showed those are the facts that matter most and are usually buried.

## E. The confidence chip does double duty as a false-precision guard  ▸ W5
Where the app shows a personal number (e1RM, a macro target), it carries the same confidence treatment: a band, not a point, when the evidence or measurement warrants (ties to the e1RM noise-floor discipline in `00-meta/decision-log.md`). Consistency: the app never shows a decimal it can't defend, whether the source is a study or the user's own noisy data.

## F. Supersession / "last reviewed" mechanism  ▸ W4, W7
Each claim carries a **last-reviewed date** and a lightweight supersession link (claim → superseded-by). New meta-analysis lands, the old claim is visibly dated and flagged. Turns W4 (stale citations) from a silent failure into a visible, honest state, and makes the maintenance burden (W7) legible rather than hidden. Cheap version for v1: just the date + a manual "review queue" the builder works; no automation needed.

## G. Scope the claim set brutally — the "50 claims that matter"  ▸ W7
Structural, not a UI feature: v1 curates ~50 high-leverage claims (the questions science-based lifters actually argue about — volume, frequency, failure proximity, protein dose, timing, bulk rate, ROM), graded properly, rather than 500 shallow ones. Depth over breadth is the honest and the feasible choice (§5). The curated set *is* the moat; treat its quality as the product.

## H. "Steelman the other side" on every contested claim  ▸ W2, W8
For Contested claims, the app explicitly presents the strongest version of the view it *doesn't* default to. Directly anti-cherry-pick, and it's the feature most aligned with the audience's self-image (they pride themselves on evidence literacy). Low build cost (it's content), high trust dividend. Risk: doubles curation labour on contested items (W7) — acceptable because contested items are the minority.

## I. Confidence-calibrated language, enforced  ▸ W3, W6
A controlled vocabulary maps grade → phrasing: [A] "well-supported," [B] "supported," [C] "suggested, limited evidence," [D] "anecdotal." The app is *incapable* of saying "studies prove" for a [C] claim — the phrasing is generated from the grade, not hand-written. Kills overconfidence inheritance at the language layer, and keeps hedging bounded (not every sentence drowning in caveats — one calibrated verb).

## J. "What would change this" per claim  ▸ W3, W8
Each claim can show what evidence would move its grade ("a well-powered trained-population RCT on per-meal timing would upgrade this from [C]"). Models good epistemics, sets user expectations that grades *move*, and pre-empts the "you said [C] but new study X" complaint. Nice-to-have, not v1-critical.

## K. Decouple advice from tracking — advice is a lens on logged data  ▸ W8, ties the two halves
The reconciliation engine from Phase 2 (cut/bulk vs training performance) becomes the place citations live: when the app says "your strength is holding through this deficit — consistent with strength being robust to moderate deficits [A/B]," the citation is *earned by the user's own data*, not a generic fact sheet. This is the answer to "is it more than a fact database bolted to a tracker" — the evidence is contextual to what the user logged. Strongest integration of the citation thesis with the Phase 2 product.

## L. Explicitly label the app's own confidence in *itself*  ▸ W8, honesty-as-brand
An onboarding/about stance that says plainly: "science-based lifting is more equivocal than the content around it implies; this app shows you that, including where your favourite protocols are weakly evidenced." Sets the contract up front so the de-mythologising reads as the promise being kept, not the app being negative. Pure positioning, zero build cost, defuses W8 partially by self-selecting the audience that wants it.

---

## Prioritisation

**Must-have for v1 (the thesis is dishonest or pointless without these):**
- **A** evidence-grade primitive — the thesis itself
- **C** progressive disclosure — the only way nuance survives the UI
- **I** confidence-calibrated language — cheap, kills overconfidence at the language layer
- **B** settled vs contested — makes cherry-picking structurally hard
- **G** brutal scope (~50 claims) — the feasibility and quality bet
- **D** re-plotted figures with n + population — legal + honest, and it's the "figures on request" promise

**High-value, low-cost, include if time:**
- **L** self-labelling stance (zero build), **H** steelman on contested claims, **E** false-precision guard on personal numbers, **K** citations earned by the user's own data (the strongest integration, but more build)

**Defer past v1:**
- **F** supersession mechanism (ship the date field; automate later), **J** "what would change this"

**The one that matters most:** **A + C together.** A makes the thesis honest; C makes it usable. Everything else is reinforcement. If the build can only prove one thing in a demo, it's that a confidence-graded claim with decisive-default + depth-on-demand is both honest *and* pleasant to use — because that single interaction is the entire thesis standing up or falling over.

# Phase 3 Findings — The Evidence-Cited Coaching Thesis

Architect's synthesis of Wave 1 (Streams A–D). Not delegated. This is where the phase's value lives.

**The thesis under test:** a combined training + nutrition tracker whose differentiators are (1) advice grounded in specific cited studies, figures available on request, and (2) nuance — presenting the range and confidence of evidence rather than confident directives.

Sources: `04-sources/raw-notes/phase3-a-landscape.md` (market), `04-sources/raw-notes/phase3-b-literature.md` (evidence base), `01-research/technical/citation-infrastructure.md` (feasibility), `03-thesis-review/wave1-d-credibility-risk.md` (risk).
Evidence tags: [A] meta/replicated-RCT · [B] single good study/consistent obs · [C] mechanistic/small-n/consensus · [D] industry/anecdote.

---

## 1. Does the differentiator hold? (market) — YES, the in-app slot is empty

Stream A is clean on this. Real, specific, non-decorative citation exists in the space — MASS Research Review, Examine.com, Helms/3DMJ, Menno Henselmans, Stronger By Science — but **every citation-rich product is separate *content* (newsletter, database, PDF, video), never attached to in-app tracking** [B/C]. The closest partial case is MacroFactor (researcher-built, citation-dense public writing), but nobody could confirm its in-app coaching modules actually display citations — flagged unverified.

So "citation-grounded, figure-level advice *inside* the logger, at the point of decision" is genuinely unoccupied. That is a real structural gap, and it is the *good* half of the thesis.

**But** the gap has a reason to exist that isn't just "nobody thought of it": the citation-rich players deliberately keep evidence in a content layer *because that's where nuance fits* and because grading is expensive human labour (Streams C, D). The slot may be empty partly because it's hard and low-margin, not only because it's novel. Copyability note: MacroFactor could occupy it faster than anyone — it already has the researcher credibility and the tracker; it just hasn't chosen to. This is the standing competitive risk, unchanged from Phase 2.

## 2. Is the evidence base strong enough to support the promise? — MOSTLY NO, and this is the pivotal finding

This determines whether the app's core promise is honest or is itself the kind of marketing claim it's positioning against. Stream B is unambiguous: **most of "science-based lifting" is not settled by evidence strong enough to cite with confidence.**

| Topic | Evidence reality (Stream B) | Grade | Citable as "settled"? |
|---|---|---|---|
| Training frequency (at equated volume) | Schoenfeld/Grgic/Krieger 2019, 25 studies, well-replicated: doesn't matter once volume equated | [A] | Yes |
| Rest intervals | Grgic 2017 + 2024 Bayesian meta, trained/untrained split noted | [A/B] | Yes, with caveat |
| Volume dose-response (direction) | Pelland 2025, 67 studies/2,058 ppl — largest literature; more→more, plateauing | [A] directional | Direction yes; the "12–20 sets" number is a population curve, not a personal landmark |
| Proximity to failure / RIR | Consistent but measurement-limited | [B] | Directionally |
| Protein total daily dose | Well-supported (~1.6 g/kg) | [A/B] | Yes |
| **Protein per-meal / leucine threshold** | Outcome meta (23 studies/525) finds **no** significant hypertrophy effect of distribution; the "20–25 g / 0.4 g/kg / every 3–4 h" rule traces to **acute MPS assays**, not chronic trials | **[C] sold as [A]** | **No — flagship example of consensus outrunning evidence** |
| Periodization (hypertrophy benefit) | ACSM 2026 overview-of-reviews: benefit "could not be determined" | [C] | No |
| Lean-bulk / surplus rate | Helms 2023 trained RCT n=17 after COVID dropout; Garthe 2013 the only other trial; **no meta-analysis exists** | [C] | No |
| Lengthened partials / ROM | Wolf 2023 (pro) **reversed by Wolf's own 2025** 15-site pre-registered trained replication | [B] contested | No — actively unsettled |

Three cross-cutting facts make this worse for a "show the figures" product:
- **Sample sizes are n=10–40/arm, 5–16 weeks, mostly untrained.** ACSM 2026 admits a prior guideline rested on "3 studies, n=59 total." Trained-population evidence — the population that *buys this app* — is the thinnest slice.
- **Measurement error rivals the signal:** ultrasound muscle-thickness CV ~6.5%, often as large as the hypertrophy detected in short trials. Point estimates are shakier than their decimal places imply.
- **Acute ≠ chronic:** MPS (used to justify several nutrition-timing claims) does not correlate with 16-week hypertrophy in the same subjects (Mitchell 2014). A whole class of "science-based" nutrition advice is built on a surrogate that doesn't predict the outcome.

**The inescapable consequence:** if you cite studies, you will often be citing an n=20, 8-week, untrained study — and a bare citation makes it *look* settled (Stream D, the trust-amplification effect). **Naive citation, on this literature, is not more honest than the confident-directive ecosystem — it is a more authoritative-looking way to launder weak evidence.** The promise "we back our advice with the studies" is only honest if it becomes "we back our advice with the studies *and their grade and their dissent*."

This is not a reason to kill the thesis. It is the reason the two differentiators are actually one.

## 3. The two differentiators are a feature and its safety system (not two features)

Stream D established, and Stream B confirms with force: **nuance is the mandatory mitigation for the risks the citation feature creates** (laundering weak evidence D1, cherry-picking D2, inheriting overconfidence D3 — all High). Now Stream B shows *why it's mandatory and not optional*: the evidence base is genuinely equivocal, so a nuanced, confidence-graded representation is **the accurate one**. Confident citation would be a factual misrepresentation of the state of the field.

So the reframe that drives the whole review:
- The thesis is **not** "citations + nuance, two nice differentiators."
- The thesis is **"honest evidence grading, of which the citation is the receipt and the nuance is the honest reading."** Ship the citation without the grading/dissent and the product is *worse* than a plain tracker — maximally authoritative-looking, confidently wrong, to an audience that trusts citations as proof.

The corollary is a genuine market risk, not just a design one: **an honest app must sometimes tell science-based lifters their cherished protocols rest on n=20 untrained studies.** (Phase 2 already found this for individualized MEV/MRV; Stream B generalises it — leucine timing, mandatory periodization, "lean-bulk at X kcal.") The differentiator *is* the de-mythologising, and it's an open question whether the audience wants their dogma graded [C] to their face. This audience is the most likely of any to *respect* it — but respecting honesty and enjoying being corrected are different things, and retention lives in the gap.

## 4. Does nuance survive contact with a product UI?

Partially, and only with deliberate design — this is the thesis's real feasibility risk, above the technical one.

- **Against it:** hedged, "it depends," confidence-graded advice is harder to render and less satisfying than a directive. "Do 3×10" fits a card; "the direction is supported [A] but your personal optimum isn't identifiable and here are two dissenting labs" fights the format. A user mid-workout wants an answer, not a seminar. Nuance that degrades into wishy-washiness is a worse product than honest confidence.
- **For it, if designed right:** nuance can be *progressive disclosure* rather than *permanent hedging* — a clear default recommendation carrying a visible confidence grade, with "why / show me" as an optional depth layer. The advice stays actionable; the honesty is one tap away, not blocking the action. This is the design bet the whole thesis rests on, and it's addressed head-on in `feature-brainstorm.md`.
- **Verdict:** nuance survives the UI **only** if implemented as confidence-graded-but-still-decisive, with citations and dissent on demand rather than by default. If the team can't design that, the thesis is compromised (not merely softened) — because the alternative (nuance by default) is unusable and the other alternative (citations without nuance) is dishonest per §2–3.

## 5. Feasibility for a solo dev in 2–3 months

Technically yes; the constraint is human labour, not infrastructure (Stream C).

- **Infrastructure is a solved problem:** OpenAlex (CC0 metadata + abstracts + citation graph) as backbone, Europe PMC for OA full text, CrossRef for DOI resolution. No licensing wall on metadata.
- **Copyright is navigable but shapes the design:** extracted numbers/effect sizes/p-values are **not copyrightable** (safe to re-plot); short attributed quotes are OK under UK fair dealing; **reproducing a figure image is high-risk → the app must re-plot the numbers in its own style.** Bulk-ingesting a whole proprietary table risks the UK database right. "Show me the figures" is legal *as re-plotted data*, not as embedded source images — a real design constraint, not a blocker.
- **The real cost is curation:** a 50–150-claim "claim → citation → figures → grade" DB is solo-feasible in the window (~50–75 hrs of read-extract-grade), **but that labour is irreducible and is also the permanent maintenance burden** (new meta-analyses supersede old; retractions). The app's moat *is* this curation, which means the app's ongoing cost is also this curation. For a portfolio v1 this is fine (scope to ~50 high-value claims); as a living product it's a standing content-operations commitment a solo dev may not sustain — the same reason the citation-rich incumbents keep evidence in a slow content layer.

## 6. Synthesis verdict (feeds review.md)

The idea **holds, but only in one specific form.** The market gap is real (§1). The evidence base is too weak to support *naive* citation (§2), which means the citation and the nuance are not two features but a feature and its required safety system (§3) — and that same weak evidence base is precisely what makes the nuanced version the *honest and accurate* one, i.e. the moat. It survives the UI only as confidence-graded-but-decisive advice with citations on demand (§4), and it's solo-feasible only if scoped to a small curated claim set whose grading labour the builder accepts as the real product (§5).

Reframed thesis to carry forward: **not "the app that cites studies," but "the app that grades the evidence honestly — including grading the sacred cows [C] — with the citation as the receipt."** The differentiator is intellectual honesty operationalised, aimed at the one audience equipped to value it. The single biggest live risk is not technical and not competitive; it is whether honest grading is a product people sustain using once it starts telling them their protocols are less proven than their favourite YouTuber implied.

# Phase 3 Review — The Evidence-Cited Coaching Thesis

The deliverable. Direct, not diplomatic. Draws on `findings.md`, `feature-brainstorm.md`, and the Wave 1 streams. Argues against the idea before endorsing any part of it.

---

## 1. Verdict

**The idea holds — but not in the form it was proposed, and its strength comes from a fact that first looks like a fatal flaw.** "Cite studies to back advice" and "be nuanced" are not two differentiators; they are one feature and its mandatory safety system. The reason is Stream B: most of "science-based lifting" rests on small-n, short, untrained-subject studies, with flagship claims (per-meal protein/leucine timing, mandatory periodization, optimal lean-bulk rate) far weaker than the content ecosystem implies. On that literature, a *bare* citation is not more honest than a confident YouTuber — it is a more authoritative-looking way to launder weak evidence, because users read "citation" as "proven." So the honest product is not "the app that cites studies" but **"the app that grades the evidence honestly — including grading the sacred cows [C] — with the citation as the receipt and the nuance as the accurate reading."** In that form the market slot is genuinely empty (every citation-rich competitor keeps evidence in a separate content layer, never in-app at the point of decision), it is solo-feasible if scoped to ~50 curated claims, and it is aimed at the one audience equipped to value intellectual honesty. Endorsed, conditionally, with eyes open about the one risk that isn't technical.

## 2. Strengths (what's genuinely good)

- **The market gap is real and specific.** No one attaches real, graded citations to in-app tracking at the point of decision (Stream A). The citation-rich players (MASS, Examine, Helms, Menno) are all *content*, not trackers. That is a structural, verified opening, not a vibe.
- **The weakness of the evidence base is, counter-intuitively, the moat.** Because the science is equivocal, the honest nuanced representation is the *accurate* one. An app that shows confidence grades and dissent isn't being cautious — it's being correct where the whole content ecosystem is being confidently wrong. That's a differentiator competitors with a confident brand (RP) structurally cannot copy without contradicting their own marketing.
- **It targets the one audience that rewards this.** Science-based lifters self-identify on evidence literacy; MASS subscribers pay $29/mo for graded literature summaries with no tracking attached (Stream A). Demonstrated willingness to pay for exactly the honest-grading value, unbundled.
- **Feasibility is real.** OpenAlex (CC0) + Europe PMC + CrossRef solve the infrastructure; extracted numbers are not copyrightable; a ~50-claim curated DB fits a 2–3 month window (Stream C). Nothing here is a research project pretending to be a feature.
- **The interview story is excellent and honest.** "I found the evidence base my own audience worships is mostly n=20 untrained studies, so I built the product to grade its own claims — including the popular ones — rather than launder them behind citations." That is a judgment-and-epistemics story, not a CRUD story.

## 3. Concerns (specific, ranked)

1. **The honest-grading product may not be a product people enjoy using (highest concern, and it's not technical).** An app that tells science-based lifters their cherished leucine-timing and periodization protocols are [C]/contested is doing de-mythologising, and respecting honesty is not the same as enjoying being corrected mid-workout. Phase 2 already found this for individualized MEV/MRV; Stream B generalises it across the flagship claims. Retention lives in the gap between "I respect this" and "I want to open this daily." **No evidence was found either way** on whether this audience sustains use of a tool that punctures its dogma — it's the single biggest unknown and it's a demand risk, not a build risk.
2. **Nuance can degrade into unusable hedging.** "It depends, [C], two labs disagree" is a worse product than honest confidence if it blocks the action. The thesis *only* survives the UI as progressive disclosure — decisive default + confidence chip, with citations/dissent one tap deep (feature C). If that interaction can't be made to feel decisive-yet-honest, the thesis is compromised, not merely softened, because the two fallbacks (nuance-by-default = unusable; citations-without-nuance = dishonest) are both failures.
3. **Curation is a permanent content-operations commitment, and solo devs don't sustain those.** The ~50-claim DB is buildable once; keeping it current as meta-analyses supersede and papers retract is irreducible human labour (Stream C). This is *exactly why* the citation-rich incumbents keep evidence in a slow content layer and haven't shipped it in-app. The moat and the ongoing cost are the same thing. Fine for a portfolio v1; a real liability for a living product run by one person.
4. **MacroFactor is the one competitor that could occupy this slot fast.** Researcher-built, already trusted, already a tracker, already writing citation-dense public content. It hasn't chosen to put citations in-app — but it's the closest and the most credible threat if the idea proves out. The defensibility is "they haven't," not "they can't."
5. **Copyright shapes the figures feature.** "Show me the figures" is legal only as *re-plotted extracted data*, never embedded source images, and bulk-ingesting proprietary tables risks the UK database right (Stream C). Navigable, but it constrains the build and needs real legal review before any commercial launch.

## 4. Suggested improvements (from the brainstorm, prioritised)

**Must-have — the thesis is dishonest or pointless without these:**
- **(A) Evidence-grade primitive:** every claim renders as claim · grade · one-tap source; a citation without a visible grade is impossible by construction. *This is the thesis.*
- **(C) Progressive disclosure:** decisive default + confidence chip → "why" → "show me." *This is what makes nuance usable.*
- **(I) Confidence-calibrated language:** phrasing generated from the grade, so the app *cannot* say "proven" for a [C] claim.
- **(B) Settled vs contested, shown visually**, with both sides on contested claims.
- **(D) Figures as re-plotted data** carrying sample size and trained/untrained population as first-class fields.
- **(G) Brutally scoped ~50-claim set** — depth over breadth is both the honest and the feasible choice.

**High-value, low-cost:** (L) an up-front stance that the app will show where your protocols are weakly evidenced (defuses concern #1 by self-selecting the audience); (H) steelman the non-default side of contested claims; (K) let citations be *earned by the user's own logged data* rather than generic facts — the strongest tie to the Phase 2 reconciliation product and the answer to "is this more than a fact-sheet bolted to a tracker."

**Defer:** supersession automation (ship the date field, curate manually); "what would change this grade."

**The demo that proves the thesis:** a single confidence-graded claim with decisive-default and depth-on-demand (A + C). If that one interaction feels both honest and pleasant, the thesis stands; if it feels like a lecture, it doesn't.

## 5. What would need to be true

**For it to FAIL:**
- Science-based lifters don't actually want their dogma graded — they want confident, evidence-*flavoured* direction, and churn when told their protocols are [C]. (The demand risk, concern #1 — the most likely killer.)
- Nuance can't be made decisive in the UI, so the app reads as wishy-washy or as a lecture.
- The solo dev can't sustain curation, the claim set goes stale, and stale-citation-with-authority (D4) makes it worse than a plain tracker.
- MacroFactor (or another trusted researcher-built tracker) ships in-app citations first and better-resourced.

**For it to SUCCEED:**
- The target audience's evidence-literacy is real enough that honest grading reads as respect, not negativity — and a self-selecting up-front stance (feature L) recruits exactly those users.
- The A+C interaction genuinely feels decisive-yet-honest (a design problem the builder can actually solve and demo).
- The claim set stays small, deep, and current — treated as the product, not a side asset.
- The citations attach to the user's *own* logged data (feature K), making the evidence contextual and the product more than a fact database.

## 6. Would I build it?

Yes — as a portfolio piece, it's the strongest concept this project has produced, because its differentiator is intellectual honesty operationalised and its interview story is about judgment under weak evidence, which is rare and impressive. I would build the reframed version (honest grading, citation-as-receipt), scope it to ~50 claims, prove the A+C interaction first, and attach citations to the Phase 2 reconciliation engine so the evidence is earned by the user's data. I would go in clear-eyed that the biggest risk is not the code and not the competition — it's whether de-mythologising is a thing people sustain using. For a portfolio project that risk is acceptable (a compelling demo doesn't require proven retention); for a business it's the thing I'd validate before anything else, by putting graded sacred-cow claims in front of the actual audience and watching whether they lean in or bounce.

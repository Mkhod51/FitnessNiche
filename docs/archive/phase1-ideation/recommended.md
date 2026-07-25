# Recommended: Verdict

**One sentence:** A combined lift-and-food logger whose entire identity is one honest, evidence-bounded read — reconciling your bodyweight trend against your strength trend to tell you whether your plan is working, why, and what to change.

## What it is

The user logs workouts (sets × reps × load), bodyweight, and meals — meals by tiers/quick-add by default, per the [A/B] retention evidence, with gram precision as optional depth. The app computes two trend lines: smoothed bodyweight and estimated-1RM per main lift. The verdict engine classifies the joint state:

| Weight trend | e1RM trend | Verdict |
|---|---|---|
| Down (within cap) | Up / flat | Recomp working / cut is safe — hold course |
| Down fast | Down | Deficit too aggressive — eat more (the rare, real "eat more" case) |
| Flat / up | Flat over weeks | This is a programming problem, not a food problem — change your training |
| Up (lean-bulk band) | Up | Bulk on track |

Plus the protein layer: training-day compliance against ~1.6 g/kg ([A], the legitimate residue of protein-timing after Stream B killed the myth). Plus the weekly Coach Read: one page, one instruction. Hevy/Strong CSV import gives a verdict on day one instead of week six.

All Stream D architecture inherited: hard calorie floor and ≤500 kcal deficit cap enforced in code, maintenance default, numbers-hidden mode, performance framing, on-device-first data, signposting not screening.

## Why this one — full reasoning

1. **It is the only candidate that embodies the surviving integration thesis.** Stream B, adversarial and on the expensive model, killed four of five integration claims and left exactly one: the recomposition reconciliation. Verdict is that survivor built as a product. Every other combined-app concept either ignores the premise test or fails it.
2. **Every load-bearing feature sits on [A] or [A/B] evidence.** Recomp physiology (Murphy & Koehler 2022), approximate-logging retention (5 RCTs), protein daily-total dominance (Schoenfeld/Aragon/Krieger). Nothing in the core rests on [C]/[D]. Few incumbent features can say that.
3. **The differentiation is structural, verified across streams.** Nutrition incumbents cannot see lifts; training incumbents cannot see intake or weight trend; Stream A confirmed no incumbent has re-architected to hold both, and each has business-model reasons not to. The computation is copyable in a day — the *data position* is not.
4. **The restraint is the interview story.** "I researched five integration features, the evidence killed four, and I built the one that survived — and here's why shipping the RED-S detector everyone asks for would have been both statistically dishonest and a regulated medical device" sustains 30 minutes by itself. Add: e1RM estimation and trend-smoothing over noisy data, offline-first append-log sync with last-write-wins (and why not CRDTs), the layered open food-data stack (OFF + CoFID + FDC), ED-safe architecture as code not settings, GDPR-by-on-device-design.
5. **Three other candidates independently collapsed into it** (Plateau Judge, Training-Day Protein, Coach Read) — the evidence base regenerates this product shape from multiple starting points.
6. **Would I build it myself? Yes** — with one condition: ship the CSV import in week one of development, not last, because the cold-start problem (below) is the thing most likely to kill it, and import converts the two-app incumbency from an obstacle into an onboarding funnel.

## The strongest case against

Three honest attacks, in descending severity:

1. **The payoff latency problem.** The verdict needs 4–6 weeks of consistent logging before it can say anything a user trusts — and Stream D says ~70% of tracker users churn inside two weeks. The product's core value arrives after the median user has already left. CSV import mitigates this for the two-app switchers who have history; it does nothing for tracker-newbies, who may experience Verdict as "a quieter MyFitnessPal" for a month and quit. This is the failure mode I'd bet on if it fails. The counter: the target user (lifters running structured programs) is precisely the population with above-baseline logging persistence — but that's [C]-grade hope, not evidence.
2. **MacroFactor is one team decision away.** Their audience (Stronger by Science readers) lifts; their brand is evidence-based; a lift logger + this exact chart is inside their competence. If they ship it, Verdict's differentiation evaporates overnight. The counter: a portfolio project doesn't need to survive MacroFactor commercially — it needs demonstrable users and defensible engineering. But say this plainly in the interview rather than getting caught claiming an unassailable moat.
3. **"It's a chart."** Stream B's own caveat: the reconciliation is a visualization plus a rules engine, approximable by a motivated user eyeballing two apps. The counter is adherence evidence (one app, one habit) and legibility (users demonstrably fail to make this read across two apps — it's the single most-asked plateau question on r/fitness). But if an interviewer pushes "where's the hard CS?", the honest answer lives in the trend estimation, the sync layer, and the data pipeline — not the verdict rules.

## The explicit flip condition

Ranking tiebreaker #2 was builder-segment fit, resolved on an assumption: the developer lifts but is not plant-based. **If the developer is plant-based, build Leucine Ledger instead** — its moat is deeper (a data layer incumbents' schemas can't hold), its interview story is at least as good (entity resolution across open nutrition datasets), and builder-community membership de-risks its biggest weakness (serving a community you don't belong to). This is a genuine 4.40-vs-4.25 coin flip that personal fit should settle, and the repo should record that honestly rather than pretend the arithmetic decided it.

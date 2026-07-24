# Recommended (Phase 2): The Cut Reconciler — SBL-2 core, shipped in SBL-6's bounded frame

**One sentence:** A science-based cut companion for the RP-and-MacroFactor crowd that does the one thing neither tool can — reconcile your weight/intake trend against your actual training performance to tell you, honestly and with its uncertainty shown, whether your cut is working or eating your gains — and is designed to be finished at maintenance, not used forever.

This fuses the ranking's top two: **SBL-2's reconciliation engine** (the defensible integration gap) delivered in **SBL-6's bounded-duration frame** (the incumbent-proof moat), with **SBL-4's honest e1RM** as the engine, **SBL-1's refuse-to-fake-MRV** as the brand, and **SBL-8's evidence tags** on every recommendation.

## Why this, for this niche

1. **It targets the one job that structurally requires both halves.** MacroFactor adjusts calories from weight-trend alone and cannot see whether your strength or volume tolerance is falling in the deficit; RP/Hevy see training and not intake. The reconciliation is currently done in the user's head, across two subscriptions they already pay for (~$30–45/mo combined). That is measured willingness-to-pay for the exact seam this product fills.
2. **Its load-bearing claims are [A]/[A/B].** Strength is robust to a moderate deficit while lean-mass accrual is not (Murphy & Koehler 2022); the e1RM trend is a usable signal within the RIR≤3 / ≤10-rep / regression constraints the research established. Nothing core rests on [C]. For the science-based audience, that is the price of entry, and most incumbents can't meet it.
3. **The honesty is the differentiation, and only this niche pays for it.** The app tracks volume against the *evidenced* ~10–20 sets/muscle range and refuses to invent the individualized MEV/MRV numbers RP sells for $25–35/mo; it shows e1RM as a trend-with-confidence-band, not a number; it tags a deload suggestion with "[C] consensus, and here's the RCT against it." To a general audience that's pedantic. To MASS subscribers and r/weightroom it's the reason to switch — and no incumbent can match it without repricing or embarrassing its own marketing.
4. **"Designed to end" is a moat a business cannot copy.** An incumbent optimizing for indefinite engagement will not ship a product that hands you a maintenance plan and tells you to stop. The retention evidence [A/B] (approximate-sustained beats precise-abandoned) says a bounded, lower-friction, finishable product is the evidence-aligned shape anyway.
5. **The interview story is unusually strong and honest.** "I quantified the measurement error on my own core signal, found it was borderline, and built the product to respect that limit rather than paper over it — including telling advanced users when their progress is below the noise floor." Plus: regression-based e1RM with confidence bands, RIR-quality filtering, the open-data UK food stack (OFF + CoFID + FDC), offline-first append-log sync, and a defensible cut/bulk reconciliation model. That is a 30-minute conversation about judgment, not just code.

## v1 scope (2–3 months)

Log lifts (Hevy CSV import for day-one history — the one import path that actually works free); log weight and intake (tier-based default); set a bounded cut with an evidence-capped rate; get a weekly reconciliation verdict — *hold / ease the deficit / you're done, here's maintenance* — built on the two trend signals with confidence shown. **Cut:** bulk mode (fast-follow), program templating (that's SBL-7's problem), any Strong/Boostcamp/RP import (unverified — Hevy only), social, wearables.

## The strongest case against

1. **MacroFactor is one team decision from erasing the differentiation.** Their audience lifts; their brand is evidence-based; a lift logger plus this reconciliation is inside their competence. **Counter:** the bounded "designed to end" frame is the part they *won't* copy (it fights their LTV), so shipping SBL-6's frame rather than SBL-2's always-on version is partly a deliberate retreat to the ground MacroFactor can't follow onto. A portfolio project also doesn't need to beat MacroFactor commercially — it needs to be defensible and demonstrable.
2. **Bounded engagement caps LTV.** For a business this is a real flaw; for a portfolio/interview piece it's irrelevant, and arguably a strength (it signals product judgment over engagement-farming). Named honestly so it isn't discovered in the interview.
3. **e1RM is wounded, not pristine.** The whole product leans on a signal that is only borderline-resolvable inside 4–8 weeks, and not resolvable at all for advanced lifters. **Counter:** this is confronted in-product (confidence bands, noise-floor honesty) rather than hidden — but if an interviewer presses "so your core signal is noisy?", the honest answer is "yes, and here's exactly how I bounded it and disclosed it," which is a better answer than a false claim of precision.
4. **ED-adjacency.** A "cut" product is closer to the ED line than a neutral tracker. **Counter:** the capped deficit, calorie floor, performance framing, numbers-hidden option, and bounded-then-maintenance exit are all in the required baseline — but this demands ongoing care and is a real reason the build must not cut safety corners.

## What would change my mind

- **If the two-app-stacking assumption is false** (few RP users also pay MacroFactor), the "measured WTP for the seam" argument weakens to inference — worth a direct r/weightroom/r/naturalbodybuilding check before committing (flagged in the research as unverified).
- **If Hevy CSV export turns out not to carry RIR** (only weight×reps), the RIR-quality filtering degrades on imported history — verify column contents before relying on it.
- **If a solo build of the reconciliation engine can't clear the "is this just two charts side by side?" bar** — the verdict logic has to earn its keep as more than visual overlay, or SBL-1 (the honest volume tracker) becomes the safer, cheaper pick.

## Would I build it myself?

Yes — as **SBL-6, the bounded cut companion**, not the always-on SBL-2. The bounded frame is where the moat, the evidence alignment, and the interview story all point the same direction, and it's the version MacroFactor structurally won't chase. Ship Hevy import in week one (the only verified cold-start path), keep the safety baseline non-negotiable, and let the honesty — shown uncertainty, refused fake precision, cited evidence grades — be the thing that makes the science-based audience choose it.

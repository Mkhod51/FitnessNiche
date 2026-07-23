# Carryover: Phase 1 → Phase 2

Written by the architect before any Phase 2 dispatch, after re-reading all nine Phase 1 artefacts. Purpose: separate what Phase 1 *established* from what it *asserted*, and name the assumption its candidate set was operating under without examining.

Evidence grades throughout: **[A]** meta-analysis / replicated RCT · **[B]** single good study or consistent observational · **[C]** mechanistic, small-n, or expert consensus · **[D]** industry / marketing / anecdote.

---

## 1. What Phase 1 established (survives scrutiny)

These are load-bearing and I am carrying them forward without re-litigation, though Wave 1 may deepen them.

| Finding | Grade | Confidence | Note |
|---|---|---|---|
| Approximate logging sustained beats precise logging abandoned — 5 RCTs, 4/5 equal weight outcomes, higher engagement in simplified arms | [A/B] | High | Phase 1's single strongest finding. It has *not* yet been allowed to shape the product concept, only the logging UI |
| Self-reported energy intake carries 12–54% error, systematically biased downward | [B] | High | Well quantified. The asymmetry it created is the subject of §2 |
| Total daily protein dominates; timing relative to session has no meaningful independent effect once total is adequate | [A] | High | Schoenfeld/Aragon/Krieger. Kills a whole feature class |
| Energy deficit impairs lean-mass accrual (ES −0.57) but not strength (ES −0.31, ns) | [A/B] | High | Murphy & Koehler 2022. The recomp read's physiological basis |
| Computed energy availability's error band exceeds the diagnostic thresholds it would distinguish | [B/C] | High | Kills RED-S detection on measurement grounds alone, before regulation |
| Disease detection/management (RED-S, CKD, T1D/T2D, in-app ED screening) = regulated medical device under MHRA/EU MDR | [B] | High | Hard scope fence. Re-verify precise boundary in Wave 1 Stream G |
| No incumbent holds strength logging and nutrition as co-equal first-class features | [C] | Medium-high | Consistent across sources but the *reason* was inferred, not sourced from company statements |
| MyFitnessPal's database rot is business-model lock-in (crowdsourcing adds but never prunes; PE ownership funds monetisation not curation) | [C] | Medium-high | Reasoning is sound; the PE-incentive link is [D] inference |
| Open UK data stack is viable and free: Open Food Facts + CoFID + USDA FDC; commercial APIs are US-gated or ToS-hostile at free tier | [B] | Medium-high | FatSecret free tier being US-only was a genuine find |
| ED harm reduction: soft warnings fail (read as motivating); only removed affordances work | [B/C] | Medium-high | Drove the hard-floor/deficit-cap architecture |
| Single-user multi-device sync needs append-log + LWW, not CRDTs | [C] | High | Correct engineering judgment |

## 2. What Phase 1 asserted but did not establish

These become Wave 1 research targets. Several are load-bearing for the Phase 1 recommendation, which means the recommendation is weaker than it presented itself as being.

**2.1 — The asymmetric evidentiary standard (most serious).**
Phase 1 demanded quantified measurement error from the nutrition side and produced it (intake 12–54%, expenditure 15–57%, and used exactly this to kill RED-S). It then declared estimated-1RM trend a *"high-adherence, low-error signal"* and built the entire recommendation on it — **without quantifying its error even once.** No study cited, no test-retest reliability, no coefficient of variation. e1RM is sensitive to rep range, proximity to failure, technique drift, exercise substitution, sleep, intra-session order, and formula choice (Epley vs Brzycki disagree materially at high reps). Phase 1 held one domain to a forensic standard and the other to none, then concluded the second domain was trustworthy. **Wave 1 Stream A must quantify this or the recommendation loses its foundation.**

**2.2 — "One app produces better adherence than two apps."**
This is the actual load-bearing claim of the entire project — Phase 1's own integration thesis concluded the combined-app premise survives *only* as an adherence/UX play, not a computational one. Zero evidence was produced that consolidating two logging tasks into one app improves adherence. It is intuitively plausible and completely unevidenced. If it is false, the project's premise fails a second time and there is no third fallback. → Stream C.

**2.3 — "CSV import solves the cold-start problem."**
Promoted in `decisions.md` §5.6 to a *survival requirement* on the strength of an assumption nobody checked: that Hevy and Strong export usable historical CSVs, with load/rep granularity, obtainable on the free tier. Never verified. If free-tier export doesn't exist or is lossy, the only identified mitigation for the payoff-latency failure mode evaporates. → Stream D.

**2.4 — "Users demonstrably fail to make the recomp read across two apps."**
Presented as the justification for the product's existence. Sourced from general forum impression, not from any systematic reading of the actual questions people ask. → Stream C / Stream E jobs-to-be-done.

**2.5 — Retention figures were [D].**
"~70% abandon within two weeks", "day-30 ~30–45%" came from industry blog aggregation, not primary sources. These numbers are doing real work in the argument (they generate the payoff-latency objection). They need primary sourcing. → Stream C.

**2.6 — Bodyweight trend treated as clean.**
Called a low-error signal without accounting for glycogen/water/sodium swings, menstrual-cycle fluctuation (which for half the potential user base can exceed the weekly signal being measured), or weigh-in-frequency effects on trend estimator quality. → Stream B.

**2.7 — Segment sizes were [D] guesses**, and the MacroFactor competitive threat was pure inference.

**2.8 — "The target user has above-baseline logging persistence."**
Phase 1 flagged this itself as [C]-grade hope. Carried forward as an open question, not a fact.

## 3. Where Phase 1 was too shallow

Phase 1 was scoped as a lean four-stream sprint, so these are scope consequences rather than errors — but they are large.

- **Exercise science was never a stream.** There was no examination of programming, autoregulation, fatigue modelling, dose-response, or proximity-to-failure. For an app whose central signal comes from training data, this is the biggest single gap.
- **Behaviour-change literature: absent.** Phase 1 had retention *statistics* but no habit formation, no self-monitoring theory, no gamification evidence, no motivation research. Given that Phase 1's own conclusion was "the moat is adherence," it never studied adherence.
- **Monetisation: not researched at all.** No pricing, no conversion, no willingness-to-pay by segment.
- **Failed products: not researched at all.** Nothing on apps that died and why.
- **Adjacent/non-obvious competitors: absent.** Whoop, Oura, Zoe, Levels, Renpho, and post-2024 AI-native entrants were never considered. Phase 1's "no incumbent does both" claim was tested only against the eight obvious apps.
- **Wearables and platform health APIs: absent.** HealthKit/Health Connect never mentioned despite being the obvious route to passive data.
- **Algorithms examined at name-level only.** "Adaptive TDEE" was referenced without examining Kalman filtering, EWMA, or energy-balance reconciliation, or their failure modes.
- **Jobs-to-be-done never asked.** Twelve candidates were designed without anyone asking what people actually hire these apps to do.
- **Segments: 6 considered, ~18 exist.**
- **Measurement validity covered on the nutrition side only** (see §2.1).

## 4. What all twelve Phase 1 candidates share — the unexamined frame

This is the section that matters. Twelve candidates that differ in segment, evidence base, and ambition still turn out to share a skeleton. Every one of them is:

**`user logs → app computes → app displays → user decides and acts`**

They differ only in *what is computed*, *for whom*, and *how precisely it is displayed*. Not one varies the shape of the interaction itself. Stated as assumptions the whole set inherited:

| # | Shared assumption | Never questioned by any of the 12 | What lies outside it |
|---|---|---|---|
| 1 | **The user's problem is informational** — they lack the right number, or the right read of their numbers | All 12 compete on computing a better answer | The problem may be behavioural, contextual, or motivational. Phase 1's own strongest evidence ([A/B] approximate-beats-precise) points this way and the candidate set ignored it |
| 2 | **Food logging exists** | Even Blind and Tiers only change granularity/display | Products that eliminate logging, infer it, log retrospectively, or log something else entirely as a proxy |
| 3 | **The user is a solo individual** | No household, coach, training partner, or family cook appears anywhere | Nutrition is largely a household activity; training is often dyadic. Coach-athlete and household-cook are unexplored surfaces |
| 4 | **The goal is body composition** | Recomp, cut, bulk, weight class, preserve LBM — all 12 | Performance-without-aesthetics, sport-specific fuelling, healthspan, injury resilience, or explicitly *disengaging* from body-composition goals |
| 5 | **Training data feeds nutrition decisions** | Direction is uniform across all 12: training log is the sensor, nutrition is the product | The inversion — nutrition state informing *training* decisions (autoregulate today's session down because you're underfuelled) — was never proposed once |
| 6 | **The app should be used forever** | All 12 assume indefinite engagement | A bounded-duration product designed to be *finished* and deleted. Directly implied by retention evidence, proposed by nobody |
| 7 | **Interaction is screen-and-session based** | All 12 are "an app you open" | Ambient, passive, conversational, or point-of-decision interventions (supermarket shelf, restaurant menu, mid-set) |
| 8 | **The context is UK/US, English, supermarket packaged food, commercial gym** | Uniform | Home training, non-Western food patterns, non-packaged whole-food diets, food-insecure or budget-constrained users |

**The blind spot, named:** *Phase 1 assumed the app's job is to know things.* Every candidate is an oracle — it ingests data, reasons well, and hands a verdict to a user who must then do all the work. The one thing Phase 1 proved most convincingly is that **users stop doing the work**. Twelve candidates competed on the quality of the verdict; none competed on the survival of the behaviour that produces it.

Phase 2's niche candidates should be generated substantially from *outside* this frame — products that act rather than advise, that log less rather than more, that serve a dyad rather than an individual, that run the causal arrow backwards, or that are designed to end.

## 5. Consequences for Phase 2 design

1. **Stream A must quantify e1RM error before the Phase 1 recommendation can be trusted.** If e1RM trend is materially noisier than assumed, `Verdict` degrades from "honest read on two reliable signals" to "a chart of two noisy signals" and must be re-ranked accordingly. Treat this as a potential premise-killer, not a detail.
2. **Stream C must test the one-app-adherence claim.** It is the project's last remaining premise after Phase 1 killed the computational one.
3. **Stream E must go wide on segments** because §4 shows the candidate set was constrained by frame, not by option space.
4. **Wave 3 ideation must explicitly generate against §4's eight assumptions.** Any Phase 2 candidate that fits the `log → compute → display` skeleton is competing with Phase 1's twelve, not extending them.
5. **The Phase 1 recommendation (`Verdict`) enters Phase 2 as a candidate, not as the incumbent.** It is re-ranked against the new set on equal terms, with its unverified foundation (§2.1, §2.2, §2.3) priced in.

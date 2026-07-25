# Science-Based Training Evidence: How Noisy Is e1RM Trend, Really?

Closes the asymmetry left by the prior nutrition-error phase: that phase forensically quantified intake-tracking error but simply *asserted* e1RM/bodyweight trend as "the two reliable signals." This doc tests that assertion.

---

## PRIMARY QUESTION: e1RM trend noise, quantified

### 1. Direct 1RM test-retest reliability [A]
- Systematic review, 32 studies, n=1,595 (Grgic et al. 2020, *Sports Med Open*): ICC range 0.64–0.99 (median 0.97); **CV range 0.5–12.1%, median 4.2%**. Holds across trained/untrained, upper/lower body, sex, age. [PMC7367986]
- Consistent with a separate report of mean test-day differences of 0.6 to −1.3 kg, CV 2.3–8.3%.
- **Reading:** a single true-1RM test itself carries ~4% noise even under lab conditions with a spotter and standardized warm-up — before submaximal estimation or RIR error are added.

### 2. e1RM *predicted from submaximal sets* — the actually-relevant number [B]
This is what a logging app really computes (lifter reports a working set + RIR, not a true max). Two directly-relevant reliability studies:
- Squat/deadlift 2-point and multi-point submax methods (n-study, *PMC8898007*): CV 3.9–9.8% depending on the load pair used, categorized good (<5%) to poor (>10%). **Critically, ICC varies enormously by load pair**: deadlift 40–60% ICC=0.17 (unreliable), squat 60–80% ICC=0.48, vs. 40–90%/60–90% pairs reaching ICC 0.82–0.99. **Low-load-only submax estimates are close to useless for change detection; wide load spreads are much better.**
- Back squat submax load reliability (*PMC8123869*): CV 3.9–10.3%; velocity-based metrics ICC 0.65 (unacceptable), power metrics ICC 0.92 (acceptable).
- **Reading: realistic e1RM-from-a-working-set noise is CV ≈ 5–10%**, roughly double the "gold standard" true-1RM CV, and it is *very sensitive to which reps/loads the lifter happens to log that session* — a variable the app doesn't control.

### 3. Formula divergence by rep count [B]
- Epley/Brzycki/Lombardi agree within ~2–3% in the 2–6 rep range; **accuracy holds reasonably (~±5%) through about 10 reps; beyond 10 reps estimates commonly diverge ±15–20%** between formulas.
- All formulas assume the set was taken to true failure — any RIR > 0 means the "true" e1RM is *systematically* higher than the estimate, and the gap grows with rep count (a missed rep at RIR 2 on a 3-rep set is a smaller error than a misjudged RIR 2 on a 12-rep set).
- **Implication for app design:** e1RM computed from sets >10 reps is closer to decoration than data. A science-based app should either exclude high-rep sets from trend calculation or flag them as low-confidence.

### 4. Main perturbers, ranked by likely contribution to noise
| Perturber | Est. contribution | Grade |
|---|---|---|
| RIR misestimation | ±1 rep near failure, **>2 reps at RIR 7–10** (Remmert/Zourdos 2023) | [B] |
| Rep range used | negligible ≤10 reps, ±15–20% divergence >10 reps | [B] |
| Load-pair/rep spread used for submax estimate | ICC swings 0.17→0.99 depending on pair | [B] |
| Day-to-day biological variability (sleep, stress, glycogen, CNS fatigue) | folded into the 4–10% CV above | [B]/[C] |
| Exercise substitution (e.g. barbell↔machine) | not directly quantified; (inference) likely larger than all of the above combined, since load-velocity and strength curves differ by variation | (inference) |
| Technique/ROM drift, plate/collar rounding | small per-session, compounds over months | [C]/(inference) |

### 5. Decisive: is 4–8 week e1RM trend signal bigger than its own noise?
- Independent MDC (minimal detectable change) study: **squat MDC ≈ 10 kg, bench MDC ≈ 5.6 kg** for a *single* test-retest pair — i.e., a single before/after e1RM reading needs to move by that much before you can be confident it isn't noise.
- Realistic intermediate-lifter progress rate: **~0.5–2.5% of 1RM per month** on major lifts (widely cited coaching heuristic; no rigorous longitudinal RCT nails this number — grade [C]/(inference), but converges across multiple independent sources).
- **Worked example (100 kg squat, intermediate):** real strength gain over 4–8 weeks ≈ 0.5–5 kg. Single-test MDC ≈ 10 kg. **A single e1RM reading, or two widely-spaced readings, cannot distinguish 4–8 weeks of real intermediate progress from measurement noise.**
- **But** an app isn't limited to two data points — if the lifter logs e1RM every session (2–3×/week), a regression trendline across n≈8–24 points reduces the *effective* SEM of the trend by roughly √n vs. a single reading (CV 5–10% → trend SEM roughly 1–3.5% with n=8, better with more sessions and consistent load-pair selection). That trend-level SEM (~1–3.5% of 1RM, i.e. ~1–3.5 kg on a 100 kg squat) is now **comparable to, or smaller than**, the ~0.5–5 kg of real intermediate progress — signal and noise are roughly the same order of magnitude, not signal dominant.

**Verdict: the premise is *wounded, not killed*.** e1RM trend is a real, extractable signal **only if** (a) it's built from a many-point regression, not point-to-point comparisons, (b) submax sets are restricted to a consistent, wide-enough load spread (not just top-set-only, not >10 rep sets), and (c) the lifter is novice/intermediate where monthly signal is largest relative to noise. For advanced lifters (near the low end of that 0.5%/month range), even a well-built trendline may not resolve real progress from noise inside 4–8 weeks — the app should say so rather than imply false precision. No paper directly computes this trend-vs-noise ratio for a logging-app context; the above is a defensible back-of-envelope synthesis from the reliability + progress-rate literature, not a cited result — flagged as (inference).

---

## SECONDARY

### RIR estimation accuracy [B] — computable: yes (it's a logged input)
- Remmert/Zourdos 2023 (*PMC12360324*, *sagepub 00315125231169868*): accuracy is good near failure (**~1 rep error at true RIR 0–2**) and **degrades sharply farther out (>2 reps error at RIR 7–10)**. Training status and sex did not significantly change accuracy on machine exercises; proximity-to-failure and set number did.
- Practical read: an app that only trusts RIR-tagged sets taken at RIR ≤3 gets much better e1RM input quality than one that accepts RIR 5+ sets at face value. This is a concrete, buildable filtering rule.

### Volume landmarks (MEV/MV/MAV/MRV) [C/D] — computable: no (not measurable from logs; individually calibrated, moving targets)
- These are a **coaching heuristic/brand framework (Renaissance Periodization/Israetel)**, not a validated measurement construct. No cited study establishes population MEV/MAV/MRV thresholds directly — search results returned marketing/blog restatements, not primary validation.
- The one empirically-grounded piece adjacent to this — Schoenfeld 2017 dose-response meta-analysis (34 groups/15 studies) — supports a **directional** volume-hypertrophy relationship and a rough "~10 sets/week per muscle" threshold for *near-maximal group-average* hypertrophy [A for the directional claim], but that is a population regression slope, **not** an individualized MEV/MRV that can be detected in one lifter's data. Per-individual MRV in particular is asserted, not shown to be identifiable from training logs.
- **Flag: this is the clearest case in the niche where marketing confidence outruns the evidence grade.** [A]-level backing exists for "more sets → more growth, up to a point"; [C/D]-level (at best) backing exists for "your personal MEV is X sets, your MRV is Y sets, and you can locate them by adjusting weekly volume against subjective recovery markers."

### Volume–hypertrophy dose-response [A directional / C for cutpoints]
- Schoenfeld 2017: significant volume effect (p=0.002), ~0.37% hypertrophy increase per added weekly set, plateauing near 10 sets/week. [A]
- Newer 2025 meta-regression (sportrxiv/pubmed 41343037) refines volume+frequency effects — direction holds, exact numbers still shift study to study, meaning the "10-20 sets" heuristic is directionally right but the precise cutpoint is not settled. [B]

### Autoregulation (RPE/RIR, velocity-based) on consumer hardware [B for lab devices, C/D for phone-only]
- Best consumer-adjacent devices (GymAware, Vmaxpro, barbell-mounted Apple Watch) show acceptable validity for mean velocity; cheaper accelerometer/phone-camera options (Push, Flex) show poorer validity, especially at higher velocities. [B]
- A phone-camera-only, no-extra-hardware app (the realistic student-project constraint) has **no cited validation** in the search results — velocity-based autoregulation without a purpose-built sensor is unproven territory. (inference: likely degrades further than the worst devices tested, which were purpose-built transducers)
- RPE/RIR-based autoregulation is the cheaper, phone-native path but inherits the RIR accuracy ceiling above (±1 rep near failure, worse farther out).

### Deload necessity/timing [C]
- Coaching consensus: deload every 4–8 weeks; typical prescription 5–7 days every 4–6 weeks. [C, survey/consensus — *Frontiers 2022*, *Sports Med Open 2024 deloading survey*]
- Direct RCT evidence is thin and mixed: one 2024 PeerJ trial found a 1-week deload produced **no better hypertrophy/endurance/power outcomes** and *worse* dynamic/isometric strength gains vs. continuous training over the study window. [B, single study, contradicts the heuristic]
- Literature explicitly flags "underrepresentation... lack of a clear operational definition" for deload research. **This is squarely a [C] popular-heuristic-outrunning-evidence case**, parallel to volume landmarks.

### Recomposition-detectability timescale [B]
- Bodyweight alone: day-to-day fluctuation ~1–2 kg from water/food/sodium/hormones (~2-5% of bodyweight in a day). Trend-smoothing (rolling average / LOESS over ≥2–4 weeks) is necessary before a bodyweight trend is meaningful. [B/C]
- Body composition (BIA/InBody): excellent same-day repeatability (ICC 0.98–1.00, TEM ~0.04%) but **poor absolute accuracy vs. DEXA** (underestimates fat mass by ~3.7 kg men / ~1.9 kg women; ~4.2 pp body-fat bias) — good for *within-device trend*, bad for *absolute value*. [B]
- DEXA itself: <1% same-scan test-retest, but real-world day-to-day biological noise (hydration, glycogen, bowel contents) swamps that instrument precision.
- **Synthesis: BIA/scale trend data is usable for detecting real recomposition over roughly a 4–8 week window if both bodyweight and body-fat% are smoothed (rolling averages), consistent measurement conditions are enforced, and the same device is used throughout.** Shorter than 4 weeks, day-to-day noise dominates for essentially all consumer methods. [B, converges across sources; exact "weeks" threshold is (inference) extrapolated from the 4-8% weekly BIA trend-accuracy figure, not a single definitive study]

---

## THE FRAMING TABLE

| Construct | Evidence grade | Computable from realistic logs? | Signal or pseudo-precision? |
|---|---|---|---|
| Direct 1RM (lab test) | [A] CV~4.2% median | needs-lab (or rare max-out session) | Signal, but noisy — needs repeats |
| e1RM from submax sets (single reading) | [B] CV 5–10%, ICC swings with load-pair | Yes | **Pseudo-precision** as a point value; real signal only as a multi-point trend |
| e1RM trend (regression over weeks) | [B]/(inference) | Yes | Signal — the strongest computable construct in this niche, with caveats above |
| RIR self-report | [B] good near failure, poor far from it | Yes (it's the input) | Signal near failure; noise/pseudo-precision at RIR>3 |
| Bodyweight trend (smoothed) | [B] | Yes | Signal, once smoothed ≥1–2 weeks |
| Body-fat % trend (BIA, smoothed) | [B] for trend / [D] for absolute value | Yes (consumer scale) | Signal for trend only; absolute number is pseudo-precision |
| Volume landmarks (MEV/MAV/MRV, individualized) | [C/D] | No — not identifiable from logs, asserted not measured | **Pseudo-precision** — sports-science cosplay |
| "10-20 sets/muscle/week" (population heuristic) | [A] directional / [C] exact cutpoint | Partially (can count sets) | Directional signal; precise number is marketing gloss |
| Velocity-based autoregulation (phone-only, no sensor) | [D]/(inference) — unvalidated at this tier | No (needs added hardware to be [B]) | Pseudo-precision without a real transducer |
| Deload timing rules (fixed 4-8wk cadence) | [C], one contradicting RCT | Yes (calendar-based) | Largely heuristic; app can implement but shouldn't claim evidence backing |
| Recomp detectability (bodyweight + BIA, smoothed, 4-8wk) | [B] | Yes | Signal, at the stated timescale — not shorter |

---

## Sources
- [Test–Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a Systematic Review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7367986/) — Grgic et al., Sports Med Open 2020
- [Reliability and validity of the multi-point/2-point method for e1RM (squat, deadlift)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8898007/)
- [Assessment of back-squat performance at submaximal loads](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8123869/)
- [Accuracy of Predicted Intraset Repetitions in Reserve (RIR)](https://journals.sagepub.com/doi/10.1177/00315125231169868) — Remmert, Laurson, Zourdos 2023
- [Exercise type, load, velocity-loss threshold and RIR accuracy](https://pmc.ncbi.nlm.nih.gov/articles/PMC12360324/)
- [Overshooting, Undershooting, or Just Right? RIR prediction](https://www.strongerbyscience.com/reps-in-reserve/)
- [1RM Calculator — Brzycki, Epley, Lombardi formulas](https://www.ajdesigner.com/one-rep-max/)
- [How to Calculate Your E1RM: 7 Formulas](https://www.strengthjourneys.xyz/articles/how-do-i-calculate-my-e1rm-estimated-one-rep-max)
- [Reliability/validity of velocity monitoring devices — systematic review](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0324606)
- [Velocity-Based Strength Training: Apple Watch validity](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10383699/)
- [Dose-response relationship between weekly RT volume and hypertrophy](https://pubmed.ncbi.nlm.nih.gov/28530527/) — Schoenfeld, Ogborn, Krieger 2017
- [The Resistance Training Dose Response: Meta-Regressions (2025)](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- [Gaining more from doing less? Deload period effects](https://peerj.com/articles/16777/)
- [Coaches' perceptions/practices of deloading — survey](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.1073223/full)
- [Deloading Practices in Strength and Physique Sports: cross-sectional survey](https://link.springer.com/article/10.1186/s40798-024-00691-y)
- [Reliability and smallest worthwhile difference in 1RM tests](https://www.researchgate.net/publication/316365967_Reliability_and_smallest_worthwhile_difference_in_1RM_tests_according_to_previous_resistance_training_experience_in_young_women)
- [Weekly/seasonal bodyweight fluctuation patterns](https://pmc.ncbi.nlm.nih.gov/articles/PMC7192384/)
- [Body Composition Assessments are Less Useful Than You Think](https://macrofactor.com/body-composition/)

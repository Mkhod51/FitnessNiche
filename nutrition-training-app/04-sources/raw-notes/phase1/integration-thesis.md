# Integration Thesis: Does a Combined Training + Nutrition App Compute Anything Two Separate Apps Cannot?

Adjudicated 2026-07-23. Adversarial toward the premise. Evidence tags: [A] meta-analysis/replicated RCT · [B] single good study / consistent observational · [C] mechanistic / small-n / expert consensus · [D] industry/anecdote.

---

## 1. Verdict

**The premise mostly fails as framed.** There is no computation a combined app can perform that two good separate apps (MacroFactor + Hevy) *fundamentally cannot* — and the candidates that superficially need integration (RED-S) are exactly the ones that die on data quality. Four of the five candidates are (a) chasing effects the literature grades as negligible (protein timing), (b) demanding measurement precision no consumer app can obtain whether combined or not (energy availability), or (c) conveniences MacroFactor already ships (phase periodization). **One survives**: reconciling bodyweight trend against strength trend to read recomposition. But that is a cross-domain *visualization and reconciliation*, not a unique algorithm — a motivated user could approximate it by glancing at two apps. So the defensible thesis is **not** "we compute something impossible elsewhere." It is: *"one app puts the two most reliable signals (scale trend + estimated-1RM trend) in one legible view, reconciles them into one honest recomp read, and earns higher logging adherence than two apps."* That is a real product — a UX/adherence/legibility play, not a computational moat. If the student's pitch rests on a unique calculation, kill that framing. If it rests on one-app adherence plus one honest recomp read, v1 is viable in 2–3 months — provided it **deliberately omits** the RED-S flag and the protein-timing feature.

---

## 2. Ranked candidates (strongest integration argument first)

### #1 — Recomposition tracking: bodyweight trend vs strength trend
| | |
|---|---|
| **Evidence (physiology)** | **[A/B].** Murphy & Koehler 2022 (meta-analysis, RCTs ≥3 wk): energy deficit impairs lean-mass gains (ES −0.57, p=.02) but **not** strength (ES −0.31, p=.28). Recomp is real, strongest in novice/detrained/higher-body-fat. |
| **Noticeability** | **Marginal → Yes.** The reconciliation ("weight down 1.2 kg over 6 wk *and* e1RM up 4% → recomp working, hold course"; "weight down *and* e1RM down → deficit too aggressive, back off") is exactly the read users staring at two apps fail to make. Legible, correct, actionable. |
| **Data-quality assumption** | Regular bodyweight logging + consistent load/rep logging for e1RM. **Both are high-adherence, low-error signals** — and crucially it does **not** depend on calorie or exercise-expenditure logging. This is *why* it survives where RED-S dies. |
| **Case against** | It's a correlation/chart, not a deep computation — an eyeball on two apps approximates it. Only interesting for active recompers (deficit/maintenance + training); dedicated bulkers/cutters get less. Strength signal lags (neural gains, week-to-week noise) so needs a multi-week window → slow feedback. |

### #2 — Underfeeding plateau vs programming plateau
| | |
|---|---|
| **Evidence** | **[A/B].** Same Murphy 2022 + male-LEA review: strength is *robust* to moderate deficit. So the physiological basis for "stalled lift ⇒ eat more" is actually **weak**. |
| **Noticeability** | **Marginal — and it cuts the wrong way.** Because strength survives moderate underfeeding, a genuinely stalled lift is *usually* a programming/recovery problem, so the honest output is "change your program" (a training-app job). The one integration-dependent case — large deficit (>500 kcal/d) + fast weight loss + *now* falling strength ⇒ "deficit too aggressive" — is just #1 in different clothes. |
| **Data-quality assumption** | Trustworthy e1RM trend (lifters log this well) + weight trend (fine). The reliable signals again; intake magnitude is the noisy one and isn't strictly needed. |
| **Case against** | The "eat more" branch fires rarely per the physiology; most stalls default to "fix programming." Collapses into #1. |

### #3 — Intake periodized to training phase (bulk/cut/deload/peak)
| | |
|---|---|
| **Evidence** | **[C].** Nutritional periodization is sensible consensus; RCT evidence that *phase-matched* intake beats "hit the target for your current goal" is thin. |
| **Noticeability** | **Marginal — and MacroFactor already does the adaptive part.** It reads your weigh-in trend and auto-adjusts targets to your goal. "Training phase" is a goal label the user sets either way. Auto-detecting a deload from Hevy to shave 200 kcal is minor; a deload's energy-cost delta is small and swamped by intake-logging error. |
| **Data-quality assumption** | App must infer phase from training logs (bulk/cut/deload/peak are *intentions*, not always inferable from load/volume). Realistically the user just tells it — which two apps also allow. |
| **Case against** | A UI convenience, not a capability two apps "fundamentally cannot" match. |

### #4 — Energy availability / RED-S detection
| | |
|---|---|
| **Evidence** | **[B]** for health consequences (mostly female-endurance-derived); **[C]** for the target user. The 30 kcal/kg-FFM threshold comes from ~2000 studies on non-athletic females; a male threshold is **unvalidated** (proposed 9–25 kcal/kg). |
| **Noticeability** | **No** for the median user (solo male lifter). Low clinical base rate; strength is *preserved* even at low EA; the real harms (bone density, hormones) are slow, silent, and won't surface as a product outcome in 2–3 months. Only the tiny contest-prep-cutting-to-<20-kcal/kg subgroup is affected. |
| **Data-quality assumption** | **The killer.** EA = (EI − EEE)/FFM. EI self-report error 12–54% (manual apps systematically −5% to −15%). Resistance-EEE: 15–57% wearable error, no methodological consensus, needs indirect calorimetry to be accurate. FFM needs DEXA/BIA. **The computed EA's error band is wider than the 30-vs-45 bands it's trying to distinguish.** Garbage in, garbage out — and integration doesn't fix it, because the noise is upstream of integration. |
| **Case against** | Shipping a clinical-sounding flag from three noisy inputs, low base rate, threshold not validated for the population. A false "you're in RED-S" is *actively harmful* — it can push disordered eating in exactly the calorie-tracking population most prone to it. **Do not build this.** |

### #5 — Protein timing anchored to logged sessions
| | |
|---|---|
| **Evidence** | **[A].** Schoenfeld/Aragon/Krieger 2013 meta: total daily protein is the dominant predictor; the "anabolic window" is not supported; timing has limited independent effect once daily total is adequate. |
| **Noticeability** | **No.** Solving a non-problem. The interventions with real (modest) effect are daily total (~1.6 g/kg) and sane distribution (~0.4 g/kg × ~4 meals, Schoenfeld/Aragon 2018) — **neither needs to know when you trained.** |
| **Data-quality assumption** | Requires timestamped *per-meal* protein logging + session timestamps. Users barely log daily totals accurately; per-meal timestamped adherence is worse. Assumes data users won't give, to chase an effect that isn't there. |
| **Case against** | Dead on arrival. The one feature that literally consumes the training timestamp is the one the evidence most clearly says doesn't matter. |

---

## 3. Anything the framing missed (max 3)

- **Adherence is the real moat, not a computation.** One app = one open, one streak, one friction point → measurably higher logging adherence than two apps. This is UX/retention, and it's the strongest honest reason to combine — but it is *not* "computing something separate apps can't."
- **The defensible version of #2/#5: training-day-segmented protein-target compliance.** Use the training log *only* to label days, then check "did you hit ~1.6 g/kg on training days?" This rides the [A] effect (daily total matters) and uses integration merely to segment — modest but legitimate, and cheap.
- **Friction reduction, not new physiology.** Auto-nudging carbs up on a logged heavy-leg day, or pre-filling expected expenditure from session volume, lowers logging burden. Low value, trivially "computable" separately, but a real convenience — sell it as convenience, not science.

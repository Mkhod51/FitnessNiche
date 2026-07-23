# Ethics: ED Harm Reduction & Dark Patterns

> **Status:** Phase 1 baseline. Wave 1 Stream G extends this — everything below is retained, not replaced.
> Verbatim Phase 1 source archived at `03-sources/raw-notes/phase1/constraints.md`.
> **This document has veto power.** Features killed here stay killed regardless of appeal elsewhere.

Evidence grades: **[A]** meta-analysis/replicated RCT · **[B]** single good study/consistent observational · **[C]** mechanistic/small-n/expert consensus · **[D]** industry/anecdote.

## Phase 1 baseline — evidence

- Evidence base is real but **correlational**: systematic review finds cross-sectional links only (no experiment proving apps *cause* disordered eating), small–medium effects (d ≈ 0.26–1.06) [B/C]. Direction of causation unproven — but the *design levers* are the same ones the literature flags, so treat them as load-bearing.
- Strongest signal: using a tracker for **weight/shape reasons** is far more harmful than for health/performance reasons [B]. This app's *strength-training* framing is protective — lean into performance, away from thinness.
- Critical finding: users **circumvent soft warnings** — low-calorie pop-ups are read as "motivating, not discouraging" [B]. A warning is not a safeguard. Only a *hard floor* or a removed affordance works.
- Beat (UK ED charity) position: apps should prevent unhealthy goals outright (not warn), signpost services, avoid obsessive gamification [C/D].

## KILLED FEATURES (do not build)

- **Restriction streaks / "days under budget" gamification** — ties reward to eating less; textbook spiral driver.
- **"Lose faster" / aggressive-deficit targets** — unguarded rapid loss is restriction by design.
- **Sub-floor calorie goals** — any target below a hard kcal floor, even if the user requests it.
- **Unsolicited weight-loss prompts / nudges** — pushing a deficit at users who did not ask.
- **Weight/body-shape leaderboards or social comparison** — amplifies the exact harmful motivation.
- **"Eat-back exercise → net calories near zero" framing** — manufactures ever-lower net targets.
- **Weigh-in streaks / daily-weight pressure** — obsessive monitoring vector.

## REQUIRED BASELINE (a harm-aware tracker must have)

- **Hard calorie floor**, enforced not warned: block targets below ~1400 kcal (F) / ~1800 kcal (M) as a default guard (NHS baselines; tune per height/weight). No override to sub-1200 net.
- **Deficit cap**: max ~500 kcal/day (~0.5 kg/wk). No steeper option in the UI.
- **Default goal = maintenance**, not deficit. Deficit is opt-in, never pre-selected.
- **Opt-out of numbers**: a mode that hides calorie/macro totals and shows food logged without scores. Numbers-off must be a first-class state, not a settings toggle bolted on.
- **Performance framing default**: progress means lifts and consistency, not weight lost.
- **Signpost**: static link to Beat/NHS ED support in settings. Do **not** build screening or detection — that is a medical device (see `regulatory.md`).

## Open questions for Wave 1 Stream G

- What does the *primary* ED literature say, as opposed to the received wisdom repeated in app-design blogs? Phase 1's evidence was thin and partly [C/D].
- Which products actually implement harm-reduction well, and what specifically do they do? Phase 1 named none.
- What dark patterns are endemic to this category beyond the ED-specific ones (subscription traps, pressure onboarding, manufactured urgency, data-sharing defaults)?
- Duty of care and age gating for a product that could reach minors or vulnerable users.
- Does the "performance framing is protective" finding [B] survive scrutiny, and does it hold for a *strength* population specifically?

# Constraints & Risk Adjudication — v1

Evidence grades: [A] meta-analysis/replicated RCT · [B] single good study/consistent observational · [C] mechanistic/small-n/expert consensus · [D] industry/anecdote.
This stream has veto power. Killed features stay killed.

## 1. ED Harm-Reduction

- Evidence base is real but **correlational**: systematic review finds cross-sectional links only (no experiment proving apps *cause* disordered eating), small–medium effects (d ≈ 0.26–1.06) [B/C]. Direction of causation unproven — but the *design levers* are the same ones the literature flags, so treat them as load-bearing.
- Strongest signal: using a tracker for **weight/shape reasons** is far more harmful than for health/performance reasons [B]. This app's *strength-training* framing is protective — lean into performance, away from thinness.
- Critical finding: users **circumvent soft warnings** — low-calorie pop-ups are read as "motivating, not discouraging" [B]. A warning is not a safeguard. Only a *hard floor* or removed affordance works.
- Beat (UK ED charity) position: apps should prevent unhealthy goals outright (not warn), signpost services, avoid obsessive gamification [C/D].

### KILLED FEATURES (do not build in v1)
- **Restriction streaks / "days under budget" gamification** — ties reward to eating less; textbook spiral driver.
- **"Lose faster" / aggressive-deficit targets** — unguarded rapid-loss = restriction by design.
- **Sub-floor calorie goals** — any target below a hard kcal floor, even if user requests it.
- **Unsolicited weight-loss prompts / nudges** — pushing deficit to users who didn't ask.
- **Weight/body-shape leaderboards or social comparison** — amplifies the exact harmful motivation.
- **"Eat-back exercise → net calories near zero" framing** — manufactures ever-lower net targets.
- **Weigh-in streaks / daily-weight pressure** — obsessive monitoring vector.

### REQUIRED BASELINE (a harm-aware tracker must have)
- **Hard calorie floor**, enforced not warned: block targets below ~1400 kcal (F) / ~1800 kcal (M) as a default guard (NHS baselines; tune per height/weight). No override to sub-1200 net.
- **Deficit cap**: max ~500 kcal/day (~0.5 kg/wk). No steeper option in UI.
- **Default goal = maintenance**, not deficit. Deficit is opt-in, never pre-selected.
- **Opt-out of numbers**: mode that hides calorie/macro totals, shows food logged without scores. Numbers off must be a first-class state.
- **Performance framing default**: progress = lifts/consistency, not weight lost.
- **Signpost**: static link to Beat/NHS ED support in settings. (Do NOT build screening/detection — see §2.)

## 2. Regulatory Line

- **Wellness vs medical device (MHRA / EU MDR):** general fitness, health and wellbeing tracking is **not** a medical purpose. It becomes a device when the *intended purpose* is diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of **disease** [B].
- **"Eat X kcal to hit your goal" is NOT a medical claim** — it's general fitness/weight management. Safe, provided the goal is lifestyle (fitness/weight), not framed as treating a condition.
- **Where it crosses the line (KILL for v1):** RED-S / relative-energy-deficiency **detection or flagging**, diabetes/CKD/renal macro management, any "your intake suggests condition Y" inference. These are disease monitoring/diagnosis → UKCA marking, likely Class IIa+, clinical evidence, conformity assessment. Out of scope for a solo 2–3 month build. Also why ED *screening* (Beat's ask) is a trap: an in-app screening tool can itself be a medical device — signpost instead.
- FDA contrast only: US applies enforcement discretion to "general wellness, low-risk" products — a laxer posture than MDR; do not rely on it, UK/EU rules bind you.

**UK GDPR (health data = special category, Art 9):**
- Need **both** an Art 6 lawful basis **and** an Art 9 condition — for a consumer app that means **explicit consent**: separate, specific, opt-in, naming the health data. Not bundled into T&Cs.
- **DPIA required** — special-category data at potential scale is high-risk by ICO criteria. Write one (template exists; a page or two). [B]
- **Data minimisation + retention policy**: don't collect what you don't use; set deletion timelines; support export/delete (data-subject rights).
- **ICO registration** as data controller (annual fee, ~£52) + a plain-language privacy notice. UK-based solo dev → no EU representative needed unless targeting EU users.
- **Cheapest compliant path: keep health data on-device** where possible; the less you exfiltrate to a server, the lighter every obligation above.

## 3. Retention Reality

- Nutrition-app retention is brutal: day-30 commonly cited **~30–45%** for diet/nutrition apps, single-digit-to-25% for fitness apps broadly; **~70% abandon within 2 weeks** if logging feels heavy [D]. Logging burden is the #1 churn driver.
- **KEY FINDING — approximate-sustained beats precise-abandoned [A/B]:** across **5 RCTs** of simplified vs detailed dietary self-monitoring, **4/5 showed equivalent weight loss**; a pilot RCT found ~equal 5% weight-loss rates (43.2% vs 42.9%) **and higher engagement in the simplified arm**. Detailed calorie logging adherence *declines over time*, and non-loggers don't hit clinically meaningful loss.
- Product implication (high confidence): **build for approximate logging** — photo/quick-add, tier/portion buckets ("palm/fist" or S/M/L), recent-foods, barcode. Precision is optional depth, never the default path. Chasing gram-accuracy loses users who then get zero benefit.

## 4. Stack Constraint (offline-first)

- **The real problem is narrow:** this is a *single-user, multi-device* app (phone, maybe watch), not multi-user collab. True concurrent conflicts are rare — usually the same person on two devices, one offline.
- **Reach for: local-first SQLite + per-record last-write-wins on a server `updated_at` timestamp, with a sync queue.** Food/lift entries are **append-mostly** (you add a log, rarely co-edit one row) — model them as an append log and 90% of "conflicts" vanish. LWW only bites on edits to the *same* record, which is edge-case here.
- **Avoid as over-engineering:** hand-rolled CRDTs, operational transform, or a bespoke sync engine. CRDTs solve *concurrent multi-user text/structure merge* — a problem you don't have. That's weeks you don't have, for a 2–3 month v1.
- **If you want sync handled for you:** use an existing offline-first layer (WatermelonDB, PowerSync, or Realm/Atlas Device Sync) rather than writing the reconciliation loop. Don't add one until on-device SQLite + a manual push/pull demonstrably falls short.

---

## Hard constraints summary (architect can lift these directly)
- Enforce a **hard calorie floor** and **≤500 kcal/day deficit cap** in code — block, don't warn.
- Default goal = **maintenance**; deficit is opt-in; ship a **numbers-hidden mode**.
- **No streaks, leaderboards, rapid-loss targets, or weight-based gamification.** Ever.
- **No disease detection/management** (RED-S, diabetes, CKD) and **no in-app ED screening** — signpost only, or you become a regulated medical device.
- "Hit X kcal" wellness targeting is fine; keep all framing lifestyle/performance, never clinical.
- Health data = special category: **explicit separate consent, DPIA, ICO registration, keep data on-device where possible.**
- **Default logging = approximate** (photo/quick-add/portion tiers); precision optional. Evidence [A/B]: equal outcomes, better retention.
- **Offline: local SQLite + append-log + LWW-on-timestamp** or an off-the-shelf sync layer. No CRDTs/OT for v1.

# Regulatory: Medical Device Line & Data Protection

> **Status:** Phase 1 baseline. Wave 1 Stream G extends this — everything below is retained, not replaced.
> Verbatim Phase 1 source archived at `04-sources/raw-notes/phase1/constraints.md`.

Evidence grades: **[A]** meta-analysis/replicated RCT · **[B]** single good study/consistent observational · **[C]** mechanistic/small-n/expert consensus · **[D]** industry/anecdote.

## Phase 1 baseline — the wellness/device boundary

- **Wellness vs medical device (MHRA / EU MDR):** general fitness, health and wellbeing tracking is **not** a medical purpose. A product becomes a device when its *intended purpose* is diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of **disease** [B].
- **"Eat X kcal to hit your goal" is NOT a medical claim** — it is general fitness/weight management. Safe, provided the goal is framed as lifestyle (fitness/weight), not as treating a condition.
- **Where it crosses the line (KILLED for v1):** RED-S / relative-energy-deficiency **detection or flagging**; diabetes/CKD/renal macro management; any "your intake suggests condition Y" inference. These are disease monitoring or diagnosis → UKCA marking, likely Class IIa+, clinical evidence, conformity assessment. Out of scope for a solo 2–3 month build. This is also why in-app ED *screening* is a trap: a screening tool can itself be a medical device — signpost instead.
- FDA contrast only: the US applies enforcement discretion to "general wellness, low-risk" products — a laxer posture than EU MDR. Do not rely on it; UK/EU rules bind a UK developer.

## Phase 1 baseline — UK GDPR (health data = special category, Art 9)

- Need **both** an Art 6 lawful basis **and** an Art 9 condition — for a consumer app that means **explicit consent**: separate, specific, opt-in, naming the health data. Not bundled into T&Cs.
- **DPIA required** — special-category data at potential scale is high-risk by ICO criteria. Write one (a page or two; templates exist). [B]
- **Data minimisation + retention policy**: do not collect what you do not use; set deletion timelines; support export and delete (data-subject rights).
- **ICO registration** as data controller (annual fee, ~£52) plus a plain-language privacy notice. A UK-based solo dev needs no EU representative unless targeting EU users.
- **Cheapest compliant path: keep health data on-device.** The less that is exfiltrated to a server, the lighter every obligation above. This aligns with the offline-first requirement rather than fighting it.

## Open questions for Wave 1 Stream G

- The precise boundary, with **worked examples of real products on each side** — Phase 1 stated the rule but cited no adjudicated cases.
- Where exactly does *individualised* recommendation become a regulated claim? Phase 1 asserted "eat X kcal" is safe but did not source that against MHRA guidance text.
- App store health policies (Apple/Google) as a second, stricter gate than law.
- Liability exposure for individualised recommendations absent any device classification — negligence, not just regulation.
- Does serving a clinically-defined segment (GLP-1 users, pregnancy, T1D) change classification even if the app makes no disease claim?
- Age gating obligations (UK Age Appropriate Design Code) if minors could plausibly use it.

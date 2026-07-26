# Requirements — Evidence-Graded Lifting & Nutrition App

**Status:** v1 requirements, derived from three phases of research/ideation in this repo. Source of truth for the build.
**Name:** MyoStat (confirmed 2026-07-26; was "Working name: TBD"). **Owner:** solo developer (UK). **Target:** demonstrable portfolio v1 in ~2–3 months.
**Build tool:** Claude Code.

Requirement IDs are stable references (FR-#, NFR-#, DM-#, GR-#). Evidence grades [A]–[D] follow [00-meta/evidence-standards.md](00-meta/evidence-standards.md). Rationale links point at the research that justifies each block — no requirement here is justified by "users would like it."

---

## 1. Product summary

A combined strength-training + nutrition tracker for **science-based / evidence-based lifters** whose differentiator is **honest, evidence-graded, citation-backed advice**: every recommendation carries a confidence grade and a real citation, is contextualised to the user's own logged data, and is presented with nuance (confidence + dissent) rather than as a confident directive. The advice can only ever come from a curated, graded claim base — it is structurally incapable of fabricating a citation.

The differentiator is **intellectual honesty operationalised**, aimed at the one audience equipped to value it. Full thesis: [03-thesis-review/review.md](03-thesis-review/review.md). Why this and not a generic tracker: [03-thesis-review/findings.md](03-thesis-review/findings.md).

## 2. Goals & non-goals

**v1 goals**
- G1 — Prove the **A+C interaction**: a confidence-graded claim with a decisive default + depth-on-demand that feels both honest and pleasant. This single interaction is the thesis; it is the risk-retiring milestone (build first).
- G2 — A working offline-first tracker (lifts + nutrition) with the honest computed trends (e1RM regression, per-muscle volume, weight/intake trend) and the cut/bulk reconciliation verdict.
- G3 — A curated base of ~50 graded, cited claims driving the advice engine.
- G4 — A demo that shows one data-earned advice moment ("your lifts held through this deficit — consistent with [A/B]…").

**Non-goals for v1 (explicitly out of scope)**
- NG1 — No LLM in the advice trust path (see FR-ADV, GR-6). LLM phrasing layer is post-v1 and always behind a validator.
- NG2 — No disease detection/management, no clinical features, no in-app ED screening (GR-2 — medical-device line).
- NG3 — No wearable integrations, no social features, no program-template authoring.
- NG4 — No individualized MEV/MRV landmark detection (GR-4 — unsupported by evidence).
- NG5 — No native app-store build for v1 (PWA installable; native wrap is post-v1 via Capacitor).

## 3. Target user

Science-based lifters: followers of RP, Stronger By Science/MASS, Jeff Nippard, Menno Henselmans; reachable via r/weightroom, r/naturalbodybuilding. Evidence-literate, already paying for tools (RP app ~$25–35/mo, MacroFactor ~$6–12/mo, often stacked), and specifically underserved by the gap this product fills. Detail: [01-research/users/segments/science-based-lifters.md](01-research/users/segments/science-based-lifters.md).

The user this product must serve well: an intermediate lifter running a structured program, mid-cut or mid-bulk, who currently stitches a training app + a nutrition app + their own head.

---

## 4. Product tenets (the non-negotiables that shape everything)

These are constraints on *every* feature, not features themselves. A change that violates a tenet is wrong even if it tests well.

- **T1 — Structural claim provenance.** Every piece of advice is bound to a `claim_id`; citation and grade are rendered from the claim record, never authored as free text. No code path emits advice without a graded, cited claim behind it. This is what makes the honesty real and makes fabrication impossible. ([advice-strategies.md](03-thesis-review/advice-strategies.md))
- **T2 — Honesty over confidence.** The app shows evidence grades and dissent, and never overstates. It will tell the user when their favourite protocol is [C], and when their own progress is below the measurement noise floor. Nuance is the safety system for the citation feature, not a decoration. ([wave1-d-credibility-risk.md](03-thesis-review/wave1-d-credibility-risk.md))
- **T3 — Measurement honesty.** The app never displays a number it can't defend — whether a study statistic or the user's own noisy data. Trends carry confidence; point values that are pseudo-precision are not shown as truth. ([science-based-training-evidence.md](01-research/domain/science-based-training-evidence.md))
- **T4 — Offline-first.** The core loop (log a set/meal) works with zero connectivity and never loses a write. ([architecture-patterns.md](01-research/technical/architecture-patterns.md))
- **T5 — Harm-aware by construction.** ED-safety is enforced in code (floors, caps, removed affordances), not via warnings. Performance framing by default. ([ethics.md](01-research/constraints/ethics.md))
- **T6 — Wellness, never clinical.** Stays the right side of the medical-device line; signposts, never screens or diagnoses. ([regulatory.md](01-research/constraints/regulatory.md))

---

## 5. Functional requirements

### 5.1 Logging (FR-LOG)
- **FR-LOG-1** — Log a resistance-training set: exercise, weight, reps, and optional RIR (reps-in-reserve). Fast, phone-native, usable between sets.
- **FR-LOG-2** — Log bodyweight with a timestamp.
- **FR-LOG-3** — Log food/intake. **Default path is approximate** (quick-add, portion tiers, recents, barcode); gram-precision is optional depth, never the required path. Rationale: approximate-sustained beats precise-abandoned [A/B] ([abandonment.md](01-research/users/abandonment.md)).
- **FR-LOG-4** — All logging works fully offline (T4); writes are immediate to local storage.
- **FR-LOG-5** — Import training history from **Hevy CSV** (verified free-tier export). Treat Strong/Boostcamp/RP import as unsupported in v1 (Strong export is paywalled; others unverified — [science-based-lifters.md](01-research/users/segments/science-based-lifters.md) §4). Onboarding must not depend on any non-Hevy import.
- **FR-LOG-6** — Food data from the open stack: Open Food Facts (UK barcodes) + CoFID (UK generics) + USDA FDC (CC0 fallback), self-hosted/cached. No commercial food API in v1. ([data-sources.md](01-research/technical/data-sources.md))

### 5.2 Computed signals & trends (FR-SIG)
- **FR-SIG-1 — e1RM trend.** Compute estimated-1RM as a **many-point regression** over logged sets, never a point-to-point comparison. Include only valid sets: **RIR ≤ 3** and **≤ 10 reps** (formula divergence and RIR error make others unreliable). Display as a trend **with a confidence band**, not a bare number. ([science-based-training-evidence.md](01-research/domain/science-based-training-evidence.md))
- **FR-SIG-2 — Noise-floor honesty.** When the trend signal is within measurement noise (esp. advanced lifters, short windows), the app says so rather than drawing a confident line. (T3)
- **FR-SIG-3 — Per-muscle weekly volume.** Count hard sets per muscle group (fractional counting for compounds; RIR-weighted set quality) and show them against the **evidenced population range (~10–20 sets/muscle/week [A] directional)**. Do **not** compute or display an individualized MEV/MRV (GR-4).
- **FR-SIG-4 — Bodyweight & intake trends.** Smoothed (rolling average / EWMA over ≥1–2 weeks) before display; raw daily weight is never the signal. ([science-based-training-evidence.md](01-research/domain/science-based-training-evidence.md))
- **FR-SIG-5 — Cut/bulk reconciliation.** Reconcile weight/intake trend against e1RM + volume-tolerance trend into an honest verdict — *recomp/cut on track · deficit too aggressive, ease it · you're done, here's maintenance* — with confidence shown, over a multi-week window. This is the engine the archived Phase 2 recommendation defined ([archive/phase2-ideation/recommended-cut-reconciler.md](archive/phase2-ideation/recommended-cut-reconciler.md)); physiology [A/B] Murphy & Koehler 2022.

### 5.3 The advice engine (FR-ADV) — the differentiator
- **FR-ADV-1 — Claim-bound output.** Every advice item references a `claim_id`; the UI renders the claim statement, grade chip, and citation from the claim record (T1). No advice without a claim.
- **FR-ADV-2 — Deterministic selection (S1).** A rules/predicate engine evaluates each claim's **applicability predicates** against user state and surfaces matching claims. Fully offline, auditable. This is the trust-root backbone. ([advice-strategies.md](03-thesis-review/advice-strategies.md))
- **FR-ADV-3 — Question surface (S2).** A free-text "what does the evidence say about X?" entry retrieves relevant claims (semantic or keyword search over ~50 claims — trivial scale). Retrieval selects *which* claims; presentation stays app-rendered.
- **FR-ADV-4 — Data-earned advice (S5).** The highest-value trigger pattern: fire a claim only when the user's own logged reality instantiates it, and say so ("your e1RM held through 6 weeks of a deficit — consistent with strength being robust to moderate deficits [A/B, Murphy & Koehler 2022]"). Predicates evaluated against FR-SIG-5 outputs.
- **FR-ADV-5 — Grade-calibrated language.** Advice phrasing is generated from the grade via a fixed map ([A] "well-supported" … [C] "suggested, limited evidence" … [D] "anecdotal"). The app is structurally incapable of saying "proven" for a [C] claim.
- **FR-ADV-6 — Contested claims show both sides.** When a claim's status is `contested`, selection returns the claim *cluster* and the UI presents the opposing evidence, not one side (steelman). Nuance is a data property, not optional prose.
- **FR-ADV-7 — Progressive disclosure (the A+C interaction, G1).** Three layers: (1) decisive default recommendation + confidence chip; (2) tap "why" → reasoning + grade in a sentence; (3) tap "show me" → the studies, re-plotted figures (FR-ADV-8), sample sizes, dissent. Advice stays actionable; honesty is one tap away, never blocking.
- **FR-ADV-8 — Figures as re-plotted data.** "Show me the figures" renders the **extracted numbers** (effect size, n, duration, population, CI) in the app's own chart style. **Never embed a publisher's figure image** (GR-3). Every figure card shows sample size and trained/untrained population as first-class fields.
- **FR-ADV-9 — No LLM in the trust path (v1).** Advice substance, citations, and grades are deterministic/app-rendered. Any future LLM layer only rephrases fixed content, behind a validator that rejects output introducing an unlisted citation or altering a grade (NG1, GR-6).

### 5.4 The claim/evidence base (FR-CLAIM)
- **FR-CLAIM-1 — Curated set, ~50 claims for v1.** The high-leverage questions science-based lifters argue about (volume, frequency, failure proximity, protein dose/timing, bulk rate, ROM, deload, rest intervals). Depth over breadth. This set **is** the moat. ([feasibility.md](03-thesis-review/feasibility.md))
- **FR-CLAIM-2 — Claim schema.** Per DM-CLAIM below. Each claim: statement, grade, settled|contested status, domain, applicability predicates, citations (with extracted figures), calibrated phrasing, superseded-by link, last-reviewed date.
- **FR-CLAIM-3 — Curation is manual and one-time-per-claim.** Studies looked up once (via OpenAlex/Europe PMC/CrossRef), numbers extracted, claim graded by the developer. **The running app does not query scholarly APIs live** — those are curation-time tools. (Clarifies the common misconception: this is *not* a large, auto-updating study database.)
- **FR-CLAIM-4 — Supersession.** Each claim carries a `last_reviewed` date and a manual review queue; a superseding meta-analysis updates the claim by hand (quarterly/biannual cadence). No live pipeline. (feature F, deferred-minimal)
- **FR-CLAIM-5 — Grading rubric** per [evidence-standards.md](00-meta/evidence-standards.md), applied consistently; trained-population claims supported only by untrained studies drop a grade.

### 5.5 Onboarding & stance (FR-ONB)
- **FR-ONB-1 — Honest-stance contract.** Onboarding states plainly that science-based lifting is more equivocal than the surrounding content implies, and that the app will show where the user's protocols are weakly evidenced. Self-selects the audience that wants this (defuses the top demand risk). (feature L)
- **FR-ONB-2 — Goal setup** defaults to maintenance (GR-1); deficit is opt-in and capped.
- **FR-ONB-3 — Explicit, separate consent** for health data before any logging (GR-5).

---

## 6. Non-functional requirements (NFR)

- **NFR-1 — Offline-first (hard).** Core loop works with no network; no write is ever lost to a dropped connection. (T4)
- **NFR-2 — Sync.** Local store is source of truth; sync via **append-log + last-write-wins on a server timestamp**. Entries are append-mostly; **no CRDTs/OT** (wrong problem class for single-user multi-device). ([architecture-patterns.md](01-research/technical/architecture-patterns.md))
- **NFR-3 — Performance.** Log write and trend read feel instant (local-first); rapid use between sets is a design target.
- **NFR-4 — Privacy / UK GDPR.** Health data is special-category: explicit separate consent, DPIA, ICO registration, data-subject export/delete, retention policy. **Keep data on-device wherever possible** — the cheapest compliant path, and it aligns with NFR-1. ([regulatory.md](01-research/constraints/regulatory.md))
- **NFR-5 — Security.** Encrypt data at rest on-device where the platform allows; TLS for sync; no health data in URLs/query strings.
- **NFR-6 — Accessibility.** Meet basic WCAG (contrast, touch targets, screen-reader labels); the app is used one-handed, mid-workout.
- **NFR-7 — Platform.** See §8 — PWA, installable, offline via service worker + local structured storage.
- **NFR-8 — Maintainability.** The claim base is data (not hard-coded); adding/regrading a claim needs no code change.

---

## 7. Data model (DM)

Key entities (fields indicative, not exhaustive):

- **DM-USER** — id, goal (cut|bulk|maintain), sex, height, unit prefs, calorie-floor & deficit-cap (enforced), numbers-hidden flag, consent record.
- **DM-EXERCISE** — id, name, primary/secondary muscle groups (for FR-SIG-3 fractional counting), modality.
- **DM-WORKOUT / DM-SET** — workout(id, user_id, datetime); set(id, workout_id, exercise_id, weight, reps, rir, created_at). **Append-log** (NFR-2).
- **DM-WEIGHT** — id, user_id, value, datetime.
- **DM-FOODLOG / DM-FOODITEM** — foodlog(id, user_id, datetime, quantity, tier|grams); fooditem(id, source[OFF|CoFID|FDC], macros, micros, barcode).
- **DM-CLAIM** — id, statement, grade [A–D], status (settled|contested), domain, applicability_predicates (evaluated against user state/signals), calibrated_phrasing_by_grade, superseded_by (claim_id?), last_reviewed (date). *This is the heart of the differentiator.*
- **DM-CITATION** — id, claim_id, doi, authors, year, journal, sample_size_n, population (trained|untrained|mixed), effect_size, confidence_interval, extracted_figures (numeric, for re-plotting — never an image), short_quote?(attributed).
- **DM-ADVICE-EVENT** — id, user_id, claim_id, trigger (rule|query|data-earned), shown_at, user_state_snapshot. (Traceability: every shown advice maps to a claim.)
- **DM-SYNCMETA** — per-record updated_at, sync status, device_id (for LWW).

---

## 8. Technical architecture

- **TA-1 — Platform: PWA** (decision). Built as a website (React or similar), installable to home screen via manifest, offline via **service worker** (caches app shell) + **local structured storage** (wasm-SQLite preferred over raw IndexedDB for the relational data model above). One codebase, link-shareable for demos, native-wrappable later via Capacitor.
  - **Known caveat (accepted):** iOS Safari PWA support is weaker than Android — no true background sync (sync runs while the app is open, which fits a workout-logging session), and storage eviction has historically been more aggressive. **Decision revisit trigger:** if iOS offline storage reliability proves insufficient in testing, fall back to **React Native (Expo)** with native SQLite — same architecture, different shell. Document the outcome in the decision log.
- **TA-2 — Storage:** local SQLite (wasm) as source of truth; server (managed Postgres or similar) only as a sync target and only for data the user consents to sync (NFR-4).
- **TA-3 — Sync layer:** append-log push/pull + LWW on timestamp (NFR-2). Build the simplest version first; adopt an off-the-shelf offline-sync library only if hand-rolled push/pull demonstrably falls short.
- **TA-4 — Advice engine:** deterministic predicate evaluator + keyword/semantic search over the claim base (in-memory at ~50 claims). No ML infra required for v1. Claim base ships as versioned data with the app and is cache-updatable.
- **TA-5 — Citation infrastructure (curation-time only):** OpenAlex (CC0 metadata + abstracts + citation graph) as backbone, Europe PMC for OA full text, CrossRef for DOI resolution. Not called by the running app. ([citation-infrastructure.md](01-research/technical/citation-infrastructure.md))

---

## 9. Constraints & guardrails (GR) — hard fences, enforced in code

- **GR-1 — ED safety.** Hard calorie floor (default guard ≈ 1400 kcal F / 1800 kcal M, tuned per stats; no override sub-1200 net). Deficit cap ≤ 500 kcal/day. Maintenance is the default goal. **Numbers-hidden mode** as a first-class state. **No** restriction streaks, "days under budget," rapid-loss targets, weight/shape leaderboards, or eat-back-to-zero framing. Performance framing default. Static signpost to Beat/NHS in settings. Enforced, not warned. ([ethics.md](01-research/constraints/ethics.md))
- **GR-2 — Medical-device line.** No disease detection, monitoring, or management (RED-S, diabetes, CKD); no in-app ED screening. Wellness/performance framing only. Serving a clinically-defined population or making disease claims risks UKCA/Class-IIa classification — out of scope. ([regulatory.md](01-research/constraints/regulatory.md))
- **GR-3 — Copyright.** Reproduce **extracted numbers** (facts, not copyrightable — re-plot in-app) and short attributed quotes (UK fair dealing) only. **Never embed publisher figure images**; do not bulk-ingest whole proprietary tables (UK database right). Legal review before any commercial launch. ([citation-infrastructure.md](01-research/technical/citation-infrastructure.md))
- **GR-4 — No fabricated precision from the evidence side.** No individualized MEV/MRV (unidentifiable from logs, [C/D]); no velocity-based autoregulation from a phone camera (unvalidated); deload prompts allowed but never dressed as evidence-backed. ([science-based-training-evidence.md](01-research/domain/science-based-training-evidence.md))
- **GR-5 — Consent & data rights.** Explicit separate opt-in for health data; export & delete supported; DPIA written; ICO registration before public launch.
- **GR-6 — No fabricable citations.** No system component may emit a citation or grade that isn't rendered from a stored claim record (T1). Any LLM layer (post-v1) is validated against the claim base and cannot introduce or alter citations/grades.

---

## 10. Scope — v1 vs deferred

**Must-have (v1):** FR-LOG-1..6, FR-SIG-1..5, FR-ADV-1..8, FR-CLAIM-1..5, FR-ONB-1..3, all NFR, all GR. Advice engine features A + C + I + B + D + G (from [feature-brainstorm.md](03-thesis-review/feature-brainstorm.md)).

**Should-have if time:** feature L (stance — near-zero cost), H (steelman on contested), K (data-earned = FR-ADV-4, strongly preferred), E (false-precision guard on personal numbers).

**Deferred (post-v1):** LLM phrasing layer (behind validator), supersession automation (ship the date field only), "what would change this grade," wearables, social, program templating, native app-store builds, bulk mode if v1 ships cut-only.

## 11. Critical path & first milestone

Build order retires the most risk first:
1. **Month 1 — the A+C interaction on ~15–20 real curated claims** (G1). Data model incl. DM-CLAIM/DM-CITATION, offline logging skeleton, deterministic advice engine (FR-ADV-1,2,5,7), the confidence-graded-decisive-default UI. *If this interaction doesn't feel honest AND pleasant, the thesis is in trouble — learn it here, cheaply.*
2. **Weeks 5–7** — tracker + FR-SIG signals + reconciliation (FR-SIG-5) + data-earned triggers (FR-ADV-4).
3. **Weeks 8–9** — curation to ~50 claims; question surface (FR-ADV-3); contested rendering (FR-ADV-6).
4. **Weeks 10–11** — food-data integration; calibrated-language pass; polish.
5. **Week 12** — the demo (A+C + one data-earned advice moment); buffer.

## 12. Open questions & risks

- **OQ-1 (top risk, demand-side):** whether de-mythologising is a product people sustain using. Not a build blocker; validate cheaply by putting graded sacred-cow claims in front of the real audience. ([review.md](03-thesis-review/review.md) concern #1)
- **OQ-2:** does Hevy's free CSV export carry the RIR column, or only weight×reps? Affects imported-history quality for FR-SIG-1. Verify before relying on imported RIR.
- **OQ-3:** iOS PWA offline-storage reliability under real use (TA-1 revisit trigger).
- **OQ-4:** does the reconciliation verdict (FR-SIG-5) read as more than two overlaid charts? The core product-value risk.
- **OQ-5:** competitor — MacroFactor could occupy this slot (researcher-built, trusted, already a tracker). Defensibility is "they haven't," not "they can't."

## 13. Acceptance criteria for v1

- **AC-1** — A user can log lifts and meals fully offline; no write is lost across an airplane-mode session; data syncs on reconnect.
- **AC-2** — The app shows an e1RM trend with a confidence band and refuses to over-claim when the signal is within noise.
- **AC-3** — At least one piece of advice is *data-earned* — triggered by the user's own logged state — and displays claim · grade · citation, with progressive disclosure to re-plotted figures showing n and population.
- **AC-4** — Every advice item in the app traces to a stored claim; there is no path to display an ungraded or uncited recommendation (T1/GR-6 verifiable).
- **AC-5** — Calorie floor and deficit cap cannot be overridden past their limits; numbers-hidden mode works as a first-class state (GR-1).
- **AC-6** — ~50 curated claims exist, each graded with ≥1 citation carrying extracted figures.

---

*Derived from: [README.md](README.md) · [03-thesis-review/](03-thesis-review/) (review, findings, advice-strategies, feasibility, credibility-risk) · [01-research/](01-research/) · [00-meta/decision-log.md](00-meta/decision-log.md). Where a requirement and a research file ever conflict, the research file's evidence wins and this doc should be corrected.*

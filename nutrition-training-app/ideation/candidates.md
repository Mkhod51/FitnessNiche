# Candidates

Twelve candidates, diverged before any convergence. Working names are placeholders. Required spread satisfied: high-risk/high-ceiling (#6, #8, #7), narrow-and-certain (#2, #3, #5), serves-a-segment (#4, #5, #7), routes-around-the-food-DB-moat (#4, #6, #8). All candidates inherit the Stream D baseline (hard calorie floor, ≤500 kcal deficit cap, maintenance default, numbers-hidden mode available, offline-first local SQLite, open-data food stack) — those are architecture, not differentiators, and aren't repeated below.

---

## 1. Verdict — the honest recomposition tracker

**Pitch:** Log lifts and meals in one app; it reconciles your bodyweight trend against your strength trend and gives one honest read: recomp working / deficit too deep / stall is a programming problem.
**Segment:** Lifters eating with intent (recomp, lean bulk, capped cut) — the broad core of r/fitness.
**Weakness exploited:** No incumbent has both signals (Stream A, structural); the read is the only surviving integration thesis (Stream B).
**Evidence:** [A/B] — Murphy & Koehler 2022; verdicts ride only the two reliable signals.
**Technical challenge:** e1RM estimation and trend-smoothing over noisy lift data; a rules engine that refuses to over-claim; Hevy/Strong CSV import to kill the cold-start problem.
**v1 scope:** Lift logger, weight log, tier-based food log, the verdict engine, CSV import. Cut: barcode scanning, social, programs.
**Copyability:** Computation is simple; the blocker is data incumbents don't have. MFP can't see lifts, Hevy can't see intake. MacroFactor is the real threat.
**Failure mode:** The verdict needs 4–6 weeks of data to say anything; users churn before first payoff (mitigated, not solved, by import).

## 2. Plateau Judge — one question, honestly answered

**Pitch:** A single-purpose advisor: "my lifts stalled — eat more or change my program?" Almost always answers "fix your program," and shows why.
**Segment:** Intermediate lifters in the eternal bulk/cut confusion cycle.
**Weakness exploited:** No nutrition app will deprecate itself; no training app can see your deficit (conventional-wisdom gap, decisions.md §3).
**Evidence:** [A/B] — strength robust to moderate deficit; the "eat more" branch fires rarely.
**Technical challenge:** Thin — trend classification plus honest thresholds. That's the problem.
**v1 scope:** Weight trend + e1RM trend input (manual or CSV), verdict + reasoning page.
**Copyability:** A weekend for anyone. Zero moat.
**Failure mode:** It's a feature, not a product — and its honest answer makes it a one-time consult, not a habit. Absorbed by #1.

## 3. Training-Day Protein — the compliance checker

**Pitch:** Uses your training log only to label days, then checks one thing: did you hit ~1.6 g/kg on training days?
**Segment:** Lifters who half-track protein.
**Weakness exploited:** The legitimate residue of protein timing (Stream B's "framing missed" note) — rides the [A] effect, ignores the myth.
**Evidence:** [A] — daily total dominates; segmentation is legitimate, timing is not.
**Technical challenge:** Almost none. Protein-only logging is deliberately shallow.
**v1 scope:** Session check-in, protein quick-log, weekly compliance view.
**Copyability:** MacroFactor could ship it in a sprint.
**Failure mode:** Too thin to sustain a 30-minute interview or a habit. Absorbed by #1 as its protein layer.

## 4. Leucine Ledger — protein *quality* for plant-based lifters

**Pitch:** The first tracker that scores vegan protein by leucine and EAA completeness per meal, not gross grams — plus a lift log to anchor it to actual training.
**Segment:** Plant-based strength trainees (r/veganfitness, r/vegangainz) — small, vocal, genuinely unserved.
**Weakness exploited:** Incumbent databases don't carry amino-acid profiles as first-class data (Stream C: hard architectural constraint).
**Evidence:** [B] — ~half of vegans meeting gross protein still miss lysine/leucine thresholds; per-meal leucine ~2–3 g [B/C].
**Technical challenge:** The interview-worthy part: building an AA-profile data layer from USDA SR Legacy (CC0) + CoFID, entity-matching onto a curated vegan staple list, category-level AA inference for processed meat-alternatives (soy/pea/wheat protein bases).
**v1 scope:** ~500-food curated vegan DB with AA profiles, meal scoring, lift log, training-day protein view. Cut: barcode/packaged-food breadth.
**Copyability:** Slow — requires the data layer incumbents' schemas don't hold.
**Failure mode:** UK vegan diets lean heavily on processed substitutes and powders with no published AA data; category inference is approximate and the segment's pedants will notice. Also: building for a community the developer may not belong to.

## 5. Descent — make weight without wrecking your total

**Pitch:** Date-anchored gradual weight descent for powerlifters: pick your meet and class, get a capped-deficit glide path, watch e1RM to confirm the cut isn't eating your total.
**Segment:** Competitive powerlifters (~20K+ UK registered) with 2-hr weigh-ins.
**Weakness exploited:** Generic trackers have no concept of a weigh-in date (Stream C).
**Evidence:** [B] gradual cuts (~0.5–1%/wk) preserve performance; [C] for the specific glide-path logic.
**Technical challenge:** Backwards-planning from a date under a hard deficit cap; e1RM monitoring as the abort signal.
**v1 scope:** Meet planner, weight/lift logging, glide path, "cut is costing you" alert. Explicitly excluded forever: water manipulation/dehydration protocols (decisions.md §2).
**Copyability:** CutCoach/CUTCHECK exist for combat sports; a powerlifting-specific honest version is defensible but not unique.
**Failure mode:** The segment's flashiest need (acute cut) is the part we won't serve; users may just want the dangerous thing.

## 6. Blind — the tracker for people who hate trackers

**Pitch:** Numbers-hidden by default as the *product*, not a mode: log meals as photos/tiers, log lifts, see only trends, verdicts, and consistency — never a calorie total.
**Segment:** Diet-culture-fatigued lifters; tracker relapsers; the ED-adjacent-but-not-clinical audience.
**Weakness exploited:** Every nutrition incumbent is architecturally number-first (Stream C: hardest constraint of all).
**Evidence:** [B/C] — weight/shape-motivated tracking correlates with harm; performance framing is protective. No direct evidence this audience wants any logging (flagged unresolved, decisions.md §2).
**Technical challenge:** Designing verdicts that are useful with numbers withheld; the restraint is the design problem.
**v1 scope:** Tier/photo meal log, lift log, trend-only dashboard, verdict engine.
**Copyability:** Incumbents *can't* copy without gutting their architecture and their premium funnels. Strong moat if the audience exists.
**Failure mode:** High-risk/high-ceiling: the audience that hates trackers may simply not log; and serving an ED-adjacent population as a solo non-clinical dev demands constant care even with numbers hidden.

## 7. Preserve — strength companion for GLP-1 users

**Pitch:** For people on Wegovy/Mounjaro: appetite is handled by the drug; the app defends muscle — protein-first targets, micronutrient adequacy at low intake, and a minimal strength program log.
**Segment:** GLP-1 users who lift or should — the fastest-growing segment in Stream C.
**Weakness exploited:** Incumbents are calorie-restriction-first; GLP-1 flips the binding constraint to adequacy (protein, micros) [C: ~40% of loss can be lean mass].
**Evidence:** [B] — resistance training + adequate protein preserves lean mass in deficit.
**Technical challenge:** Adequacy-first UI inversion (warn on *under*, not over); careful wellness-only framing one step from a medical device.
**v1 scope:** Protein/micro adequacy dashboard, simple lift log, no drug tracking, no dosing, no medical claims.
**Copyability:** Contested — MyNetDiary, MeAgain already retrofitting; MFP will follow the market.
**Failure mode:** Crowded fast; regulatory framing is a tightrope (drug-adjacent = scrutiny); the segment may not lift.

## 8. Tiers — the precision-free tracker

**Pitch:** A tracker with no gram fields at all: palm/fist/thumb portions, S/M/L meals, trends only — betting the entire identity on approximate-sustained beats precise-abandoned.
**Segment:** Serial tracker-abandoners (the ~70% who quit within two weeks).
**Weakness exploited:** MFP monetizes database precision; MacroFactor's algorithm demands sustained detailed logging — neither can lead with "stop measuring" (Stream A + D).
**Evidence:** [A/B] — 5 RCTs, simplified monitoring equal outcomes, higher engagement.
**Technical challenge:** Making trend estimation honest from tier inputs; communicating uncertainty without numbers-worship.
**v1 scope:** Tier logging, weight trend, lift log, weekly read.
**Copyability:** Quick-add exists everywhere; the *identity* is harder to copy than the feature, but that's a thin moat for a newcomer with no brand.
**Failure mode:** High-risk: "less precise" is a hard sell to the fitness audience conditioned to believe precision = results; may position as a toy.

## 9. Kettle — the UK-first tracker

**Pitch:** A tracker whose database is UK-native from day one: Open Food Facts UK dump + CoFID, scan→not-found→contribute-back to the commons.
**Segment:** UK lifters tired of US serving sizes and missing Tesco own-brand items.
**Weakness exploited:** MFP's database rot + every commercial API's US-centricity (Streams A, C).
**Evidence:** [B] on the data-stack viability; [D] that UK-coverage pain drives switching.
**Technical challenge:** Dedup/matching across OFF/CoFID/FDC; the contribute-back loop.
**v1 scope:** Barcode scan, UK-filtered DB, basic macro + lift logging.
**Copyability:** The stack is open — anyone can assemble it; decisions.md §4 killed database-as-identity for exactly this reason.
**Failure mode:** Competing on the commodity layer; "better UK coverage" is a feature every incumbent partially has and no user builds a habit around.

## 10. Coach Read — the weekly page for self-coached lifters

**Pitch:** Log lifts and rough intake all week; Sunday delivers one page a good coach would write: recomp status, training-day protein compliance, adherence, one instruction.
**Segment:** Self-coached lifters running structured programs (Boostcamp/spreadsheet crowd).
**Weakness exploited:** Same structural gap as #1, packaged as a digest rather than an always-on dashboard; nobody's product is the *weekly synthesis*.
**Evidence:** [A/B] — same engine as #1; digest cadence also matches the multi-week window the signals actually need.
**Technical challenge:** Same verdict engine + report generation; honest one-instruction selection.
**v1 scope:** Identical to #1 plus report layer, minus live dashboard.
**Copyability:** Same as #1.
**Failure mode:** Weekly cadence may be too slow for habit formation — the app is silent six days out of seven. Realistically a *presentation choice* within #1, not a separate product.

## 11. Nudge — volume-aware intake targets

**Pitch:** Reads training volume from the log and nudges carbs/kcal up on heavy days, down on deloads.
**Segment:** Macro-tracking lifters who periodize.
**Weakness exploited:** Cross-domain data flow incumbents can't do.
**Evidence:** [C] — and Stream B graded the effect marginal: a deload's energy delta is swamped by intake-logging error.
**Technical challenge:** Volume→energy mapping that isn't pseudo-precision theater.
**v1 scope:** Target adjustment engine on top of basic dual logging.
**Copyability:** Fast, if anyone wanted it.
**Failure mode:** Ships pseudo-precision built on the two noisiest signals — the exact thing decisions.md finding #3 forbids. Included for completeness; ranked accordingly.

## 12. Vault — the tracker that never phones home

**Pitch:** Everything on-device, forever: no account, no server, no consent banners — export your own SQLite. GDPR compliance by architecture.
**Segment:** Privacy-conscious self-hosters (r/selfhosted, r/degoogle) who also lift.
**Weakness exploited:** Every incumbent's business model requires your data server-side (Stream A).
**Evidence:** [B] for the compliance claim; [D] that privacy drives fitness-app choice for more than a sliver.
**Technical challenge:** Honest answer: *less* challenging than the others — no sync is the easy path; the challenge is device migration without a server.
**v1 scope:** Local-only dual logger, file-based backup/restore.
**Copyability:** Trivial feature-wise; incumbents just won't (business model).
**Failure mode:** Privacy is a soft preference for this vertical (Stream C's hard/soft test) — and every other candidate already inherits on-device-first, so this is a property masquerading as a product.

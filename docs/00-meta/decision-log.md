# Decisions Log

Architect: Fable 5. Workers: Sonnet 5 (Streams A, C), Opus 4.8 (Streams B, D — the two budgeted Opus calls, spent on evidence adjudication and risk/regulatory, where confidently-wrong is expensive). One research round, dispatched in parallel, no follow-ups needed — no stream returned anything that invalidated another's premise.

---

## 1. Findings that constrain the design

| # | Finding | Grade | Design consequence |
|---|---|---|---|
| 1 | No incumbent spans strength logging + nutrition as co-equal first-class features; each is architecturally and commercially committed to one domain | [C] | The structural gap exists. Differentiation must come from what the combination *reads*, not from matching either incumbent's depth |
| 2 | The combined-app premise **fails as a computational moat** — nothing a merged app computes that MacroFactor+Hevy fundamentally can't. It survives as: one-app adherence + one honest recomposition read | [A/B] physiology; [C] product | Do not pitch "unique algorithm." Pitch "two reliable signals, one legible verdict, higher adherence" |
| 3 | The only two trustworthy consumer signals are **bodyweight trend** and **estimated-1RM trend**. Calorie intake (12–54% self-report error) and exercise expenditure (15–57% wearable error) are irredeemably noisy | [B] | Every computation the app stakes its credibility on must ride only the two reliable signals. Intake is an input the user logs, never a number the app reasons hard from |
| 4 | Strength is robust to moderate energy deficit (ES −0.31, ns); lean-mass gain is not (ES −0.57, p=.02) — Murphy & Koehler 2022 meta | [A/B] | The recomp read is physiologically real. Also: a stalled lift usually means *fix the program*, not *eat more* — the honest advisor mostly refuses the answer users expect |
| 5 | Protein: total daily (~1.6 g/kg) and sane per-meal distribution dominate; timing vs. the training session has no meaningful independent effect | [A] | Kill timing features. The legitimate residue: use the training log only to *label days* and check training-day protein compliance |
| 6 | Approximate logging sustained **beats** precise logging abandoned: 5 RCTs, 4/5 equal weight outcomes, higher engagement in simplified arms | [A/B] | Default logging = tiers/quick-add/recents. Gram precision is optional depth, never the required path |
| 7 | Food-database moat is surmountable solo: Open Food Facts (ODbL, ~134K UK-tagged barcodes) + CoFID (UK gov, OGL, ~3.3K verified generics) + USDA FDC (CC0) as fallback. Commercial APIs (Nutritionix, Edamam, FatSecret) are US-gated or ToS-hostile at free tier | [B] | Layered open-data stack, self-hosted filtered dump. Zero data licensing cost. Scan→not-found→contribute-back loop is a genuine portfolio story |
| 8 | Any disease detection/management (RED-S, diabetes, CKD, in-app ED screening) makes the app a regulated medical device (MHRA/EU MDR, Class IIa+) | [B] | Hard scope fence: wellness/performance framing only. Signpost, never screen |
| 9 | RED-S/energy-availability detection is independently dead on data quality: computed EA's error band exceeds the 30-vs-45 kcal/kg threshold gap it must distinguish; male threshold unvalidated; false positives actively harmful | [B/C] | Killed twice over (see §4). The feature that most *looks* like the integration payoff is the worst thing to build |
| 10 | ED harm baseline: soft warnings fail (read as motivating); only removed affordances work. Hard calorie floor, ≤500 kcal/day deficit cap, maintenance default, numbers-hidden mode, performance framing | [B/C] | These are architecture, not settings. Numbers-hidden as a first-class state also happens to route around food-DB precision entirely |
| 11 | UK GDPR: health data is special-category → explicit separate consent, DPIA, ICO registration. Cheapest compliant path: keep data on-device | [B] | Aligns perfectly with the offline-first hard requirement. Local-first isn't just for gym basements — it's the compliance strategy |
| 12 | Offline sync for single-user/multi-device: local SQLite + append-log + last-write-wins on timestamp, or an off-the-shelf layer. CRDTs solve a problem this app doesn't have | [C] | Sync is an interview talking point precisely because the right answer is the boring one |

## 2. Contradictions between streams — resolutions

**C-top-segment vs. D-kill-list (resolved).** Stream C ranked weight-class athletes cutting to a weigh-in as the hardest, most reachable segment. Stream D killed rapid-loss targets and aggressive deficits. These collide head-on: the differentiator of dedicated cut apps (CutCoach, CUTCHECK) *is* the acute water-manipulation protocol — deliberate dehydration, medically dangerous, deaths on record in MMA. Resolution: the acute protocol is **killed** (safety + liability + D's veto spirit); what survives is date-anchored *gradual* descent planning with the deficit cap enforced — which is the medically recommended path for powerlifters (2-hr weigh-ins) anyway. The segment survives in harm-filtered form, but its scoring must reflect that the flashiest part of the need is the part we won't serve.

**A's "database is attackable" vs. C's "database is a commodity you assemble" (resolved).** Stream A shows MFP *can't* fix its database (business-model lock-in) — which tempts a "better database" play. Stream C shows the winning solo move is the opposite: treat the database as assembled open-data plumbing (MacroFactor's structural bet, executed with free sources) and put the product identity elsewhere. Resolution: never compete on database breadth; compete on what's computed above it. Finding 6 + numbers-hidden mode also shrink how much database precision even matters.

**B's "it's just a visualization" vs. A's "the gap is structural" (not a contradiction — a synthesis).** B is right that the recomp read is a chart plus a rules engine, approximable by eyeballing two apps. A is right that no incumbent can ship it: nutrition incumbents have no lift data, training incumbents have no intake/weight trend, and each side's data model, onboarding, and monetization fight the re-architecture. Copyability by *incumbents* is low even though the computation is simple. The honest threat is MacroFactor adding a lift logger (their SBS audience lifts) — named in recommended.md as the strongest case against.

**Unresolved:** whether the diet-culture-fatigue audience (numbers-hidden as a *general* product, not an ED-clinical one) actually logs anything at all. No stream produced evidence either way. Flagged as the open risk on that candidate.

## 3. Where fitness-industry conventional wisdom conflicts with the literature

This is where the differentiating features hide — each row is a claim incumbents' marketing still sells that the evidence contradicts, i.e., a feature an honest app ships that incumbents *won't*:

| Conventional wisdom | Literature says | Product opening |
|---|---|---|
| "Anabolic window — get protein in 30 min post-workout" | Timing has no meaningful independent effect once daily total is adequate [A] | An app that *refuses* to nag about timing and says why. Credibility as brand |
| "Track precisely or you're wasting your time" | Simplified monitoring: equal outcomes, better engagement, 4/5 RCTs [A/B] | Tier-based logging as the default, precision as opt-in depth. Incumbents can't lead with this — MFP monetizes the database, MacroFactor's algorithm demands sustained logging |
| "Can't gain strength in a deficit — stalled lifts mean eat more" | Strength is robust to moderate deficit; stalls are usually programming/recovery [A/B] | The plateau verdict that usually answers "fix your program" — an answer no nutrition app will give (it deprecates their own product) and no training app can give (can't see the deficit) |
| "Calorie counting works because the numbers are accurate" | Intake and expenditure errors are enormous; only *trends* in weight and load are trustworthy [B] | Build all verdicts on trend signals; treat logged intake as a behavior record, not ground truth |
| "More data + AI = better coaching" (Fitbod's pitch) | Fitbod's own documented failure: RDLs programmed the day after heavy deadlifts [C/D] | Don't generate programs. Read progress honestly against whatever program the user runs |
| "RED-S screening in consumer apps would protect athletes" | Computed EA error band wider than the diagnostic thresholds; false positives harmful in this population [B/C] | The restraint itself is the feature — and the interview story |

## 4. What the research killed

| Killed | Killed by | Reason |
|---|---|---|
| RED-S / energy-availability detection | B + D independently | Noise > signal; unvalidated thresholds; medical device; false positives harmful |
| Protein timing / anabolic-window features | B | [A] evidence against the effect itself |
| CKD / diabetes micronutrient management | D + C | Medical device (Class IIa+); segment unreachable through consumer channels |
| In-app ED screening | D | Screening tool is itself a medical device; signpost instead |
| Acute water-cut / dehydration protocols | D (via §2 resolution) | Safety, liability, deaths on record; deficit cap is architectural |
| Precision-first logging UX | D | [A/B] retention evidence; approximate-sustained wins |
| Restriction gamification (streaks, leaderboards, "lose faster") | D | Veto; spiral drivers; hard floor + cap enforced in code |
| ED-recovery as *target user* | C + D | Clinically sensitive population + solo unreviewed student app = wrong builder; keep numbers-hidden mode as inherited architecture |
| Better-database-than-MFP as the product | A + C | Curation debt economics; commodity assembly is table stakes, not identity |
| Commercial food APIs at v1 | C | Free tiers US-gated (FatSecret) or ToS-hostile to caching (Nutritionix/Edamam) |
| CRDT / OT sync engine | D | Wrong problem class for single-user multi-device; weeks of work for edge cases append-log already dissolves |

## 5. Consequential calls (running log)

1. **One research round, four streams, two Opus calls on B and D** — alternatives: more rounds, all-Sonnet, all-Opus. Reasoning: B and D are adjudication (wrong = expensive); A and C are collection (wrong = cheap to spot). Nothing returned justified a second round.
2. **Premise re-framed, not killed.** Stream B's negative on the computational moat is accepted at face value. The project proceeds on the surviving thesis: adherence + the recomposition read built on the two reliable signals. All ideation scoring treats "unique computation" claims as red flags rather than assets.
3. **Weight-cut segment retained only in harm-filtered form** (gradual, capped, powerlifting-oriented); acute protocols out of scope permanently, not deferred.
4. **Ethics/regulatory used as a gate, then a small weight.** Stream D's vetoes were applied before scoring (dead candidates never entered the list); residual risk gets 5% weight in ranking rather than dominating it, because the gate already did the heavy lifting.
5. **Recommendation: Verdict over Leucine Ledger (4.40 vs 4.25 — decided by tiebreakers, not arithmetic).** Alternatives seriously considered: Leucine Ledger (deeper moat, better data-engineering story, smaller reach), Blind (biggest structural moat, unresolved audience-exists question). Reasoning: Verdict is the only candidate that embodies the one integration claim Stream B left alive; three other top-seven candidates independently collapsed into it as features; its evidence floor is uniformly [A]/[A/B]. Flip condition recorded: if the developer is plant-based, Leucine Ledger wins on builder-segment fit. The named kill risk (payoff latency vs. two-week churn) and the named competitive threat (MacroFactor shipping a lift logger) are stated in recommended.md rather than hedged.
## Phase 2 — science-based-lifting pivot (2026-07-24, post-interruption)

Per user direction, Phase 2 was re-scoped: leaner (Sonnet workers, ceilings, small batches to stay under the session limit), focused on the **science-based / evidence-based lifting** niche. Two Sonnet research streams ran successfully; synthesis and ideation done by the Opus main thread (no subagent tokens). This supersedes the seven-stream exhaustive plan, which is parked in the resume checklist below if ever wanted.

### Premise status after the e1RM investigation

The premise-critical question Phase 1 dodged is answered: **e1RM trend is wounded, not killed.** Single-reading e1RM CV is 5–10% [B]; a single before/after comparison cannot see 4–8 weeks of intermediate progress (squat MDC ≈10 kg vs ~0.5–5 kg real gain). But a regression trend over 8–24 logged sessions pulls trend-SEM down to ~1–3.5 kg — same order as the signal. **Consequences, now hard design constraints for any candidate using e1RM:**
- Compute e1RM as a many-point regression, never point-to-point.
- Use only sets at **RIR ≤3** (RIR error is ±1 near failure, >2 reps out at RIR 7–10 [B]) and **≤10 reps** (formulas diverge ±15–20% beyond that [B]).
- For advanced lifters, say plainly when progress is below the noise floor rather than draw a confident line. *The honesty is the feature.*

### Conventional-wisdom vs evidence gaps (the niche's differentiator seams)

This is where a science-based product can do what incumbents won't, because incumbents sell the conventional version:

| Niche conventional wisdom | Evidence reality | Opening |
|---|---|---|
| Individualized MEV/MV/MAV/MRV volume landmarks you can locate from your logs (RP, $25–35/mo, built entirely on this) | Population dose-response "~10–20 sets/muscle/wk, plateau ~10" is [A] directional; **individualized in-app MEV/MRV detection is [C/D]** — asserted, not shown identifiable from training data | Track volume against the *evidenced population range* and refuse to fabricate a personal MRV number. Honesty as differentiation, aimed at the one audience that rewards it |
| Deload every 4–6 weeks, autoregulate from fatigue | [C] consensus; a 2024 RCT found a 1-wk deload gave no hypertrophy benefit and *worse* strength gains | A deload prompt the app can surface but must not dress as evidence-backed |
| Your e1RM number today | [B] pseudo-precision as a point value | Show a trend with a confidence band, not a number |
| Body-fat % from a smart scale | [B] for trend, [D] for absolute value | Trend only; never display the absolute number as truth |
| VBT autoregulation from your phone | [D]/unvalidated without a real transducer | Do not build phone-only velocity; stick to RIR |

### The most defensible integration gap (drives the recommendation)

Reconciling a **cut/bulk against training performance** is the one job that structurally requires both halves: MacroFactor adjusts calories from weight-trend alone and is blind to whether strength/volume tolerance is dropping in the deficit; RP/Hevy see training but not intake. Science-based lifters demonstrably pay for *both* (~$30–45/mo combined) and stitch the reconciliation in their heads. This is Phase 1's "Verdict" sharpened to the cut/bulk decision and aimed at a paying, reachable niche.

### CSV-import reality (Phase 1's "survival requirement", now corrected)

Partially true. **Hevy** exports CSV free [C] — that path works. **Strong** export is paywalled behind PRO [C] — the import path silently fails for free-tier Strong users. **Boostcamp** has no first-party export. **RP app** export status could not be determined. Column-level content (does the CSV carry RIR, not just weight×reps?) is unconfirmed for all. So import-driven onboarding is a real but *Hevy-specific* funnel, not the universal safety net Phase 1 assumed.

---

## Phase 2 — resume checklist (after 2026-07-24 session-limit interruption)

Wave 1 was dispatched as seven parallel agents; all were cut off by an Anthropic session limit (resets 02:00 Europe/London) before finishing. Salvaged and committed: three nutrition-incumbent teardowns (MFP, Cronometer, MacroFactor) and Stream C1's raw notes. To resume, dispatch in one wave once the limit clears:

- [ ] **Stream A (Opus)** — exercise science + measurement validity. **Premise-critical:** quantify e1RM trend error (carryover §2.1). Nothing salvaged.
- [ ] **Stream B (Opus)** — nutrition science depth. Nothing salvaged.
- [ ] **Stream C1 deliverables** — write `behaviour-change.md` + `abandonment.md` superset from the existing `04-sources/raw-notes/stream-c1-notes.md` (notes are thorough; may not need a fresh search pass).
- [ ] **Stream C2 (Sonnet)** — jobs-to-be-done; test the cross-app recomposition-read claim. Nothing salvaged.
- [ ] **Stream D1 finish** — `loseit.md` + `failed-products.md` (three incumbent files already done).
- [ ] **Stream D2 (Sonnet)** — training incumbents + adjacent products. **Load-bearing:** verify Hevy/Strong free-tier CSV export (carryover §2.3). Nothing salvaged.
- [ ] **Stream G (Opus)** — ethics/regulatory/licensing supersets; ODbL share-alike verdict. Nothing salvaged.
- [ ] Then Wave 2 synthesis, Wave 3 ideation, Wave 4 ranking + deep dives.

Lesson logged: a single wave of seven long-running Opus/Sonnet agents is enough to exhaust a session. On resume, consider dispatching in two smaller batches to stay under the limit.

---

6. **CSV import promoted from feature to survival requirement.** The verdict engine is mute for 4–6 weeks on fresh data while median tracker churn happens inside 2. Hevy/Strong import converts existing two-app users' history into a day-one verdict — it is the only mitigation found for the payoff-latency failure mode, so it ships first, not last.

## M0 — skeleton build (2026-07-24)

Branch `m0-skeleton`, not yet merged to `main`. Code-complete; full status in `PROJECT-STATE.md`.

7. **The stack resolved newer than BUILD-PLAN assumed, and that was accepted.** BUILD-PLAN specified React 18; the scaffold landed on React 19.2.7 (also Vite 8.1.1, TypeScript 6.0.2, Tailwind 4.3.3, Vitest 4.1.10) because the scaffolder no longer offers React 18 at all. Accepted as version currency, not an architecture change — nothing in the plan depended on 18-only behaviour. Flagged to the developer at the time. Reversal trigger: none identified; would only revisit if some dependency turns out to need React 18 compatibility.
8. **The non-OPFS fallback ships as in-memory only, with no IndexedDB persistence — a deliberate, scoped deviation from BUILD-PLAN.** BUILD-PLAN §M0 calls for "graceful IndexedDB fallback," and the supporting research (`01-research/technical/sqlite-wasm-findings.md`) recommends an in-memory database with periodic export to IndexedDB via `sqlite3_js_db_export`. What shipped (`app/src/db/sqlite.worker.ts`) is `new sqlite3.oo1.DB(':memory:')` with no export layer, so data in that mode dies with the tab. Rationale: the fallback only engages on old Safari, in Private Browsing (no OPFS at all there), or a second tab (the SAHPool VFS is single-connection), and M0 has no user-facing write path — building the export layer now would be speculative work on a path M0 exists to determine the importance of. **Must close before M2**, the milestone that introduces user writes: the day a user logs a workout in a second tab, that workout is silently lost. Reversal trigger: the first M2 commit that writes user data, or an iPhone gate result showing the fallback engaging in normal (non-Private) browsing.
9. **Reviewing found and fixed four defects that would each have caused silent data loss or a hang.** Process note: an interrupted first boot could leave a permanently half-seeded exercise table that looked complete forever; a failed init resolved successfully on every subsequent call; RPC calls made after a worker crash hung forever with no timeout; and a throwing rollback destroyed the original migration error right before the iPhone gate that depends on reading that error. All four were found by review of already-"green" code, not by the test suite — none reversed anything, recorded as a process lesson for later review passes.

## M1 — the A+C interaction on real claims (2026-07-25/26)

Branch `m1-advice-interaction`, not merged. Full build ledger: `.superpowers/sdd/progress.md`.

10. **The generated claim bundle is TypeScript, committed to git, and guarded by a drift test.** `scripts/build-claims.ts` validates every `claims/*.yaml` with Zod and emits `src/generated/claims.ts` typed as `Claim[]`. Three gates stack: Zod at generation time (DOI shape, calendar-real dates, enums), `tsc` against the pinned types, and a test that re-runs the generator in memory and byte-compares the committed output. Committing the artefact means `test`, `typecheck` and `build` need no generation-ordering step; the drift test is what stops the committed copy going stale. Reversal trigger: if the base grows past a few hundred claims and the diff noise outweighs the convenience, move to build-time generation with a `prebuild` hook.
11. **Charts are hand-rolled SVG, not recharts.** BUILD-PLAN's own escape hatch ("custom SVG only if a band/annotation need exceeds it") applies: M1's only chart need is an effect-size strip with a forced zero baseline and sample size as countable marks. Roughly forty lines against ~100 KB of library. Revisit at M2, when e1RM trend charts with confidence bands arrive and the need is genuinely a charting one.
12. **No `react-router` at M1.** One screen with in-card progressive disclosure. Routing arrives with M2's logging screens.
13. **`Population` gained an `'unstated'` member, and `year` follows the journal issue rather than CrossRef.** Curation forced both. `population` was required and non-nullable, but plenty of abstracts never state training status — the schema was compelling a guess, which is the inference the curation rules forbid, and it would have quietly defeated FR-CLAIM-5, which can only drop a grade for a population mismatch you can see. Separately, CrossRef registers the online-first date, so Morton reads 2017 though it is universally cited as 2018; `year` is now the version-of-record issue year, since that is the citation a reader will match. CrossRef remains the authority for whether a DOI *resolves*.
14. **`GradeChip` was renamed `ConfidenceTicks`, and the rename is the design.** BUILD-PLAN named a `GradeChip`. DESIGN.md bans rendering a grade as a pill badge, because that is precisely the affordance users have learned to skim — the D3 failure mode. The component is a four-slot counter whose filled count equals the grade, so the name follows the thing.
15. **The visual world is Isotype/Neurath pictorial statistics fused with an editorial register, chosen with the developer over three rounds of mockups.** Isotype's founding rule — quantity is shown by repeating a countable mark, never by scaling one, because scaling misleads — is the product's thesis expressed as graphic grammar. Recorded in `DESIGN.md`, which also carries the developer's chosen hue-coded tick variant *together with the argument against it*, at their request: hue lets a reader learn "green means trust it" and skim, which is the badge behaviour by the back door. It ships because colour is redundant to the count and the label, and because the ramp deliberately avoids traffic-light semantics — no red anywhere, [D] resolves to grey, since a [C] claim is not bad advice but less certain advice. Falsification condition and review triggers are written into `DESIGN.md`.
16. **The three-layer architecture was corrected by the developer mid-milestone.** Study detail does not appear until asked for: layer 1 is the advice, layer 2 the source plus how well supported it is, layer 3 the figures and caveats. The grade stays on the default card, so principle 7 still holds — what moved behind the tap is the study detail, not the confidence.
17. **The whole-branch review blocked the milestone on a claim record, not on code, and it was right to.** `c-rest-at-least-60-seconds` asserted that rest stops mattering past 90 seconds. The figure is real and appears in Singer 2024's abstract — but nothing in the *stored record* carried it, so a reader tapping through to check would find no support for the number. In a product whose promise is verifiability, unverifiable-from-the-record is the same failure as fabricated, seen from the user's side. Fixed by extracting the 60 s and 90 s bounds into `figures`, adding the supporting quote, and rewording the statement; regraded [B]→[C] because the record's own text says every controlled credible interval crosses zero while the statement asserted the effect flatly. Two further grades ([A]→[B] on `c-deficit-impairs-lean-mass` and `c-protein-timing-total-intake-dominates`) were lowered in the same pass for resting on citations whose population and sample size could not be read. **Process lesson: every automated guard in M1 passed on this claim.** The schema validates DOI shape, not whether a number appears in the paper; the certainty-word guard scans for "proven", not for unsupported quantities; the provenance tests prove attribution, not support. The only check on whether a claim is *supported* is a human reading it adversarially, and the first hostile read missed it. Budget a second adversarial pass per claim, by a different reader, before M6's expansion to ~50.

## Naming (2026-07-26)

18. **The product name is confirmed: MyoStat.** `PRODUCT.md`'s Brand Commitments and `REQUIREMENTS.md`'s "Working name: TBD" had both explicitly flagged this as an open decision since M0 — the shipped title "Evidence-graded training log" was a scaffold placeholder, never brand truth. The developer settled it as MyoStat. Changed everywhere the placeholder functioned as the product's actual name: `app/index.html` `<title>`, the PWA manifest `name`/`short_name`/`description` in `app/vite.config.ts`, and `app/package.json`'s package name. `PRODUCT.md` and `REQUIREMENTS.md` updated to record the confirmation rather than the open question. `app/CLAUDE.md` and `BUILD-PLAN.md`'s H1 titles gained a `MyoStat —` prefix for at-a-glance context in docs read at the start of most sessions; their existing "Evidence-Graded Lifting & Nutrition PWA" subtitle was kept as the category description, not replaced. **Only the name is settled — no logo, wordmark, palette, or typographic lockup was decided or implied by this**, per the updated Brand Commitments section.

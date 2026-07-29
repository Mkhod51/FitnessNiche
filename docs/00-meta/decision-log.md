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

## Trackers redesign — the health-hub surfaces (2026-07-28)

Design-only work across six consulted gates, each decided from rendered phone-width options.
Full record with the mockups' reasoning: `superpowers/plans/2026-07-27-trackers-redesign.md`.

19. **The committed visual world survives contact with Hevy and MyFitnessPal; only their structure was borrowed.** The conflict turned out to be far smaller than it looked. Hevy's set row is a data table — aligned numeric columns under a label row — and `DESIGN.md` already specified tabular figures, sans-caps labels, hairline rules and no rounded content corners. It was, near enough, already a specification for that table, and **no prohibition had to be waived to build it.** What was refused: dark-by-default, rounded fields, a saturated accent, and the PR pill — that last being precisely the skimmable badge the direction exists to reject (D3). Navigation is three tabs (Hub · Train · Eat) with evidence as the Hub's own content rather than a fourth tab, because a four-tab bar spends the home position on the tab users press least and this product's differentiator lives there. The tab bar stays visible during a live workout, knowingly costing ~54px in the design scene to keep one navigation grammar instead of two. **Reversal trigger:** if set-entry testing shows visible row count is the binding constraint mid-workout, revisit the session-takeover variant.

20. **Dark mode ships, derived rather than inverted, and the confidence ramp was re-computed against it.** `DESIGN.md` had deferred dark on an explicit condition — a second ground must be *designed* and the ramp *re-derived*, since every ramp colour was computed against `#FBFAF7`. Both were done. The ground is a warm near-black in the paper's own hue family; the ramp keeps its ordering, still contains no red, and [D] still resolves to grey. Contrast was computed rather than eyeballed: ink 15.41 · ink-soft 8.39 · ink-faint 5.04 · A 8.03 · B 8.92 · C 8.03 · D 6.49 · flag 6.14, all ≥4.5:1 so 9px tracked labels keep their legality. Light remains the documented default because the gym-glare reasoning is unchanged; the runtime follows `prefers-color-scheme` with a manual override. **Known cost:** dark doubles the surface every screen is checked against, and five existing components hard-code the light ramp — `FigureChart` and `TrendChart` draw hand-rolled SVG and are the real work. **Reversal trigger:** if the ramp proves unreadable on a real phone in a gym, re-derive the ramp again rather than abandon the ground.

21. **Figures moved from monospace to the system sans with tabular numerals.** The durable rule in `DESIGN.md` was always *tabular alignment* — "figures must align in columns" — and monospace was only how it was implemented. Menlo is a coding face and made a set of reps read as console output; the developer rejected it on sight. `system-ui` with `font-variant-numeric: tabular-nums` aligns just as strictly, is SF Pro on the iPhone this is actually used on, and ships at zero cost. **Consequence to hold:** figures are no longer distinguishable from sans labels by face alone, so size and case now carry that separation. The rule "a number set in the serif face is a bug" is unchanged.

22. **`DESIGN.md` gained a Controls section, which it had entirely lacked.** The file was written for a read-mostly advice feed and specified no button, no numeric field, no completion control, no timer, no tab bar, no switch and no destructive confirm — so every control in the tracker mockups was undefined vocabulary. The new section derives all of them from the usage scene rather than from convention, and adds four prohibitions: **no meter that depletes toward zero** (GR-1 expressed as geometry), **no truncated claim statement**, **no filled red button**, and **no numeric keyboard where a tap target will do** in the mid-workout scene.

23. **GR-1 held under direct pressure, and the resolution came from an asymmetry rather than a refusal.** The developer asked for MyFitnessPal's "calories remaining" counter — the one pattern GR-1 names explicitly. Rather than refusing or complying silently, both day views were built identically and rendered side by side. The distinction that resolved it: **"protein — 40 g to go" and "calories — 590 remaining" look like the same control and are not the same psychology.** Protein is a floor being reached, so a protein countdown encourages intake and GR-1 has no quarrel with it — it ships literally. Calories in a cut are a ceiling, and a budget depleting toward zero makes an empty bar the day's objective, which is the mechanism GR-1 names and why exercise-calories-added-back sits in the same clause. The developer chose the filling bar; **GR-1 is unamended.** Recorded honestly at the time: that clause rests on **[B/C]** evidence, not [A], and the developer was told so rather than sold a stronger case than exists. The independent measurement objection is stronger and binds both versions — intake self-report error runs 12–54%, so any figure quoted to the kilocalorie overstates its own precision. Exercise calories are never added back in either version, indefensible on data alone (wearable expenditure error 15–57%).

24. **FR-LOG-3 was amended: gram entry becomes the primary control.** Traded against **[A/B]** evidence — stronger than the [B/C] behind the GR-1 clause defended in #23. The asymmetry that justifies treating them differently: **FR-LOG-3 is a retention finding, not a harm one.** Choosing familiarity over retention-optimisation is a legitimate product bet; choosing it over a safety guard would not be. **Reversal trigger:** logging abandonment in real use.

25. **v1 does not interrupt mid-workout, and the reason is a claim-base fact rather than a preference.** The brief asked for the interruption to be justified; it could not be. Of 17 curated claims, **ten have `predicates: null`** and the seven with predicates read only `goal`, `deficitWeeks`, `proteinPerKg7d`, weekly `muscleSets` and `e1rmTrend` — **every one a multi-week aggregate.** Nothing in the base can fire because of something that happened in the last 90 seconds, so advice is selected once at `Start workout` from the multi-week snapshot. An interruption must be actionable inside the session to be worth the cost, and nothing qualifies: the volume claim concerns next week's programming, the deficit claims the last six weeks, and the only claim touching a within-session decision is `c-rest-at-least-60-seconds`, **[C]**, whose own record states every controlled credible interval crosses zero. Interrupting a set to deliver that is the D3 failure exactly — teaching the user that this app's advice is noise. The peek is therefore *present*, never intrusive: no motion, no sound, no focus steal, one per session, 7-day cooldown per claim, permanently dismissible.

26. **RIR gets a permanent, visible column and stays genuinely optional — because it silently gates the product's headline signal.** Found by reading `src/domain/e1rm.ts` rather than the docs: `setE1rm(weightKg, reps, rir)` takes `rir: number`, **not nullable**, and `MIN_TREND_POINTS = 8`. So no RIR → no qualifying set → no e1RM point → no trend → **AC-2 is never demonstrable and FR-SIG-5 has nothing to reconcile.** Compounded by OQ-2: if Hevy's CSV lacks an RIR column, imported history — the intended mitigation for payoff latency — contributes zero e1RM points. The rejected screen made RIR the third field, optional, placeholder "not recorded": a faithful reading of FR-LOG-1 and simultaneously an invitation to skip the one input the thesis runs on. Resolution: a permanent column with a **visible dashed empty state**, tapped to open a 0/1/2/3/4+ target row rather than a keyboard, never blocking a save, with the consequence explained once and factually in the finish summary ("9 of 12 qualifying") rather than nagged per set. **Visibility is the mechanism; pressure is not.**

27. **The session model becomes explicit, which fixes a live midnight bug.** `src/db/workouts.ts` defines a session as "the most recent workout, if it started on today's local calendar date" — so a lifter starting at 23:30 has their session **silently split into two workouts at 00:00.** Explicit `finishedAt` removes the rule that causes it rather than patching around it. An abandoned session stays open and resumable with a resume-or-discard offer, because silently closing someone's session is a lost write and NFR-1 does not permit that.

28. **The deficit cap renders its own evidence, making the safety guard and the differentiator one mechanism.** GR-1's ≤500 kcal/day cap is usually the kind of rule an app asserts. Here it does not have to be: `c-deficit-beyond-500-blocks-lean-mass` [B] (Murphy & Koehler 2022) already says exactly this, stored quote "individuals performing RT to preserve LM during weight loss should avoid energy deficits >500 kcal day-1". The cap therefore renders through the same `ClaimCard` machinery as any other advice, at its own grade and with its own uncertainty. **GR-4 binds the wording:** the claim's own record calls it a population-level threshold rather than a personal one, so the copy never reads "your limit is 500".

29. **The calorie estimate is a measurement statement, not advice — a boundary no automated guard covers.** Mifflin–St Jeor renders as "2,500 kcal/day, plausibly 2,180–2,820": a range, because T3 forbids displaying a number the app cannot defend and a bare 2,500 is pseudo-precision. The screen states that observed maintenance replaces the equation after two to three weeks, which is on-thesis rather than a hedge — this project's own research says expenditure estimates are unreliable and only weight and e1RM trends are trustworthy. **The boundary to police:** "your estimated maintenance is 2,500 ± 320" is governed by T3; "you should eat 2,500" would be advice governed by T1/GR-6 and would need a stored `claim_id`. The confirm button reads "Use 2,500 as maintenance" — the user chooses, the app does not instruct. **The provenance test checks advice render paths and this is not one, so it will not catch a drift across that line.** Review responsibility, logged so it is not rediscovered late.

30. **No fourth tab, and bodyweight logging is not settings.** The developer proposed one new tab for settings, body metrics and the calorie calculator, and asked for an opinion. Settings sits behind a gear on the Hub — a tab bar is for frequent destinations and settings is visited about twice a year, which is why Hevy and MyFitnessPal both do this; GR-1 requires settings to *exist* ("static signpost to Beat/NHS in settings", verbatim) but not to be a tab. Bodyweight logging goes on the Hub because it is a **logging surface** — frequent, offline-first, consent-gated — and bodyweight is one of only two signals this project's research grades trustworthy; burying the daily weigh-in in configuration would make the most defensible measurement in the product the hardest to reach. The calorie calculator lives inside Eat's goal setting, because **a calculator that produces a calorie target is a target-setting path** and a second one is exactly what the `guards.ts` choke-point rule exists to prevent. Schema consequence: `users` gains `birth_year` — a year rather than an age, since an age column is wrong within twelve months and nothing would correct it.

31. **No placeholder claims, ever — and none are needed.** The developer asked whether curation could defer behind placeholders, and invited a correction if that were risky. It is both risky and unnecessary. **A fabricated claim in `claims/*.yaml` would pass every existing guard:** Zod validates DOI *shape* not resolution, the drift test only checks the bundle matches the committed copy, and the provenance test proves advice renders *from* a claim record — which a fake record satisfies perfectly. It would be indistinguishable from a curated claim, and #17 already records a *real* claim with an unsupported number surviving every automated guard, caught only by hostile human reading. It is unnecessary because `evaluateClaims(snapshot, claims)` is pure and takes claims as an argument, so selection tests use fixtures declared in test files that never enter `claims/`; and `c-volume-dose-response` is real, [A], and its stored predicate genuinely fires from logged data, exercising the whole pipeline end to end. **If a future session finds itself wanting a placeholder claim, that is the signal to curate a real one instead.**

## OQ-2 answered (2026-07-29)

32. **Hevy's free CSV export carries `rpe`, not `rir` — and RIR is recoverable from it.** The
open question since Phase 2 was whether the free-tier export carries RIR or only weight×reps,
because the answer decides whether imported history can feed the e1RM trend at all. It carries
neither directly. The header is `title, start_time, end_time, description, exercise_title,
superset_id, exercise_notes, set_index, set_type, weight_lbs, reps, distance_miles,
duration_seconds, rpe`, confirmed against two independent descriptions of a real export. RPE is
on the standard 1–10 scale, so **RIR = 10 − RPE**.

**This is better than BUILD-PLAN assumed.** M2 Task 8 was written expecting `rir: null` on every
imported set, which would have excluded all imported history from e1RM and left payoff latency
unmitigated. Imported sets with a recorded RPE now qualify.

**But the pessimistic path still has to work**, and does: `rpe` is optional per set and is
commonly blank — the one worked example available shows it empty — so a blank imports as
`rir: null` and `setE1rm` excludes it. Both outcomes are normal and neither is an error.

Two further consequences the answer forced:
- The export is in **pounds** (`weight_lbs`) for imperial users and `weight_kg` for metric ones.
  Importing 225 as kilograms would be a 2.2× error on every lift that looks entirely plausible,
  so the parser converts and handles both headers.
- `set_type` distinguishes `warmup` from `normal`, which maps directly onto the `set_type` column
  added in migration 0002 — so imported warm-ups stay out of weekly volume and out of e1RM
  without any extra work.

**No real export file could be obtained**, so the parser reads the header **by name rather than
by position** and reports anything it cannot place instead of guessing. If the real format
differs from the documented one, it says so rather than silently importing wrong numbers.
**Reversal trigger:** a real export that fails to parse — the problem list will name the column.

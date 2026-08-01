# Trackers redesign — running decision record

> **Status:** design in progress, gate by gate. **No implementation code until Gate 5 sign-off.**
> This file accumulates decisions as each gate closes. At Gate 5 it is consolidated into
> `DESIGN.md`, `docs/00-meta/decision-log.md` and `docs/BUILD-PLAN.md`, and this file becomes
> the milestone plan.

**Context.** M2 (`docs/superpowers/plans/2026-07-26-m2-training-loop.md`) is interrupted after
Task 6. Tasks 7 (weight logging + trends) and 8 (Hevy CSV import) are unstarted. The developer
rejected the Task 6 logging screen's layout — its *behaviour* is the reference, its *layout* is
what is being replaced.

**Verified state at the start of this work (2026-07-27), not taken on trust:**
typecheck clean · 260 unit tests / 27 files · build OK · e2e 11/11 · branch `m2-training-loop`,
one commit ahead of `origin/m2-training-loop`, working tree clean.

> **⚠ ANOTHER SESSION WAS BUILDING M2 WHILE THIS DESIGN WORK HAPPENED. READ THIS BEFORE PLANNING
> ANY TASK.**
>
> The 260/27 baseline above was measured at 2026-07-27 ~12:30 and was correct then. **Four
> commits landed at 23:52–23:55 the same evening and are pushed:**
>
> ```
> f22f92c  count a compound set fractionally against every muscle it works   → domain/volume.ts
> e1024cb  draw the trend line, but only when there is one to draw           → components/TrendChart.tsx
> f37d3a5  give bodyweight the same durable write path as a set             → db/weights.ts
> 81f7ed3  log bodyweight the same one-tap way as a set                     → features/log/LogWeight.tsx
> ```
>
> Plus uncommitted work-in-progress on the trends screen (`getSetsSince` in `db/workouts.ts`
> and a red `features/trends/Trends.test.tsx`), which was **stashed** at the developer's
> instruction on 2026-07-28 to start clean:
> `git stash list` → `stash@{0}` — recoverable, not discarded.
>
> **Verified state after the stash (2026-07-28):** typecheck clean · **279 unit tests / 31
> files** · build OK · branch `m2-training-loop` **in sync with origin**.
>
> **THIS INVALIDATED THREE STEPS OF THE FIRST DRAFT OF §5.5**, which is corrected below.
> `volume.ts`, `TrendChart` and `LogWeight` all now exist. Anyone planning a task here must
> `ls src/domain && ls src/features` before trusting any "still unwritten" claim in a document —
> including this one.
>
> **Coordination hazard:** if more than one session works this branch, they will collide.
> Agree who owns `app/` before dispatching anything.

---

## Gate 1 — information architecture · CLOSED 2026-07-28

### D-G1.1 — Navigation is three tabs: Hub · Train · Eat

Evidence lives on the Hub as its own content, not as a fourth tab. Trends, weight logging and
settings hang off the Hub rather than earning tabs.

**Reasoning.** A four-tab bar spends the home position on a tab users press least — and this
product's entire differentiator lives in that tab. The Hub *is* the evidence surface, which is
what route `/` already is today, so this is continuous with what exists rather than a rewrite.
Three tabs also leave room for Trends and Settings without a fifth tab or a nested menu.

**Reversal trigger.** If Trends becomes something a user opens daily rather than weekly, it has
outgrown the Hub and the tab count should be revisited.

### D-G1.2 — The tab bar stays visible during a live workout

Chosen by the developer over the session-takeover alternative.

**Reasoning.** Buys one-tap access to food and hub mid-session and keeps one navigation grammar
instead of two. **Known cost, accepted:** ~54px of permanent chrome in the 90-second scene the
product is designed around — roughly one set row.

**Reversal trigger.** If set-entry testing shows the visible row count is the binding constraint
on the mid-workout scene, revisit the takeover (option C on the Gate 1 board).

### D-G1.3 — The committed visual world is kept; Hevy/MFP contribute structure only

**Reasoning.** The conflict was much smaller than it appeared. Hevy's set row is a data table —
aligned numeric columns under a label row — and `DESIGN.md` already specifies tabular figures,
sans caps labels, hairline rules and no rounded content corners. It was, near enough, already a
specification for that table. **No prohibition had to be waived to build it.** MyFitnessPal's day
view is the same story: grouped rows with numbers on the right.

What was *not* adopted: dark-by-default, rounded fields, a saturated accent, and the PR pill —
that last one is precisely the skimmable badge the direction exists to refuse (D3).

### D-G1.4 — `DESIGN.md` gains a controls section; it is not rewritten

**The real gap is not aesthetic.** `DESIGN.md` was written for a read-mostly advice feed and
specifies **no interactive controls at all**: no primary button, no numeric field at thumb scale,
no completion control, no timer, no tab bar, no destructive confirm. Every such control on the
Gate 1 board is vocabulary the file does not yet have. That is an extension with a real design
pass, not a rewrite.

### D-G1.5 — Figures move from Menlo to the system sans with tabular figures

`font-family: system-ui` + `font-variant-numeric: tabular-nums`.

**Reasoning.** The durable rule in `DESIGN.md` is *tabular alignment* — "figures must align in
columns". Monospace was the implementation, not the rule. Menlo is a coding face and made a set of
reps read as console output. SF Pro's tabular figures satisfy the alignment rule exactly, ship at
zero cost, and are what the incumbents effectively use. **Known cost:** figures are no longer
visually distinct from sans labels, so the type system leans harder on size and case.

**`DESIGN.md` edit required:** the Type table's "Figures, counts, units" row. The rule
"a number set in the serif face is a bug" is unchanged and still holds.

### D-G1.6 — Dark mode ships, derived rather than inverted

Light remains the documented default. Runtime selection: **follow `prefers-color-scheme`, with a
manual override.**

`DESIGN.md` deferred dark mode with a specific condition — a second ground must be *designed* and
the confidence ramp *re-derived*, because every ramp colour was computed against `#FBFAF7`. That
condition is met below. The ground is a warm near-black in the paper's own hue family, not a
blue-black. **The ramp keeps its ordering, still contains no red, and [D] still resolves to grey.**

Contrast computed against each ground, not estimated:

| Role | Light | Ratio | Dark | Ratio |
|---|---|---|---|---|
| paper | `#FBFAF7` | — | `#1A1816` | — |
| paper-sunk | `#F6F3EB` | — | `#22201D` | — |
| ink | `#141414` | 17.65 | `#F2EFE7` | 15.41 |
| ink-soft | `#57534A` | 7.34 | `#B8B2A6` | 8.39 |
| ink-faint | `#767162` | 4.67 | `#8F887C` | 5.04 |
| rule | `#E6E1D4` | — | `#302D28` | — |
| rule-strong | `#DAD5C7` | — | `#4A453C` | — |
| conf-a | `#1F5C3D` | 7.57 | `#6FBF8F` | 8.03 |
| conf-b | `#5B7B3A` | 4.64 | `#9FC46A` | 8.92 |
| conf-c | `#8A6A00` | 4.86 | `#D6A83C` | 8.03 |
| conf-d | `#6B6459` | 5.60 | `#A39C8E` | 6.49 |
| flag | `#B0453A` | 5.35 | `#E8776A` | 6.14 |

All ≥4.5:1, so the 9px tracked labels stay legal with no large-text exemption.

**Known cost, accepted:** dark doubles the surface every future screen is checked against, and the
four M1 components (`ConfidenceTicks`, `ClaimCard`, `EvidencePanel`, `FigureChart`) currently
hard-code the light ramp — `FigureChart`'s hand-rolled SVG strokes especially need a dark
counterpart. **The gym-glare argument for a light default is unchanged and still stands.**

**Reversal trigger.** If the ramp proves unreadable on a real phone under gym lighting in dark
mode, the ramp is re-derived again — not the ground abandoned.

### D-G1.7 — Mid-workout advice uses a sheet peek, with two amendments

Chosen by the developer from four rendered variants.

**The concern that was raised, and how it is resolved rather than accepted.** The sheet peek's
weakness is that it truncates the claim to one line — and a half-read claim is exactly where
overstatement comes from. Principle 7 exists to stop nuance being the part that gets cut, so a CSS
ellipsis through a claim statement is a thesis violation, not a layout detail. Two amendments make
the chosen form safe:

1. **A curated short form in the claim record.** Add a `peekStatement` field to the claim schema,
   Zod-gated like every other field, so the peek renders **a complete curated sentence rather than
   an ellipsis**. Still rendered from the claim record; still bound to `claim_id`; T1/GR-6 intact.
   Cost: one schema field, re-curation of 17 claims, and the existing drift test covers it.
2. **Tap expands, not only drag.** Drag is the least reliable gesture with sweaty hands. The whole
   peek is a tap target; drag remains as an alternative, never as the only route.

The confidence counter and its text label render at full size in the peek regardless of available
space. That is non-negotiable — it is the one thing that cannot be traded for compactness.

**Frequency budget, to be confirmed at Gate 4:** at most one advice peek per session, selected
before the first set, permanently dismissible, and never re-shown for the same claim within seven
days. An advice surface that can fire twice in one workout gets turned off, and then the
differentiator is off.

### F-G1.1 — Load-bearing finding: no claim can currently fire from within-session state

Checked against the claim base rather than assumed. Of 17 curated claims, **ten have
`predicates: null`** and can only ever be reached by search. The seven with predicates read exactly
these variables: `goal`, `deficitWeeks`, `proteinPerKg7d`, weekly `muscleSets`, `e1rmTrend`.

**Every one is multi-week aggregate state.** Nothing in the base can fire because of something that
happened in the last 90 seconds. So "advice appearing mid-workout" cannot mean advice generated by
the set just logged — T1/GR-6 forbids generating it, and no stored predicate can currently earn it.

The working resolution, to be settled at Gate 4: the session's advice is **selected at
`Start workout`** from the multi-week snapshot, and the peek surfaces it. The one existing claim
touching a within-session decision is `c-rest-at-least-60-seconds`, graded **[C]**, whose own record
states every controlled credible interval crosses zero — grade-calibrated language renders that
"suggested, on limited evidence", which is an honest and weak reason to interrupt anyone.

---

## Gate 2 — workout tracker · CLOSED 2026-07-28

### F-G2.1 — Load-bearing finding: RIR gates the product's headline signal

Checked in `src/domain/e1rm.ts` rather than assumed. `setE1rm(weightKg, reps, rir)` takes
`rir: number` — **not nullable** — and `MIN_TREND_POINTS = 8`.

The chain: **no RIR → no qualifying set → no e1RM point → below 8 points, no trend → AC-2 is never
demonstrable and FR-SIG-5 reconciliation has nothing to reconcile.** Compounding it: RIR ≤ 3 only,
so sets taken further from failure are excluded even when recorded; and per OQ-2, if Hevy's free
CSV carries no RIR column then every imported set is disqualified too — meaning imported history,
the intended mitigation for payoff latency, contributes zero e1RM points.

The rejected screen made RIR the third field, optional, placeholder "not recorded" — a faithful
reading of FR-LOG-1 and simultaneously an invitation to skip the one input the thesis runs on.

### D-G2.1 — RIR gets a permanent column and stays genuinely optional

Developer's decision, stated explicitly: option A's layout, **RIR not compulsory**.

- Sixth column, always present, **visible dashed empty state** — so a skipped RIR reads as a blank
  someone left, not as a field that does not exist.
- Tapping the cell opens a **0 / 1 / 2 / 3 / 4+ tap-target row, never a numeric keyboard.** A
  keyboard in the 90-second scene with sweaty hands is the wrong control.
- **Never blocking.** A set ticks and saves with RIR empty, storing `rir: null`. No pre-filled
  default, no confirmation prompt, no validation gate — FR-LOG-1 is preserved exactly.
- The consequence is explained **once, factually, in the finish summary** ("9 of 12 qualifying"),
  never as a per-set nag. Visibility is the mechanism; pressure is not.

**Reversal trigger.** If set entry measurably slows, fall back to asking only on each exercise's
top set — accepting that this pushes the first honest e1RM trend roughly a month further out.

### D-G2.2 — Warm-up sets marked in-line, with the exclusion stated

`W` in the set column, `ink-faint` row, RIR cell a dash rather than an input. **Working sets
renumber from 1 independently of warm-ups**, so "set 1" means the first working set.

The correctness requirement — warm-ups excluded from weekly volume and from e1RM input — is
non-negotiable. The design requirement is that the exclusion is **stated in plain words**: without
it a user counts 14 rows, sees 12 sets in their weekly volume, and reasonably concludes the app is
broken. **Silent correctness reads as a bug.**

### D-G2.3 — No tonnage in the session header

Header shows: workout name · working-set progress · elapsed time · Finish (top-right, always
reachable without scrolling).

**Reasoning.** T3 forbids displaying a number the app cannot defend. Tonnage is arithmetically
exact and analytically close to meaningless — it rewards light high-rep work over hard heavy work,
swings with warm-up inclusion, and is comparable neither across exercises nor across people. It
looks like a measurement and behaves like a score. It is also a per-session number that only ever
goes up, which is the same psychology GR-1 bans as leaderboards and streaks, pointed at training
instead of food; the project's own research found soft framing does not hold and only removed
affordances do.

**Known cost, accepted:** a real loss of familiarity against Hevy.
**Reversal trigger.** If it ships after all, it counts working sets only and is labelled as
tonnage, never dressed as progress.

### D-G2.4 — Supersets are out of v1, with no schema column reserved

Nothing in `REQUIREMENTS.md` asks for them and NG3 signals programme structure is not v1's
business. Deferring is cheap: the migration runner is transactional, so a nullable column later is
a small safe migration. Reserving one now is speculative schema that quietly becomes permanent.

**What they would have cost:** a grouping column or table, grouped rendering, rest-timer semantics
firing after the group rather than the set, and a decision on how alternating exercises count
toward per-muscle volume — which touches `volume.ts`, still unwritten.

### D-G2.5 — Session start: empty, or repeat a previous logged session

**NG3 constrains this screen.** "No program-template authoring" is an explicit v1 non-goal, and
routines are most of Hevy's start screen. **Repeating a previous session is not template
authoring** — it copies the exercise list from a workout the user actually logged — so it is the
honest substitute and needs no authoring UI.

### D-G2.6 — The rest timer's default duration is presented as a preference, not a recommendation

Auto-starts when a set is ticked, never blocks, tap to skip. The default reads as *"Default 2:00.
A preference, not a recommendation — what the evidence actually says →"*, linking to
`c-rest-at-least-60-seconds`.

**Why it must.** That claim is graded **[C]** and its own stored record states every controlled
credible interval crosses zero (arm 0.13, thigh 0.17, whole body −0.08). Shipping a default that
implies a recommendation would be dressing a [C] as guidance — the same discipline GR-4 already
applies to deload prompts. It is the smallest feature in the app that demonstrates the whole
thesis, because a competitor cannot say this without having graded the claim first.

### D-G2.7 — Explicit start/finish replaces the implicit session rule, fixing a live bug

Today `src/db/workouts.ts` creates a workout lazily from the first set and defines a session as
"most recent workout, if started on today's local calendar date". **That is wrong at midnight:** a
lifter starting at 23:30 has their session silently split into two workouts at 00:00.

Consequences for Gate 5: `workouts` gains `name` and `finishedAt`; `findOpenWorkout`'s same-local-day
rule is replaced by "most recent workout with `finishedAt IS NULL`"; an abandoned session stays
**open and resumable**, with the Train tab offering resume-or-discard — because silently closing
someone's session is a lost write, and NFR-1 does not permit that.

## Gate 3 — nutrition tracker · CLOSED 2026-07-28

### D-G3.1 — GR-1 holds. The calorie bar fills toward the target; it does not deplete toward zero

The developer's first instinct was MyFitnessPal's literal "calories remaining" counter. Both
versions were built and rendered side by side, identical in layout, type scale and emphasis. The
developer chose the filling version, so **GR-1 is unamended and no spec change is required.**

**The asymmetry that resolved it.** "Protein — 40 g to go" and "Calories — 590 remaining" look like
the same control and are not the same psychology. Protein is a **floor being reached**; a protein
countdown encourages intake and nothing in the ED-harm research treats it as a risk, so it ships
literally. Calories in a cut are a **ceiling not to be exceeded**; a budget depleting toward zero
frames eating as spending and makes an empty bar the day's objective, which is the mechanism GR-1
names — and why exercise-calories-added-back sits in the same clause.

**What shipped therefore gives the brief almost everything it asked for:** calories leading at
34px with a full-width bar, a large protein bar directly beneath with a real countdown, protein
most emphasised, carbs/fat/fibre as small figures underneath. Only the direction of one bar and
one word in one label differ.

**Recorded honestly:** the eat-back-to-zero prohibition rests on **[B/C]** evidence
(`01-research/constraints/ethics.md` via decision-log finding #10 — "soft warnings fail; only
removed affordances work"), not [A]. By this product's own rubric that is a considered precaution,
not a settled finding, and it was presented to the developer that way rather than as settled.

The independent **measurement** objection is stronger and binds both versions: intake self-report
error runs 12–54%, so any figure quoted to the kilocalorie overstates its precision. Hence the
7-day average intake stays on the Eat tab regardless, one scroll below the day view.

**Exercise calories are never added back**, in either version — indefensible on data alone
(wearable expenditure error 15–57%) quite apart from GR-1.

### D-G3.2 — Gram entry leads. This IS an FR-LOG-3 amendment and is recorded as one

Developer's decision, taken with the requirements conflict stated in the option itself.

FR-LOG-3 currently reads: "**Default path is approximate** (quick-add, portion tiers, recents,
barcode); gram-precision is optional depth, never the required path." Making grams the primary
entry control inverts that.

**The evidence being traded against is [A/B]** — 5 RCTs, 4 of 5 equal weight outcomes with higher
engagement in the simplified arms — which is *stronger* than the [B/C] behind the GR-1 clause
defended above. **But the stakes differ in kind:** FR-LOG-3 is a retention finding, not a harm one.
Choosing familiarity over retention-optimisation is a legitimate product bet in a way that choosing
it over a safety guard would not be. That distinction is why this amendment is written and the
GR-1 one was argued against.

**Implementation reading:** gram field is the primary control, with a serving/portion selector
beside it — MyFitnessPal's own pattern — so the low-friction path stays reachable without
contradicting the decision. Logged rows display the quantity **as entered**.

**Amendment required at Gate 5:** `docs/REQUIREMENTS.md` FR-LOG-3, and the FR-LOG-3 line in
`docs/BUILD-PLAN.md` §Global constraints.

**Reversal trigger.** If logging abandonment appears in real use, the retention evidence is the
named reason to revisit, and tiers return to the primary position.

### D-G3.3 — Protein leads the macro display, on evidence rather than preference

`c-protein-dose-plateau` [B] (Morton 2018, n=1,863) puts the plateau at ~1.6 g/kg. Carbs and fat
carry no comparable curated claim, so they get small figures rather than headline treatment. The
hierarchy is evidence-driven and can be defended as such.

### D-G3.4 — The deficit cap renders its own evidence

`c-deficit-beyond-500-blocks-lean-mass` [B] (Murphy & Koehler 2022, DOI `10.1111/sms.14075`) states
exactly what GR-1's ≤500 kcal/day cap enforces — stored quote: "individuals performing RT to
preserve LM during weight loss should avoid energy deficits >500 kcal day-1".

So the cap renders through the same `ClaimCard` machinery as any other advice, at its own grade,
with its own citation and its own uncertainty. **The safety guard and the differentiator turn out
to be one mechanism.** The control stops at the cap — it is not a warning that can be pushed past.

**GR-4 binds the wording.** The claim's own record calls it "a population-level threshold rather
than a personal one", so the copy never reads "your limit is 500"; it states where the cap came
from and at what grade.

### D-G3.5 — `guards.ts` is the only path, and this screen must not become a second one

`src/domain/guards.ts` is named in `BUILD-PLAN.md` and `app/CLAUDE.md` as "the ONLY place targets
are set/changed" and **does not exist yet**. Pinned signature:
`clampCalorieTarget(user, requested) → { value, clamped }`.

The goal screen's slider stop is **a rendering of what the guard returns**, never an independent
limit implemented in the component — otherwise the cap lives in two places and they drift. Same
for the floor (≈1400 F / 1800 M, never below 1200 net).

Per `CLAUDE.md`'s rule that guard code gets adversarial rather than happy-path tests, this is where
they belong: a requested deficit of 5,000; a negative target; a floor/cap collision for a small
female user where the two disagree; and fault injection proving that removing the clamp turns the
tests red.

### D-G3.6 — Numbers-hidden is a state, and qualitative performance feedback is allowed in it

Developer's decision: qualitative feedback "allowed and encouraged"; the mode **toggles freely,
with no friction and no confirmation**.

- **Hidden:** kcal totals and per-item figures, macro grams, intake targets, bodyweight figures,
  and the numeric parts of the reconciliation verdict.
- **Kept:** the food log itself (names, meals, portions, times); training data in full, because
  kilograms lifted are performance rather than body measurement; the whole evidence base; the
  weekly review, phrased qualitatively.
- **The line:** performance-framed qualitative feedback stays ("you've hit a good protein intake on
  six of the last seven days"). Anything reading as compliance against a restriction target is
  suppressed — no "you were under", no "you missed", and **no counts of good days, because a count
  of good days is a streak wearing a lab coat.**

**Why free toggling is right.** The protection GR-1 actually specifies is the removed affordances —
no streaks, no depleting counter, capped deficit, floors — and those apply in *both* states.
Friction on exit would make the app enact a clinical judgement about someone, which GR-2 and T6
forbid outright.

### F-G3.1 — The food database is the largest unbuilt piece of M3, and it is not design work

Open Food Facts UK dump filtered and self-hosted + CoFID ingested + USDA FDC fallback, shipped as a
seeded SQLite table with ODbL/OGL attribution. Roughly 134k UK-tagged barcodes is an ETL and
PWA-bundle-size problem. Flagged here so it enters the Gate 5 build plan with a real estimate
rather than appearing as a surprise mid-milestone.

## Gate 4 — hub and mid-workout advice · CLOSED 2026-07-28

### D-G4.1 — v1 does not interrupt. The peek is present, never intrusive

The brief asked for the interruption to be justified. **It could not be, so it is not built.**

No animation, no sound, no focus steal, no timed appearance. The peek is placed before the first
set and is simply there when the lifter next looks down. A lifter who never looks at it loses
nothing; one who does has chosen to.

**The reason, stated as a test rather than a preference:** an interruption must be *actionable
inside the session* to be worth the cost of the 90-second window. Nothing in the claim base
qualifies. The volume claim concerns next week's programming. The deficit claims concern the last
six weeks. The only claim touching a within-session decision is `c-rest-at-least-60-seconds`, **[C]**,
whose own record states every controlled credible interval crosses zero. Interrupting a set to
deliver that is exactly the D3 failure — teaching the user that this app's advice is noise, which
is worse than shipping no advice at all.

### D-G4.2 — The interruption model, fixed

| Dimension | Decision |
|---|---|
| Trigger | Selected **once, at `Start workout`**, by `evaluateClaims()` over the multi-week snapshot. Zero computation during the session. |
| Frequency | **At most one per session.** Never re-shown for the same `claim_id` within **7 days**. |
| Placement | Sheet peek above the tab bar, present from before set 1. Never covers a set row. |
| Dismissal | One tap for the session; "don't show this again" on the expanded card suppresses that claim permanently, reachable without a settings trip. |
| Expansion | **Tap or drag** → full claim → grade → source → figures. |
| Motion | None. |
| Numbers-hidden | Advice triggered by an intake or bodyweight figure is suppressed entirely (D-G3.6). |

Selecting at session start is forced by **F-G1.1** — no predicate in the base reads within-session
state — and it is also the cheapest correct option.

### D-G4.3 — Hub: empty state is a first-class design, not a placeholder

The empty hub is **the entire product today** (M1 shipped with zero user data) and is what every
new user sees for their first week. It states plainly that nothing is earned yet — "17 claims, each
graded and cited. None of them is about you yet" — rather than showing sample data or an
illustrative chart, and it **names the real cost of entry**: about a week for volume and protein
claims, eight qualifying sets for the strength trend.

Payoff latency is the named kill risk for this product; saying it out loud beats letting someone
discover it in week three. **OQ-1 — whether de-mythologising is a product people sustain using — is
answered on this screen**, because it is the only thing a new user sees before investing anything.

The earned hub shows four things and stops: data-earned advice (top slot — it is G4/AC-3), the
e1RM verdict, one volume reading, one bodyweight reading. Plus a resume bar when a session is open.

**What the hub must never become: a dashboard of everything.** Every tile is a number the app must
defend under T3, and most candidates — daily calories, session tonnage, streak counts, body-fat
estimates — cannot be defended, are banned outright, or both.

**FR-SIG-2 renders as a sentence, not a line**, and says two things: that the signal is inside the
noise, *and* that this is not the same as no progress. The second half is the difference between
honesty and discouragement.

### D-G4.4 — Provenance: every string on the advice card traces to a record

1. "Chest · 8.5 sets in the last 7 days" — computed by `weeklySetsByMuscle()` from the user's own
   rows. A fact about their data, never a recommendation.
2. The claim sentence — `claim.statement`, verbatim.
3. "— well-supported" — `GRADE_LANGUAGE[claim.grade].verb` via `renderHeadline()`. The component
   cannot choose this word.
4. Counter and label — `ConfidenceTicks` takes a `Grade` and reads its own words from the map.
5. Source line — `citation.authors`, `journal`, `year`, `n`.
6. "This is a population dose–response, not a target calculated for you" — the one authored
   sentence, and it is **GR-4 boilerplate keyed to the claim's domain**. It makes no claim; it
   disclaims one.

**No LLM in the path, at build time or run time.**

### D-G4.5 — Two guards must grow or they will pass while being wrong

- **The provenance render-walk.** M1's review already recorded that it "starts from already-tagged
  statements, so it cannot catch untagged advice prose". The peek renders a new short string —
  precisely the kind that could ship untagged. **Fault injection: hand-write a claim sentence into
  the peek component and confirm the test goes RED.** If it stays green the guard is decoration.
- **The frequency cap.** "One per session, 7-day cooldown per claim" is logic, and untested logic
  in an advice surface degrades silently. Needs its own test with the clock injected, plus the
  fault injection of removing the cooldown check.

This repo has shipped tests that could not fail three separate times; every one was caught by
deliberately breaking the thing under test.

### D-G4.6 — A predicate-focused curation tranche moves earlier

Developer's decision.

**The problem it solves.** Of 17 claims, exactly **one** can plausibly fire for a new user inside a
fortnight: `c-volume-dose-response` ("some muscle under 10 sets this week"). Protein claims need
`proteinPerKg7d`, which needs food logging. Deficit claims need `goal == 'cut'` **and**
`deficitWeeks >= 4`. The strength claim needs an e1RM trend, which needs eight qualifying
RIR-logged sets. So the peek would show the same claim for weeks and, with the cooldown, mostly
show nothing — and a surface that is empty most of the time teaches people not to look at it.

**This is not fixable by interface.** ~10 claims are curated *before* the trackers are built,
chosen specifically for predicates that can fire on a single session, a first week, or a single
bodyweight entry. Grading judgment stays with Opus per the model-routing table.

---

## Gate 6 — settings, body metrics, calorie calculator · CLOSED 2026-07-28

Raised by the developer at Gate 5 sign-off, who proposed a single new tab for all three and asked
for an opinion. **Three tabs are held.**

### D-G6.1 — No fourth tab. Settings sits behind a gear on the Hub

A tab bar is for destinations visited often; Settings is visited roughly twice a year, and both
Hevy and MyFitnessPal put it behind a profile icon rather than spending a slot on it. Gate 1 chose
three tabs specifically so the evidence base could hold the Hub instead of being demoted to a peer
of two trackers — a fourth tab spends that margin on the least-visited screen in the product.

**The four-tab option was rendered fairly and argued against by its own frame:** a Body tab holds
one recurring action (a single number), one thing not in v1 (measurements), and two set-once fields.
Four labels at 390px also shrink each touch target.

### D-G6.2 — Bodyweight logging belongs with the trackers, not in settings

It is a **logging surface** — frequent, offline-first, consent-gated — exactly like sets and food,
and FR-LOG-2 treats it as such. Bodyweight is also one of only **two signals this project's research
grades as trustworthy** (finding #3: intake and expenditure are irredeemably noisy). Burying the
daily weigh-in in configuration makes the most defensible measurement in the product the hardest to
reach.

**Placement:** a "Log today ›" affordance on the Hub's bodyweight block, one tap from the landing
screen — better placement than a tab would give it. The trend renders as countable bars rather than
a smooth curve, refusing to imply resolution the data has not got, and states that it is smoothed
over 14 days because FR-SIG-4 forbids raw daily weight being the signal.

### D-G6.3 — The calorie calculator lives inside Eat's goal setting

**A calculator that produces a calorie target is a target-setting path.** Gate 3 already placed goal
setting on Eat with the deficit cap rendering its own claim. Two doors to the same target is
precisely what D-G3.5 exists to prevent: even with both calling `guards.ts`, two target-setting
screens drift in copy, in defaults, and in which guards they surface.

### D-G6.4 — The estimate is a starting point that the data replaces, and its error is shown

Mifflin–St Jeor plus an activity multiplier, rendered as **"2,500 kcal/day · plausibly
2,180 – 2,820"** — a range, not a point value, because T3 forbids displaying a number the app cannot
defend and a bare 2,500 is pseudo-precision.

The screen states plainly that after two to three weeks of logged weight and intake, the user's own
data gives a better maintenance figure than any equation, and that the observed number takes over.

**This is on-thesis rather than a hedge.** Every mainstream tracker computes a TDEE and treats it as
fact forever; this project's own research says expenditure estimates are unreliable and only weight
and e1RM trends are trustworthy. Building the replacement-by-data behaviour in from the start is the
correct engineering, and it is what the strongest competitor in the space is respected for.

### D-G6.5 — The T1/T3 boundary, written down because no automated guard covers it

**"Your estimated maintenance is 2,500, plausibly 2,180–2,820" is a measurement statement**,
governed by T3. **"You should eat 2,500" would be advice**, governed by T1/GR-6, and would require a
stored `claim_id` behind it. There is no curated claim about BMR equations in the base and none is
needed, because the calculator makes no recommendation — it performs arithmetic and reports its
error. The confirm button reads "Use 2,500 as maintenance": the user chooses, the app does not
instruct.

**The provenance test checks advice render paths and this is not one**, so it will not catch a drift
across that line. Keeping it clean is a review responsibility, recorded here so it is not
rediscovered late.

### D-G6.6 — Settings contents, several of which are obligations rather than features

- **Beat/NHS signpost** — GR-1 specifies "static signpost to Beat/NHS in settings" verbatim. Worded
  to state the app's own limits ("this app is not a clinical tool and cannot assess anyone"), which
  is T6/GR-2: signpost, never screen.
- **Export (JSON/CSV) and delete** — GR-5 data-subject rights. Delete takes the reserved `--flag`
  red, the only place red appears in this design and never on a grade.
- **Numbers-hidden**, toggling freely (D-G3.6), with a subtitle stating exactly what it hides and
  what it does not.
- **Appearance** — Light / Dark / **Auto**, defaulting to Auto (D-G1.6).
- Height, birth year, sex, units.
- **Claim count and last-reviewed date** — FR-CLAIM-4 ships `last_reviewed`; a user who can see it
  can hold the curation honest.
- **Data sources and licences** — an ODbL/OGL obligation once Open Food Facts and CoFID ship, not an
  about page.

### D-G6.7 — `users` gains `birth_year`

Mifflin–St Jeor needs sex, height, weight and age. `users` has `sex` and `height_cm`; weight comes
from the `weights` table; **age is absent.**

Stored as **`birth_year integer`, not an age** — an age column is wrong within twelve months and
nothing in the system would ever correct it.

---

## Gate 5 — sign-off · schema, migrations, revised build plan

### 5.1 Schema changes

**Migration `0002_trackers`** — ships with the workout tracker.

```sql
alter table workouts add column name text;
alter table workouts add column finished_at text;
alter table sets add column set_type text not null default 'working';

create table if not exists advice_events (
  id text primary key,
  user_id text not null,
  claim_id text not null,
  trigger text not null,
  workout_id text,
  shown_at text not null,
  dismissed_at text,
  suppressed_at text,
  updated_at text not null,
  deleted_at text
);
create index if not exists advice_events_claim_shown on advice_events (claim_id, shown_at);
```

**Migration `0003_nutrition`** — ships with M3.

```sql
create table if not exists food_items (
  id text primary key,
  source text not null,
  name text not null,
  brand text,
  barcode text,
  kcal_per_100g real not null,
  protein_g_per_100g real not null,
  carbs_g_per_100g real not null,
  fat_g_per_100g real not null,
  fibre_g_per_100g real,
  serving_grams real,
  serving_label text,
  updated_at text not null
);
create index if not exists food_items_barcode on food_items (barcode);
create index if not exists food_items_name on food_items (name);

create table if not exists food_log_entries (
  id text primary key,
  user_id text not null,
  food_item_id text not null,
  meal_slot text not null,
  quantity_grams real not null,
  quantity_label text,
  logged_at text not null,
  updated_at text not null,
  deleted_at text
);
create index if not exists food_log_entries_logged_at on food_log_entries (logged_at);

alter table users add column calorie_target_kcal integer;
alter table users add column protein_target_g integer;
alter table users add column deficit_kcal integer not null default 0;
alter table users add column birth_year integer;
```

`birth_year` is required by Mifflin–St Jeor (D-G6.7) and is stored as a year rather than an age so
it cannot silently rot.

`deficit_kcal` defaults to **0 — maintenance**, which is GR-1's required default expressed in the
schema rather than in a component. Targets are nullable: null means not yet set, never zero.
`quantity_label` stores the quantity **as entered** so a logged row can display "2 palms" when a
tier was used and grams when grams were typed (D-G3.2).

**Mechanics.** `src/db/migrate.ts` is an ordered array with a name-ordering guard and a
per-migration transaction, tracked in `_migrations`. Adding one is: write the `.sql`, import it,
append to `MIGRATIONS`. `exec` runs a whole file in one call, so multi-statement files work — as
`0001_init.sql` already is.

### 5.2 What the brief asked for that is deliberately NOT in the schema

The brief listed five things Hevy-style logging needs "at minimum". Three are avoidable, and the
reasoning matters more than the saving:

- **Planned-vs-completed state → no column, and no rows for planned sets.** A planned set holds no
  data worth keeping. It stays **UI state until it is ticked**, and ticking writes to SQLite
  immediately — which preserves the existing write-on-action durability model exactly, rather than
  inventing a second one. A crash mid-session loses only empty rows, never a write, so NFR-1 is
  untouched. The alternative — making `sets.performed_at` nullable — cannot be done with
  `ALTER TABLE` in SQLite and would force a full table rebuild.
- **Set ordering → no column.** Sets order by `performed_at`; working-set numbering is derived by
  counting non-warm-up sets for that exercise in that workout.
- **Exercise ordering → no `workout_exercises` table.** Derived from each exercise's first
  completed set.

**What this gives up, named:** editing or reordering sets and exercises after the fact. Nothing in
`REQUIREMENTS.md` asks for it. **Reversal is cheap** — both are nullable `ADD COLUMN` migrations,
and the day post-hoc editing is wanted, they get added then.

**`set_type` carries two values, `working` and `warmup`**, not four. Drop and failure sets are not
required by any FR. It is a TEXT column, so adding enum members later is a code change and not a
migration at all.

### 5.3 Claim-base change (not schema)

`Claim` gains **`peekStatement: string`** — a curated short form, Zod-gated like every other field,
so the advice peek renders a complete sentence rather than a CSS ellipsis (D-G1.7). Touches
`claims/*.yaml`, `scripts/build-claims.ts`, `src/advice/types.ts`, and regenerates
`src/generated/claims.ts`. **The generated bundle is never hand-edited** — the drift test re-runs
the generator in memory and byte-compares.

### 5.4 Document amendments required

| File | Change | Decision |
|---|---|---|
| `DESIGN.md` | New **Controls** section — button, numeric field, tap-target row, completion control, timer, tab bar, destructive confirm, **switch, segmented control, settings row, countable-bar sparkline**. The file currently specifies none of these. | D-G1.4, D-G6.6 |
| `DESIGN.md` | Type table: figures move from mono to `system-ui` + `tabular-nums`. The rule "a number set in the serif face is a bug" is unchanged. | D-G1.5 |
| `DESIGN.md` | New **dark ground** section with the re-derived ramp and its measured contrast ratios; dark-mode deferral removed. | D-G1.6 |
| `docs/REQUIREMENTS.md` | **FR-LOG-3** — gram entry becomes the primary path. | D-G3.2 |
| `docs/BUILD-PLAN.md` | §Global constraints — the FR-LOG-3 line repeats the old wording verbatim. | D-G3.2 |
| `docs/00-meta/decision-log.md` | Entries 19+ with reasoning and reversal triggers, from this file. | all |

**GR-1 is unamended.** No change to `REQUIREMENTS.md` GR-1, `app/CLAUDE.md`, or `PRODUCT.md`'s
ED-safety text.

### 5.5 Revised build plan

**M2′ — trackers and the training loop.** Replaces the unfinished tail of the M2 plan; Tasks 1–6
of that plan are already complete and are not revisited.

**Already built — do not re-plan these.** Verified by `ls`, not by document:
`domain/e1rm.ts` · `domain/trends.ts` · **`domain/volume.ts`** · `components/TrendChart.tsx` ·
`features/log/LogWeight.tsx` · `db/weights.ts` · the four M1 advice components · `ConsentGate`.

**Still genuinely absent:** `domain/guards.ts` · `domain/reconcile.ts` · `features/trends/Trends.tsx`
· Hevy import · all nutrition.

1. **`DESIGN.md` amendments** — controls, number face, dark ground. Before any UI lands, per
   impeccable's rule that a new world is recorded in the same stretch as the decision.
   *(Done 2026-07-28, together with the FR-LOG-3 amendment and decision-log entries 19–24.)*
2. **Dark-ground retrofit** of the five existing components — the four M1 advice components **plus
   `TrendChart`**, which landed after this plan was first drafted. `FigureChart` and `TrendChart`
   both draw hand-rolled SVG with light-ramp strokes; this is the step with real surprise potential.
3. **Migration `0002_trackers`** + schema types.
4. **Session model** — explicit start/finish; `findOpenWorkout` moves to `finished_at IS NULL`;
   resume-or-discard for abandoned sessions. **Fixes the midnight-split bug (D-G2.7).**
5. **Workout tracker UI** — set rows, optional RIR column with tap targets, warm-up marking and its
   stated exclusion, rest timer, session header, finish summary. Replaces `LogWorkout.tsx`'s layout;
   its *behaviour* (defaults from the last set of the same exercise, immediate write, no save
   button) is the reference and must survive.
6. **`peekStatement` + the advice peek** + frequency cap + **both guard extensions (D-G4.5)**.
   Uses the existing real claim `c-volume-dose-response`; **no placeholder claims** — see §5.7.
7. **Three-tab shell + Hub** — empty and earned states, gear affordance, bodyweight block with
   "Log today" wired to the existing `LogWeight`. `App.tsx` currently routes only `/` and `/log`,
   and `LogWeight.tsx` exists but is **not reachable from any route** — this step wires it.
8. **Settings** — GR-1 Beat/NHS signpost, GR-5 export and delete, numbers-hidden, appearance,
   profile fields including `birth_year`.
9. **Trends screen** — `Trends.tsx`. `TrendChart` already exists, and a red `Trends.test.tsx` is in
   `stash@{0}`: **read that stash before writing anything**, since it encodes the intended contract.
   `withinNoise` must render as copy, not a line.
10. **Hevy CSV import** — M2 Task 8, unstarted. **Closes OQ-2**, which also determines whether
    imported sets can ever contribute e1RM points.
11. **Curation tranche** — ~10 claims chosen for early-firing predicates (D-G4.6). Opus; grading
    judgment does not go to a subagent. Deliberately last: it blocks nothing, and one real claim
    already carries the build (§5.7).

**M3′ — nutrition.**

1. **`src/domain/guards.ts` first**, with adversarial tests and fault injection, before any UI that
   sets a target exists. Requested deficit of 5,000; negative target; floor/cap collision for a
   small female user; proof that removing the clamp turns tests red.
2. Migration `0003_nutrition`.
3. **Food ETL** — OFF UK filtered + CoFID + FDC, seeded SQLite, ODbL/OGL attribution. **The largest
   unbuilt piece of work in the project and it is not design work** (F-G3.1). Needs its own
   estimate before it starts.
4. Goal setting — maintenance default, cap rendering its own claim, floor, **and the calorie
   calculator as the same flow's first step** (D-G6.3). The estimate renders with its error band
   and is replaced by observed maintenance once the data supports it (D-G6.4).
5. Day view, food search, quick-add, barcode.
6. **Numbers-hidden across every surface**, not as a final pass.

**Unchanged:** M4 (reconciliation, data-earned advice), M5 (sync), M6 (curation to ~50, hardening).

### 5.7 Claims: curation defers, and NO placeholder claims are created

The developer asked whether curation could be deferred with placeholders in place, and invited a
correction if that were risky. **It is risky, and it is also unnecessary.**

**Never put a placeholder claim in `claims/*.yaml`.** That directory is the trust root, and a
fabricated claim there would pass **every existing guard**: Zod validates DOI *shape*, not
resolution; the drift test only checks the generated bundle matches the committed one; the
provenance test proves advice renders *from* a claim record, which a fake record satisfies
perfectly. A placeholder would be indistinguishable from a curated claim on inspection.

`PRODUCT.md` names this directly — "fabricating a citation is the single most damaging thing that
could be done to this product's premise" — and decision-log entry #17 records a **real** claim
carrying an unsupported number surviving every automated guard, caught only by a human reading it
adversarially.

**It is unnecessary because nothing in the build needs a new claim:**

- **Selection logic** — `evaluateClaims(snapshot, claims)` is pure and takes claims as an argument,
  so its tests use fixtures declared in the test file. Those never ship, never render, and never
  enter `claims/`. This is already the established pattern.
- **Component tests** — the peek and card take a `Claim` prop; fixtures again.
- **Manual end-to-end verification** — `c-volume-dose-response` is real, already curated, grade
  **[A]**, and its stored predicate (`some muscleSets < 10`) genuinely fires from logged data. It
  exercises the entire pipeline: predicate → engine → grade language → peek → expanded card →
  figures.

So the tranche makes the surface *rich*; it is not a prerequisite for building it. **If a future
session finds itself wanting a placeholder claim, that is the signal to curate a real one instead.**

### 5.6 Definition of done, unchanged

`npm run typecheck && npm test -- --run && npm run build && npm run e2e` green from `app/`, before
any claim that something is finished. Fault injection is mandatory on every guard. Commits small,
lowercase, imperative, no conventional-commit prefixes, no AI attribution. **Nothing merged or
pushed without asking.**

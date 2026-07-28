# Design

<!-- impeccable:design-schema 1 -->

The durable visual system. `PRODUCT.md` owns product truth; this file owns how it looks
and behaves. Established 2026-07-25 during M1, the milestone that builds the advice
surface. Tokens marked *provisional* are expected to settle during the first build.

**Extended 2026-07-28** for the trackers redesign (three tabs, Hevy-idiom workout logging,
MyFitnessPal-structured nutrition). Three additions, each decided with the developer over
rendered options: a **Controls** section, which this file previously lacked entirely; a
**dark ground**, derived rather than inverted; and a change to the **figure face**. The
world itself is unchanged — Hevy and MyFitnessPal contributed structure only. Full
reasoning and reversal triggers: `docs/superpowers/plans/2026-07-27-trackers-redesign.md`.

---

## Direction contract

**THESIS.** Confidence is counted, not asserted. Every recommendation carries a
four-slot confidence counter sitting directly beneath it, so the strength of the
evidence is read at the same moment as the advice. Refuses the category default: a
rounded card with a small coloured pill badge, which users have learned to skim past.

**OWN-WORLD.** Warm paper ground, near-black ink, hairline rules. Advice and claims set
in a serif at reading scale; labels in small tracked sans caps; figures and counts in
tabular mono. Quantity is always shown by repeating a countable mark, never by scaling
one. Flat throughout — no gradients, no shadows on content, no 3D, no glow.

**STORY.** The lifter sees what to do, then immediately how well supported it is, then —
only if they ask — the studies, the numbers and the caveats.

**FIRST VIEWPORT.** A single-column feed of advice cards on paper ground. Each card:
serif advice line at the top, the confidence label and its four-slot counter directly
under it, the source in italic serif beneath that, and one text affordance to open the
evidence. No chrome above the first card beyond a plain title.

**FORM.** Isotype/Neurath pictorial statistics, fused with an editorial-review register.
Grounded candidate 7 of 7; seed key `35cb7d47`, scope direction, mode operate. Staging:
plain single-column feed — the dealt `working-surfaces-depth-row` staging was considered
and declined, because claims are not resumable tasks and a depth rank implies a
recency ordering the content does not have.

---

## Mode and scene

**Operate.** The visitor completes a task; expression never obscures it.

The scene that decides the rest: *a lifter holding a phone at arm's length under bright
overhead gym lighting, glancing for a few seconds between sets, one thumb free.*

That forces a **light ground as the default**. High ambient light constricts the pupil and
turns dark UI muddy behind screen glare, and this surface is read in exactly that
condition. **That reasoning is unchanged and still decides the default.**

**Dark mode shipped 2026-07-28**, on the condition this section originally set: a second
ground had to be *designed*, not inverted, and the confidence ramp *re-derived*. Both were
done — see Colour below. Light remains the documented default; the runtime follows
`prefers-color-scheme` with a manual override in Settings, because a lifter under a
skylight and one in a dim free-weight room want different things and neither is wrong.

**Mobile is the design target, not a breakpoint.** Layouts are authored single-column
first and allowed to breathe on wider screens. Nothing essential may sit off the first
screenful of a card.

---

## Colour

**Strategy: restrained.** Neutral paper and ink carry the surface; colour is reserved
almost entirely for the confidence ramp. The visitor came to operate, so colour works as
signal, not decoration.

### Ground and ink

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FBFAF7` | page and card ground |
| `--paper-sunk` | `#F6F3EB` | the evidence panel, so depth reads as a change of surface not a shadow |
| `--ink` | `#141414` | advice, claims, figures |
| `--ink-soft` | `#57534A` | source lines, secondary prose |
| `--ink-faint` | `#767162` | field labels, units, meta |
| `--rule` | `#E6E1D4` | hairline separators |
| `--rule-strong` | `#DAD5C7` | unfilled confidence slots |

### The confidence ramp

One value per grade, applied to the confidence counter and its label.

| Grade | Token | Value | Label |
|---|---|---|---|
| A | `--conf-a` | `#1F5C3D` | well-supported |
| B | `--conf-b` | `#5B7B3A` | some uncertainty |
| C | `--conf-c` | `#8A6A00` | limited evidence |
| D | `--conf-d` | `#6B6459` | anecdotal |

**The ramp encodes confidence, never quality.** Deep green through olive and amber to
neutral grey. **No red appears anywhere in it**, and [D] resolves to grey rather than a
danger colour. A [C] claim is not bad advice — it is advice we are less sure of — and a
red [D] would assert a judgement the evidence grade does not make. Red is reserved for
genuine data-loss and harm states elsewhere in the app.

`--flag` `#B0453A` is that reserved red: storage-fallback warnings, destructive
confirmations. It must never be used for a grade.

### The dark ground

Added 2026-07-28. **Not an inversion.** The ground is a warm near-black in the paper's own
hue family, not a blue-black, so the world reads as the same printed matter under different
light. The ramp keeps its ordering — deep green through olive and amber to neutral grey —
and the two rules that give it meaning survive unchanged: **no red anywhere in the ramp**,
and **[D] resolves to grey**, not to a danger colour.

| Token | Light | Dark |
|---|---|---|
| `--paper` | `#FBFAF7` | `#1A1816` |
| `--paper-sunk` | `#F6F3EB` | `#22201D` |
| `--ink` | `#141414` | `#F2EFE7` |
| `--ink-soft` | `#57534A` | `#B8B2A6` |
| `--ink-faint` | `#767162` | `#8F887C` |
| `--rule` | `#E6E1D4` | `#302D28` |
| `--rule-strong` | `#DAD5C7` | `#4A453C` |
| `--conf-a` | `#1F5C3D` | `#6FBF8F` |
| `--conf-b` | `#5B7B3A` | `#9FC46A` |
| `--conf-c` | `#8A6A00` | `#D6A83C` |
| `--conf-d` | `#6B6459` | `#A39C8E` |
| `--flag` | `#B0453A` | `#E8776A` |

**Contrast against each ground, computed rather than eyeballed** — same discipline as the
light ramp, and the same requirement that 9px tracked labels get no large-text exemption:

ink 15.41 · ink-soft 8.39 · ink-faint 5.04 · A 8.03 · B 8.92 · C 8.03 · D 6.49 · flag 6.14.

All ≥4.5:1. Re-run the check on any token change in **both** grounds; the light ramp has
little headroom and the dark one must not be assumed safe because it looks brighter.

**`paper-sunk` is lighter than `paper` in dark mode**, where it is darker in light mode.
Depth is still a change of surface rather than a shadow — it simply moves the other way,
because a recessed panel on a dark ground reads as lifted, not sunk.

**Cost this carries, recorded honestly:** dark doubles the surface every screen must be
checked against, and the components written before this date — `ConfidenceTicks`,
`ClaimCard`, `EvidencePanel`, `FigureChart`, `TrendChart` — hard-code the light ramp. The
two that draw hand-rolled SVG are the real work.

---

## Type

Faces are **provisional** — a real face is selected at first build. The stacks below are
the fallback contract and the roles are durable.

| Role | Stack | Treatment |
|---|---|---|
| Advice, claim statements | `ui-serif, Georgia, serif` | 16.5–19px, line-height 1.3, `-0.005em` |
| Source lines | `ui-serif, Georgia, serif` | 12–12.5px italic, `--ink-soft` |
| Labels, confidence text | `ui-sans-serif, system-ui` | 9px, 600, `0.12em` tracking, uppercase |
| Figures, counts, units | `system-ui, -apple-system, sans-serif` + `font-variant-numeric: tabular-nums` | 14–34px in trackers, 9–11px in meta |

Serif for anything the user reads as language; sans caps only for labels. **A number set
in the serif face is a bug — figures must align in columns.** That rule is unchanged and
is the durable one.

**Figures moved off monospace on 2026-07-28.** The rule was always *tabular alignment*;
monospace was merely how it was implemented, and Menlo is a coding face that made a set of
reps read as console output. `system-ui` with `tabular-nums` aligns just as strictly —
SF Pro on the iPhone this is actually used on, Roboto on Android — and costs nothing to
ship. **Consequence to hold:** figures are no longer visually distinct from sans labels by
face alone, so the type system now leans on size and case to separate them. A figure and a
label at the same size is a bug this change introduced the possibility of.

---

## Components

### `ConfidenceTicks`

Four slots. Filled slots equal the grade: A=4, B=3, C=2, D=1. Filled slots take the
grade's ramp colour; unfilled slots are `--rule-strong`.

- Slot 15×7px, 2.5px gap, at card scale.
- **The count is the primary encoding and colour is redundant to it.** Never render the
  counter without its text label.
- Always paired with the label from `src/advice/language.ts`. The component takes a
  `Grade` and reads its own words from that map — it never accepts a label string.

### `ClaimCard`

Vertical order is fixed and load-bearing:

1. **Advice** — serif, largest text on the card.
2. **Confidence label + `ConfidenceTicks`** — directly beneath the advice, never below
   the source, never behind an interaction.
3. **Source** — italic serif: authors, journal, year, and the sample size where stated.
4. **One affordance** to open the evidence.

Cards are separated by a `--rule` hairline, not by gaps and shadows. No rounded corners
on content cards; the world is printed, not floating.

### `EvidencePanel`

Opens in place on `--paper-sunk`. Native `<details>`/`<summary>` — keyboard-operable and
screen-reader-announced with no JS state. Field rows: mono label above serif value.

Sample size renders as countable marks, one per 100 participants, with a hatched partial
mark for the remainder and an explicit "each mark = 100 people" key. Population renders
as its own named field. Both are fields, never footnotes (FR-ADV-8).

### `FigureChart`

Hand-rolled SVG. Confidence intervals plot against a visible zero line so an interval
crossing zero is *seen* to cross it. No charting library, no publisher figure images ever
(GR-3) — extracted numbers only, re-plotted here.

### Contested clusters

Both sides render inside one card at equal visual weight, each with its own confidence
counter and its own source. Neither side is indented, greyed, or placed second by
grade. A contested card is marked as contested in the default state.

---

## Controls

Added 2026-07-28. **This file previously specified no interactive controls at all** — it was
written for a read-mostly advice feed, so every button and field in the trackers was
undefined vocabulary. These are the rules; the scene decides all of them.

**The scene is the spec: one hand, phone at arm's length, ~90 seconds between sets, gym
lighting, possibly sweaty.** Every control below is judged against that, not against a
desktop.

### Universals

- **Minimum 44px touch target**, including invisible padding. A 30px control with 7px of
  padding is fine; a 30px control is not.
- **Flat.** No rounded corners on content, no shadows, no gradients — controls are printed
  forms, not floating chrome. A 1px `--rule-strong` border is the whole affordance.
- **The filled state is `--ink` on `--paper`**, never a colour. Colour belongs to the
  confidence ramp; a coloured button would compete with the only thing colour means here.
- **No control may animate on state change.** See Motion.

### Buttons

| Kind | Treatment |
|---|---|
| Primary | `--ink` ground, `--paper` text, 9–12px sans caps `0.1em`, min-height 48px full-width / 36px inline |
| Secondary | Transparent ground, 1px `--ink` border, `--ink` text |
| Text affordance | Sans caps `--ink-faint`, trailing `›`. This is the disclosure idiom the advice cards already use |
| Destructive | `--flag` text on transparent. **Never a filled red button** — a filled destructive control invites the mis-tap it should prevent |

### Numeric entry

**Never a numeric keyboard where a tap target will do.** The keyboard is the wrong control
in the design scene, and RIR is the proof: a 0/1/2/3/4+ row of targets is one thumb motion,
where a keyboard is a focus change, a keypress and a dismiss.

- **Field:** 1px `--rule-strong` box, `--paper` ground, figure face, right-aligned, unit as
  a sans-caps suffix in `--ink-faint`.
- **Completed values lose their border** and sit as plain figures. A box means editable; no
  box means recorded. This is what lets a set table show four completed rows and one live
  row without any highlight.
- **Empty-but-expected renders as a dashed box**, not as nothing. A field you cannot see is
  a field that gets skipped forever — this is why the optional RIR column is visible.

### Completion control

A 30px square, 1px `--rule-strong`, filling to `--ink` with a `--paper` check when set. It
is the only place in the system where a filled solid block means "done" rather than "one
unit of quantity", so it never appears adjacent to a countable-mark meter.

### Segmented control and switch

- **Segmented:** one 1px box divided by hairlines; the selected segment takes `--ink` /
  `--paper`. Used where options are few, exclusive and named (kg/lb, Light/Dark/Auto).
- **Switch:** 44×26 box, 20px knob, `--rule-strong` when off and `--ink` when on. Used only
  for genuine on/off state. **It does not animate.**

### Countable-mark meters

The Isotype rule extends to controls: **a progress or quantity meter is a row of repeated
marks, never a single scaled bar.** A continuous fill implies resolution the underlying
number does not have — which is exactly wrong for calorie and volume figures whose error
bars are large. Every meter states its unit ("each mark is 100 kcal").

**A meter must never be drawn as a depleting budget.** Meters fill toward a target; they do
not drain toward zero. This is a GR-1 requirement, not a stylistic one — see
`REQUIREMENTS.md` GR-1 on eat-back-to-zero framing.

### Tab bar

Three tabs — Hub, Train, Eat. `--paper` ground, 1px `--rule` top border, sans caps 9px,
`--ink-faint` inactive and `--ink` active. **It stays visible during a live workout**, a
decision that knowingly costs ~54px in the design scene in exchange for one navigation
grammar instead of two.

Evidence is **not** a tab. It is the Hub's own content, and Settings sits behind a gear in
the Hub header — a tab bar is for destinations visited often, and settings is visited twice
a year.

### Session and advice surfaces

- **Session header:** name, working-set progress, elapsed time, and Finish top-right, always
  reachable without scrolling.
- **Advice peek:** `--paper-sunk` panel above the tab bar, with a grab handle. Carries the
  confidence counter **at full size regardless of available space** — the grade is the one
  thing that may never be traded for compactness (principle 7). Expands on **tap or drag**;
  drag alone is the least reliable gesture with wet hands.
- **The peek renders a curated `peekStatement` from the claim record, never a truncation.**
  A CSS ellipsis through a claim statement cuts the nuance principle 7 exists to protect.

---

## Motion

**Rewritten 2026-07-28.** The original rule was "almost none, deliberately", on the grounds
that the surface is read in short glances and movement costs legibility. That was too broad:
it conflated *decorative* motion, which does cost legibility here, with *transitional* motion,
which is what stops an interface feeling like a slide deck. The app is animated.

**The governing test: motion explains a relationship the static frame cannot.** Where did
this come from, where did it go, did that register. Motion that answers one of those ships.
Motion that exists to feel modern does not.

### The scale

| Token | Duration | Use |
|---|---|---|
| `--motion-tap` | 120ms | Direct response to a finger: tick fill, tap-target select |
| `--motion-move` | 200ms | Something changes place or size: tabs, sheet, disclosure |
| `--motion-settle` | 320ms | Something arrives or a figure re-counts |

Easing is `cubic-bezier(0.2, 0, 0, 1)` — a firm ease-out. **No bounce, no overshoot, no
spring.** This world is printed matter; paper does not wobble.

### What moves

| Where | What | Why it earns it |
|---|---|---|
| **Tab changes** | Outgoing pane fades and shifts 8px toward the leaving edge; incoming does the reverse. `--motion-move` | Direction tells you where you went. Three tabs in a fixed order means left/right is real spatial information |
| **Set completion tick** | Box fills from the tapped edge, `--motion-tap` | There is no save button, so the tick **is** the receipt that the write reached SQLite. An instant flip reads as "did that register?" — the worst ambiguity in an app promising never to lose a write |
| **Rest timer** | Remaining bar sweeps continuously | Continuous change *is* the information; a bar jumping in one-second steps is strictly less readable |
| **Sheet peek → expanded** | Height and content cross-fade, `--motion-move` | A sheet that teleports open breaks the spatial relationship the gesture just created |
| **New set row** | Height opens from 0, `--motion-move` | Shows the row was added rather than the table having silently reflowed |
| **RIR tap targets** | Row opens beneath the cell, `--motion-move` | Ties the targets to the cell that summoned them |
| **Numeric meters** | Marks fill in sequence, `--motion-settle` | Shows a value moved and by how much, instead of substituting a new number silently |
| **Evidence disclosure** | Panel opens, `--motion-move` | The existing `<details>` behaviour, given a height transition |
| **Route/screen push** | Slide-and-fade, `--motion-move` | Start → session → finish is a sequence; motion carries the order |

### What still does not move, and why

- **The advice peek never animates *in*.** It may animate when the user expands it. An
  animated *arrival* is exactly what converts "present" into "interruption", which v1
  deliberately refuses (Gate 4). This is the single carve-out in an otherwise animated app.
- **The confidence counter never animates.** Its job is to be read, not noticed — and a grade
  that draws the eye by moving is the skimmable-badge failure by another route.
- **No skeletons, shimmers or spinners.** Reads are local and effectively instant; a loading
  animation dramatises a wait that does not exist and implies a network that is not there.
- **Nothing fades in on scroll.** Content is present or it is not.

### Rules

- **Transform and opacity first**, so motion stays on the compositor. Height transitions are
  permitted where they carry meaning (sheet, new row) but are the exception, not the habit.
- **Motion is never the only carrier of a state change.** Every animated state above is also
  legible from a static screenshot.
- **`prefers-reduced-motion: reduce` disables all of it**, and the interface stays completely
  usable — because of the rule above, nothing is lost but the movement. This is an
  accessibility requirement, not a courtesy.

---

## Brand marks — a deliberate empty slot

`PRODUCT.md` states that MyoStat is settled **as a word, not as a visual identity**: no logo,
wordmark, palette or typographic lockup has been decided, and none may be invented here.

So the app ships **no mark**, and the seam for one is built rather than faked:

- A single `Logo` component is the only place a mark may ever appear. Today it renders the
  wordmark as text in the serif at the appropriate size.
- It accepts an optional SVG. When real artwork exists, it is dropped in as
  `src/assets/logo.svg` (and `logo-mark.svg` if a standalone glyph is wanted) and the
  component switches to it — **no other file changes**.
- The SVG must use `fill="currentColor"` so it inherits `--color-ink` and therefore works on
  both grounds without a second asset.
- Until then: no placeholder glyph, no generic dumbbell icon, no lettermark. **An invented
  placeholder is worse than an empty slot**, because it quietly becomes the brand by being
  the thing everyone sees.

---

## Accessibility

- **Colour is never the sole carrier of meaning.** Grade is encoded three ways
  simultaneously: the filled-slot count, the text label, and the hue. Remove the hue and
  the card still reads correctly — this is the test any change to the ramp must pass.
- Touch targets ≥44px. Disclosure affordances get a padded hit area larger than their
  text.
- Body text ≥16px. Labels may go smaller only because they are uppercase, tracked, and
  never carry unique information.
- Every colour above meets 4.5:1 against `--paper`, checked rather than eyeballed:
  A 7.57 · B 4.64 · C 4.86 · D 5.60 · ink 17.65 · ink-soft 7.34 · ink-faint 4.67.
  `--ink-faint` started at `#7A7568` and measured 4.40 — it was darkened rather than
  waved through, because it carries 9px uppercase labels that get no large-text
  exemption. Re-run the check on any token change; the ramp has little headroom.

---

## Prohibitions

Each of these bans something the world genuinely refuses, not merely something a checker
dislikes.

- **Never scale one symbol to show a bigger quantity.** Repeat a countable mark. This is
  Isotype's founding rule and the reason the system was chosen: scaling misleads the eye.
- **Never embed a publisher's figure image** (GR-3).
- **No gradients, content shadows, glass, or glow.** The world is flat printed matter.
- **No red in the confidence ramp.**
- **No grade rendered as a standalone pill badge** — that is the skimmable affordance
  this direction exists to refuse.
- **No component may hard-code a grade word, verb, DOI, author, or journal.** Those come
  from the claim record via `src/advice/language.ts` (T1/GR-6).
- **No meter that depletes toward zero.** Meters fill toward a target. A draining bar is
  eat-back-to-zero framing expressed as geometry, and GR-1 bans the framing however it is
  drawn (added 2026-07-28).
- **No truncated claim statement.** If a surface is too small for the claim, it renders the
  curated `peekStatement` from the record — never an ellipsis. Nuance is the part that must
  not be cut (added 2026-07-28).
- **No filled red button.** Destructive actions are `--flag` text on transparent; a filled
  red target invites the mis-tap it exists to prevent (added 2026-07-28).
- **No numeric keyboard where a tap target will do** in the mid-workout scene
  (added 2026-07-28).

---

## Recorded concern — hue-coded confidence ticks

**Recorded at the developer's request, 2026-07-25, so the reasoning survives the
decision.**

Four tick treatments were compared. The developer chose the hue-coded variant, in which
the counter changes colour with the grade. It is the fastest of the four to read, which
matters a great deal in a 90-second gap between sets.

**The concern.** Risk D3 in `docs/03-thesis-review/wave1-d-credibility-risk.md` is that
nuance presented as a peripheral cue gets skimmed rather than read. Once a grade has a
colour, users can learn the shortcut *green means trust it, amber means skip it* and
stop reading the count, the label, and the claim's actual qualifications. That is
functionally the coloured-pill badge behaviour this direction was chosen to avoid, and
it would be arriving through the back door. The monochrome variant (A1) is immune to it,
at the cost of [A] and [C] cards looking near-identical at a glance — which fails
principle 7 from the opposite side.

**Why the decision is defensible.** Colour here is *redundant*, not primary: the filled
count and the text label both encode the grade independently, so nothing is
communicated by hue alone. The ramp avoids traffic-light semantics, so it reads as
confidence rather than as approval. And glanceability is a real requirement, not a
nicety — an honest card that does not get read is not honest in practice.

**What would falsify this.** If real users can reliably report a card's *colour* but not
its *grade*, its sample size, or that it was contested, the shortcut has formed and the
hue is doing harm. Revisit the ramp then — the monochrome variant is the fallback and
requires only a token change, because the count already carries the meaning.

**Review trigger.** The M1 user gate, and again at M6 when the claim base reaches ~50
and low-grade claims become common enough for the shortcut to pay off for a skimmer.

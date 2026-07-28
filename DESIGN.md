# Design

<!-- impeccable:design-schema 1 -->

The durable visual system. `PRODUCT.md` owns product truth; this file owns how it looks
and behaves. Established 2026-07-25 during M1, the milestone that builds the advice
surface. Tokens marked *provisional* are expected to settle during the first build.

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

That forces a **light ground**. High ambient light constricts the pupil and turns dark
UI muddy behind screen glare, and this surface is read in exactly that condition. Dark
mode is deliberately **not** shipped in M1 — it is a real request for a gym app and it
is deferred rather than refused, because a second ground has to be designed, not
inverted, and the confidence ramp below would need re-deriving for it.

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
| `--ink-faint` | `#7A7568` | field labels, units, meta |
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

---

## Type

Faces are **provisional** — a real face is selected at first build. The stacks below are
the fallback contract and the roles are durable.

| Role | Stack | Treatment |
|---|---|---|
| Advice, claim statements | `ui-serif, Georgia, serif` | 16.5–19px, line-height 1.3, `-0.005em` |
| Source lines | `ui-serif, Georgia, serif` | 12–12.5px italic, `--ink-soft` |
| Labels, confidence text | `ui-sans-serif, system-ui` | 9px, 600, `0.12em` tracking, uppercase |
| Figures, counts, units | `ui-monospace, Menlo, monospace` | tabular numerals, 9–11px |

Serif for anything the user reads as language; sans caps only for labels; mono only for
numbers. A number set in the serif face is a bug — figures must align in columns.

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

## Motion

Almost none, deliberately. Disclosure expands without animation by default; the surface
is read in short glances and movement costs legibility. Any motion added later honours
`prefers-reduced-motion` and never gates content visibility.

---

## Accessibility

- **Colour is never the sole carrier of meaning.** Grade is encoded three ways
  simultaneously: the filled-slot count, the text label, and the hue. Remove the hue and
  the card still reads correctly — this is the test any change to the ramp must pass.
- Touch targets ≥44px. Disclosure affordances get a padded hit area larger than their
  text.
- Body text ≥16px. Labels may go smaller only because they are uppercase, tracked, and
  never carry unique information.
- Every ramp colour meets 4.5:1 against `--paper`.

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

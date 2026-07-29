# Icon generation prompts

Paste-ready prompts for an AI icon/favicon generator. One prompt per icon, each
self-contained — these tools have no memory between generations, so every prompt
repeats the style contract in full.

Derived from `DESIGN.md` (Colour, Controls, Prohibitions) and `PRODUCT.md` (Brand
Commitments). **`DESIGN.md` governs.** If a generated icon conflicts with a prohibition,
the icon is wrong, not the spec.

---

## Before you generate: three things the repo already gets wrong

1. **`app/public/favicon.svg` is scaffold leftover.** It is a purple gradient mark with
   Gaussian-blur glow layers — it violates four `DESIGN.md` prohibitions at once (no
   gradients, no glow, no shadows, and a colour that means nothing in this system).
   Every icon below replaces it.
2. **`theme_color` and `background_color` are `#0a0a0a`** in `app/vite.config.ts:23-24`.
   That is a blue-black from the scaffold, not a project token. The splash screen should
   be `--paper` `#FBFAF7`, or `#1A1816` if you want the dark ground.
3. **The maskable icon is the same file as the standard one** (`vite.config.ts:30`). A
   maskable icon needs ~40% safe-zone padding or Android crops the mark. Prompt 1c below
   is the separate asset.

---

## The style contract (embedded in every prompt below)

Flat black-ink-on-warm-paper, Isotype/Neurath pictorial-statistics register, printed
matter rather than app chrome. No gradients, no shadows, no glow, no 3D, no bevel, no
rounded-corner container, no colour beyond ink and paper. Quantity is always shown by
repeating an identical mark, never by scaling one symbol or by a continuous bar.

Colours, if the tool accepts hex:

| | Light | Dark |
|---|---|---|
| ink (the mark) | `#141414` | `#F2EFE7` |
| paper (the ground) | `#FBFAF7` | `#1A1816` |

---

# 1. App icon — MyoStat

The product has no logo yet (`PRODUCT.md`, Brand Commitments). Two directions below;
generate both, pick one, and delete the other from this file so a later reader doesn't
think both shipped.

## 1a. Primary — the confidence counter as the mark

The four-slot counter *is* the thesis ("confidence is counted, not asserted") and it is
already the product's most distinctive form. Four filled slots is the mark stating an [A]
about itself.

```
A flat minimalist app icon. Four identical horizontal bars stacked vertically, all four
solid, equal width and equal height, separated by even gaps of about one third a bar's
height. Bars have square corners — no rounding, no taper, no ascending or descending
heights, all four exactly the same size. Colour: solid #141414 bars on a plain #FBFAF7
warm off-white background, filling the full square with no border, no frame and no
rounded container. Absolutely flat: no gradient, no shadow, no glow, no bevel, no 3D, no
texture, no outline. Editorial print aesthetic, Isotype pictogram style. Vector, high
contrast, legible at 16 pixels. Bars occupy about 60% of the icon width, centred, with
generous even margin on all sides.
```

**Reject if:** the bars ascend in height (that reads as a wifi/signal meter, which means
"strength of connection", not "count of evidence"), or if any corner is rounded, or if
the tool adds a squircle background plate.

## 1b. Alternate — the Isotype lifter

Warmer and more legible as an app icon at a glance; less tied to the thesis.

```
A flat minimalist app icon in the style of Otto Neurath's Isotype pictograms: a single
solid black human figure seen from the front, simplified to a plain silhouette with a
round head and a squared-off body, holding a straight horizontal barbell across the
shoulders. The barbell is a plain horizontal bar with one solid rectangular plate at each
end. Solid #141414 silhouette on a plain #FBFAF7 warm off-white background. Completely
flat: one solid colour, no gradient, no shadow, no glow, no outline, no 3D, no facial
features, no clothing detail, no motion lines. Fills the square with even margin, no
border, no rounded container plate. 1930s pictorial-statistics poster style. Vector,
high contrast, legible at 16 pixels.
```

**Reject if:** the figure has a face, muscle definition, or a dynamic/action pose. Isotype
figures are census marks, not athletes.

## 1c. Maskable variant

Generate after picking 1a or 1b. Same prompt as your choice, with this appended:

```
Additionally: the mark must sit inside the centre 60% of the square, with a wide empty
#FBFAF7 margin filling the outer 20% on every side, so the icon survives being cropped to
a circle. The background colour must run edge to edge with no visible border or frame.
```

Export at 512×512 → `app/public/icon-512-maskable.png`, then add it to the manifest as a
third entry with `purpose: 'maskable'` and drop `purpose: 'maskable'` from the existing
512 entry.

---

# 2. Tab bar — Hub · Train · Eat

**Read this first.** `DESIGN.md` § Controls specifies the tab bar as **text-only** — 9px
sans caps, `--ink-faint` inactive, `--ink` active. No icons. Adding icons is a change to
the spec, not an implementation of it: it costs vertical height in a bar that already
"knowingly costs ~54px" during a live workout, and the three labels are short enough to
be unambiguous on their own.

Generate these if you want the change. If you take them, amend § Controls → Tab bar so
`DESIGN.md` still describes what shipped.

All three must read at **24px**, in one stroke weight, as a set.

## 2a. Hub

```
A flat minimalist interface icon: three horizontal lines stacked with even vertical
spacing, all the same length, spanning most of the icon's width. Below the topmost line
sits a short row of four small identical solid squares in a horizontal row, evenly spaced.
Pure line-and-block drawing in solid #141414 on a transparent background. Uniform 2px
stroke weight, square line caps, square corners throughout — no rounding anywhere.
Completely flat: no gradient, no shadow, no glow, no fill tint, no outline box, no
container shape. Editorial print aesthetic, Isotype pictogram style. Vector, drawn on a
24 by 24 pixel grid, legible at 24 pixels.
```

Concept: the feed of hairline-separated advice cards, with the confidence counter under
the first one. **Reject if:** it comes back as a house, or as a hamburger menu (three
lines with no counter row is a menu icon — the four squares are what make it the Hub).

## 2b. Train

```
A flat minimalist interface icon of a barbell seen from the side: one straight horizontal
bar spanning the icon's full width, with two identical solid rectangular plates mounted
vertically at each end — four plates total, all exactly the same size, taller than the
bar. Pure geometric line-and-block drawing in solid #141414 on a transparent background.
Uniform 2px stroke weight, square corners and square caps throughout, no rounding. Flat
front-on side elevation, perfectly symmetrical, no perspective, no foreshortening. No
gradient, no shadow, no glow, no knurling, no texture, no outline box, no container
shape. Isotype pictogram style. Vector, drawn on a 24 by 24 pixel grid, legible at 24
pixels.
```

Concept: plates as repeated identical marks — the Isotype rule applied to load. **Reject
if:** the plates differ in size (that is scaling a symbol to show quantity, the one thing
§ Prohibitions bans outright), or if there is any 3D/perspective.

## 2c. Eat

```
A flat minimalist interface icon of a shallow bowl seen from the side: a simple wide
trapezoid narrowing toward its flat base, with a straight horizontal rim line across the
top. Above the rim, three short identical vertical strokes in a row, evenly spaced, all
the same height. Pure geometric line drawing in solid #141414 on a transparent
background. Uniform 2px stroke weight, square line caps, square corners, no rounding.
Completely flat: no gradient, no shadow, no glow, no fill, no steam curves, no food
inside, no cutlery, no outline box, no container shape. Isotype pictogram style. Vector,
drawn on a 24 by 24 pixel grid, legible at 24 pixels.
```

Concept: the bowl, with three countable marks above it echoing the "each mark is 100 kcal"
meter. **Reject if:** the marks come back as curved steam wisps, or if it adds a fork and
knife (that is the MyFitnessPal idiom, and this icon should not borrow a competitor's
lockup).

---

# 3. Settings

Behind the gear in the Hub header (`DESIGN.md` § Controls → Tab bar; plan D-G6.1).

```
A flat minimalist interface icon of a gear: a single circle with eight identical
rectangular teeth spaced evenly around its outer edge, and a smaller concentric circle
cut out at the centre. All eight teeth are exactly the same size and shape. Pure
geometric line drawing in solid #141414 on a transparent background. Uniform 2px stroke
weight, square corners on the teeth, no rounding, no filleting. Completely flat: no
gradient, no shadow, no glow, no fill, no 3D, no outline box, no container shape.
Perfectly symmetrical, drawn front-on. Vector, drawn on a 24 by 24 pixel grid, legible at
24 pixels.
```

Deliberately conventional. Settings is the one place where inventing a new pictogram costs
recognition and buys nothing.

---

# 4. Optional — only if these surfaces get icons

Neither exists as an icon today. Evidence is Hub content and Trends hangs off the Hub, so
both are currently reached by the text affordance idiom (`sans caps + trailing ›`) that
the advice cards already use. Skip these unless a surface genuinely needs a glyph.

## 4a. Evidence

```
A flat minimalist interface icon: an open book seen from directly above, drawn as two
equal rectangular pages meeting at a straight vertical centre line. On the left page, three
short horizontal lines of text; on the right page, a row of four small identical solid
squares. Pure geometric line-and-block drawing in solid #141414 on a transparent
background. Uniform 2px stroke weight, square corners and caps, no rounding, no page
curl, no perspective. Completely flat: no gradient, no shadow, no glow, no fill tint, no
outline box. Isotype pictogram style. Vector, drawn on a 24 by 24 pixel grid, legible at
24 pixels.
```

## 4b. Trends

```
A flat minimalist interface icon: a straight horizontal baseline spanning the icon's full
width, with a stepped line above it made of three straight segments rising left to right
at right angles — square steps, not a smooth curve, not a diagonal. The baseline is drawn
slightly heavier than the stepped line so it reads as a zero reference. Pure geometric
line drawing in solid #141414 on a transparent background, square line caps and square
corners throughout, no rounding, no arrowheads, no data points, no axis labels.
Completely flat: no gradient, no shadow, no glow, no fill under the line, no outline box.
Vector, drawn on a 24 by 24 pixel grid, legible at 24 pixels.
```

The visible baseline is not decoration: `FigureChart` plots intervals against a visible
zero line so an interval crossing zero is *seen* to cross it. An icon with no baseline
contradicts the chart it stands for. **Reject if:** the line is a smooth curve or carries
an arrowhead — an arrow asserts a direction the trend data has not earned (T3).

---

# Checklist — reject any output that has

- [ ] A gradient, shadow, glow, bevel, or any 3D shading
- [ ] A rounded-corner container plate or squircle background the prompt didn't ask for
- [ ] Any colour beyond ink and paper — **especially red**, which is reserved for
      data-loss and harm states and must never appear on a nav or brand surface
- [ ] Repeated marks at *differing* sizes (scaling a symbol to show quantity — banned)
- [ ] A continuous filled bar or a partial-fill meter (banned; meters are countable marks)
- [ ] Inconsistent stroke weight across the icon set — the three tab icons must read as
      one drawing hand at 24px
- [ ] Detail that dies below 24px (knurling, page curl, facial features, tick labels)

## Export targets

| File | Size | Source |
|---|---|---|
| `app/public/favicon.svg` | vector | Prompt 1 — **replaces the purple scaffold mark** |
| `app/public/icon-192.png` | 192×192 | Prompt 1 |
| `app/public/icon-512.png` | 512×512 | Prompt 1 |
| `app/public/icon-512-maskable.png` | 512×512 | Prompt 1c — new manifest entry |
| tab + settings glyphs | 24×24 SVG | Prompts 2–3, inline in components |

Most favicon generators emit raster only. For the tab and settings glyphs you want SVG —
either trace the raster output or redraw it, since all five are simple enough to hand-author
once the shape is decided.

## Dark ground

Every icon above is specified on light paper because light is the documented default
(`DESIGN.md` § Mode and scene). The tab and settings glyphs are drawn on a transparent
background and take `currentColor`, so they follow the ground for free. Only the app icon
needs a decision: either ship one light-ground icon for both modes (fine — home-screen
icons sit on the OS wallpaper, not on the app's ground), or regenerate 1a/1b with
`#F2EFE7` on `#1A1816` swapped in.

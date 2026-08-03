# Brand and icon source

Generated source artwork, kept **out of `app/public/`** on purpose.

Anything in `app/public/` is copied into `dist/` and picked up by the service worker's
precache, so it is downloaded and stored by every install whether or not a single line of
code references it. These three marks were doing exactly that: the precache went from
**14 entries / 1,691 KiB to 17 entries / 3,414 KiB** — the PWA doubled in size for images
nothing rendered.

The marks that actually ship are `app/src/components/icons.tsx`, redrawn from these as
inline SVG so they inherit `currentColor` (and therefore work on both the light and dark
grounds) and cost about a kilobyte instead of 1.7 MB.

## What is here

| File | Became |
|---|---|
| `source-marks/hub.png` | `HubIcon` — the four-slot confidence counter |
| `source-marks/train.png` | `TrainIcon` — a loaded bar |
| `source-marks/eat.png` | `EatIcon` — a bowl with three steam marks |

The prompts these were generated from are in [`icon-prompts.md`](icon-prompts.md).

## Adding more

Generate here, redraw into `icons.tsx`, and leave the raster behind. The one exception is
the PWA install icons (`app/public/icon-192.png`, `icon-512.png`), which the manifest
genuinely needs as rasters and which are small.

# Exercise artwork

Drop a file here named after the exercise id from `src/db/seed-exercises.ts`:

    barbell-bench-press.svg
    cable-face-pull.svg
    dumbbell-lateral-raise.png

**There is no registry to update and no import to add.** `ExercisePicker.tsx` reads this
folder with a Vite glob at build time, so a file appearing here is all it takes.

## Hold artwork to these

- **`fill="currentColor"`, no baked hex.** One file then works on the light ground and the
  dark one, inheriting `--color-ink`. A file with `#000` in it goes invisible in dark mode.
- **Flat.** No gradients, no shadows, no glow, no rounded container. These are `DESIGN.md`
  prohibitions, and `docs/brand/icon-prompts.md` states the same contract for the app icons.
- **Square viewBox**, roughly 24×24 or 48×48. The picker renders it at 44px.

SVG is preferred because it stays sharp and inherits ink. PNG works if that is what the
source gives you — same folder, same naming — but it will not follow the dark ground.

## Until a file exists

The row shows a dashed empty slot. That is deliberate: a generic placeholder that looks
like real content is worse than an obvious gap, because nobody goes back for it.

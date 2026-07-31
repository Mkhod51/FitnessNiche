# Open questions for the developer

Raised during autonomous development, recorded rather than blocking on. Each has a
default I took so work could continue — the default is stated so it can be reversed
cheaply if the answer differs.

## Q1 — Ticking a set saves with empty weight and reps

**Status: ANSWERED 2026-07-29 by the developer.** A blank field takes the previous set for
that exercise.

`LogWorkout`'s tick always called `logSet`, even with both fields blank, storing a
`0 kg × 0` set. It was that way because the test contract demanded it and because it
protects "never lose a write" — but a 0-rep set is not a write worth protecting, and it
polluted weekly volume (it counts as a hard set) without touching e1RM (no RIR).

**Resolution taken:** the tick still always saves — "never lose a write" is preserved —
but a blank box now falls back rather than writing a zero. The precedence is:

1. the last set logged for **this exercise in this session**;
2. failing that, the exercise's own historical last set (the same value that prefills the
   row);
3. failing both, `0`.

Chosen over gating the control on `reps > 0` because it keeps the one-tap path intact
mid-workout, which is the NFR-3 design target. Nothing is invented — both fallbacks are
the lifter's own recorded work — and an explicit `0` still stores `0`, which bodyweight
work legitimately needs. Covered by three tests in `LogWorkout.test.tsx`.

**Residual edge, accepted:** an exercise with no history and nothing logged this session
still writes `0 × 0` on a blank tick, because there is genuinely nothing to fall back to.
Rare, and inventing a number there would be worse.

## Q2 — `LogWeight` still uses `type="number"`

**Status:** unanswered, cosmetic.

The global CSS strips its spinner arrows, so it is no longer ugly, but it has not had the
text-input-plus-decimal-keypad treatment the set table got.

**Default taken:** left alone.

## Q3 — Should the `exercises` table be hardened, or deleted?

**Status:** unanswered.

Nothing reads it. The picker, `exerciseName` and volume all read the `SEED_EXERCISES`
TypeScript constant. The table is seeded and never queried, and its seeder gates on row
count — so *adding* an exercise propagates, but *editing* one never reaches the table and
*removing* one would re-seed on every boot forever.

**Default taken:** left as-is, since a bug in an unread table harms nobody today.
**Options:** (a) harden the seeder with a content hash when something starts reading it,
(b) delete the table until a reader exists, (c) leave it.

## Q4 — Where does real food data come from, and when?

**Status: superseded 2026-07-31 by FR-LOG-6.**

FR-LOG-6 now ships with a smaller honest open-data stack: a curated CoFID seed for common
foods, Open Food Facts keyword search on submit, manual barcode lookup, and selected-item
caching in `food_items`. USDA FDC is deferred as a later backend/proxy fallback, not a direct
browser dependency.

**Current follow-ups:** CoFID seed expansion, Worker-side OFF proxy/rate limiting,
USDA/FatSecret-style provider adapter, barcode camera scanning, and a cross-device recents
decision. See `docs/agent-handoff/REMAINING-WORK.md`.

## Q5 — Maintenance calories before the calculator exists

**Status: superseded 2026-07-31 by the goal setup flow.**

`clampCalorieTarget` needs a maintenance figure. Until the Mifflin–St Jeor calculator and
observed-maintenance logic land, there is nothing to give it for an existing user.

**Default taken:** the goal flow asks for the estimate first and stores the result on
`users.calorie_target_kcal`; a user with no estimate yet sees the calculator rather than a
day view full of dashes.

# Open questions for the developer

Raised during autonomous development, recorded rather than blocking on. Each has a
default I took so work could continue — the default is stated so it can be reversed
cheaply if the answer differs.

## Q1 — Ticking a set saves with empty weight and reps

**Status:** unanswered, default in place since the tracker landed.

`LogWorkout`'s tick always calls `logSet`, even with both fields blank, storing a
`0 kg × 0` set. It is that way because the test contract demanded it and because it
protects "never lose a write" — but a 0-rep set is not a write worth protecting, and it
will pollute weekly volume (it counts as a hard set) without touching e1RM (no RIR).

**Default taken:** permissive — the tick always saves.
**Alternative:** require reps > 0 before the tick does anything, greying the control until
then. Weight legitimately stays 0 for bodyweight work, so only reps should gate it.

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

**Status:** unanswered, and it gates the food *search* path only.

FR-LOG-6 names Open Food Facts (UK) + CoFID + USDA FDC, self-hosted. That is an ETL and a
PWA bundle-size problem — roughly 134k UK-tagged barcodes is not something to precache
casually — and it is the largest single piece of unbuilt work in the project.

**Default taken:** build quick-add first, which needs no food database at all, and ship
the day view working entirely without one. The food table exists and stays empty; the UI
says so plainly rather than pretending. **No food rows are hand-authored** — inventing
macro values would be exactly the fabrication this product refuses.

## Q5 — Maintenance calories before the calculator exists

**Status:** unanswered.

`clampCalorieTarget` needs a maintenance figure. Until the Mifflin–St Jeor calculator and
observed-maintenance logic land, there is nothing to give it for an existing user.

**Default taken:** the goal flow asks for the estimate first and stores the result on
`users.calorie_target_kcal`; a user with no estimate yet sees the calculator rather than a
day view full of dashes.

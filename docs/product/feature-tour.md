# Feature tour

**Status:** current source-traced tour. Read it with the [feature status matrix](../reference/feature-status.md), which distinguishes implementation from verification.

MyoStat has eight routes. Hub, Train, and Eat are the persistent bottom tabs; Goal, Weight, Settings, Trends, and Review are reached from links or actions inside those screens. The route list is fixed in [App.tsx](../../app/src/App.tsx). There is currently no catch-all not-found screen.

## Route and screen map

“Local” below means the on-device SQLite database. Accepting the consent gate writes only the consent timestamp; declining writes nothing and leaves a retry path. The gate applies to logging and personal-analysis routes, not the public evidence Hub or Settings.

| Route | Screen and entry | Consent | Local reads | Local writes | Empty, error, and offline state | Next actions |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Hub; persistent **Hub** tab | No | User snapshot, weights, sets, workouts, food logs, advice events; bundled claims | An automatic general-evidence impression/suppression event when eligible | With no weight data it invites the first weigh-in; the evidence library remains browsable. Several snapshot/read failures are silent. The root shell is the verified offline hard-reload entry. | Log weight; open Review or Trends; search or browse evidence; open Settings |
| `/train` | Workout logger; persistent **Train** tab | Yes | Open workout, sets, recent workouts, recent exercises, user snapshot, advice events | Workouts, sets, advice events | Offers **Start workout** when none is open. Initial read failures may leave an empty-looking screen; start failure is visible. Logging works offline after the shell is available, but a hard offline refresh directly on `/train` is not supported. | Start or resume; repeat a recent session; add exercises/sets; finish and review the summary |
| `/eat` | Nutrition day; persistent **Eat** tab | Yes | User targets, selected day/week food logs, recent/common foods, local food cache | Food-log entries and deletion tombstones; selected Open Food Facts items enter the local cache | Empty meal slots invite food. No target yields a neutral “no target” state. Day-level read failures can be silent; online food search and barcode failures are explicit. Local food, recents, common food, and quick add remain available offline; scanning and online search do not. | Change day; add/remove food; choose local/recent/common; quick add; search or scan |
| `/goal` | Goal setup; linked from Settings | Yes | User profile and latest bodyweight | Profile, goal, energy/protein targets; an eligible evidence impression event | Missing inputs produce no estimate rather than invented precision. Initial read and save failures are not surfaced. Calculation and save are local/offline. | Enter profile inputs; inspect maintenance range; select maintain/cut/bulk; save targets |
| `/weight` | Bodyweight log; linked from Hub | Yes | Recent weights | A new weight entry | No entries shows an empty history. Non-positive/non-numeric input is ignored without an explanation; read/write failures are silent. Logging is local/offline. | Enter today’s weight; return to Hub or inspect Trends |
| `/settings` | Settings; linked from Hub | No | User/preferences and local sync configuration | Preferences; optional sync configuration; local deletion of user data; sync acknowledgements/tombstone results | User load/save/export/delete failures are mostly silent; manual sync gives success/error feedback. Local settings, export, and erasure work without the network; sync requires it. | Change theme/experience/number visibility; open Goal; configure/sync; export; erase device data; read privacy/wellness guidance |
| `/trends` | Trends; linked from Hub | Yes | User, bodyweights, recent workout sets | None | Sparse data shows explanatory empty/noise states. Read failures can be silent. All computation is local/offline. | Keep logging; inspect smoothed weight, e1RM, and weekly volume context |
| `/review` | Weekly review; linked from Hub | Yes | User, 84 days of bodyweights, sets, and food logs | None | Loading is initially blank; a read failure is explicit. Insufficient data produces unresolved findings rather than a forced verdict. Review is local/offline. | Resolve missing inputs through logging; inspect qualifying evidence; return to the trackers |

The app warns when it cannot use durable OPFS storage and has fallen back to snapshot-backed memory. That warning applies across routes because persistence mode is decided before the route renders. See [database initialisation](../../app/src/db/client.ts), [fallback snapshot](../../app/src/db/snapshot.ts), and the [boot warning](../../app/src/App.tsx).

## Consent and local health storage

The [consent gate](../../app/src/features/onboarding/ConsentGate.tsx) precedes Train, Eat, Goal, Weight, Trends, and Review. It explains that health-related data is stored on this device and separately discloses the food-provider requests: search text is sent when the user performs an Open Food Facts search, and a barcode is sent when it is scanned or typed. Acceptance persists a timestamp in the local user record. A failed consent read fails closed with an unavailable message. A failed consent write keeps the gate in place. Decline stores nothing and can be reconsidered.

Hub stays available without consent so the bundled evidence corpus can be explored without logging personal data. Settings stays available so privacy information and device controls are reachable. These boundaries are covered by [ConsentGate tests](../../app/src/features/onboarding/ConsentGate.test.tsx) and the [cold-start browser test](../../app/e2e/consent-cold-start.spec.ts).

## Hub and evidence

The [Hub](../../app/src/features/hub/Hub.tsx) combines a bodyweight snapshot, route shortcuts, evidence search, automatic general evidence, and the full claim library.

- A seven-day-half-life exponentially weighted moving average smooths bodyweight. A weekly rate is shown only when the history spans at least 14 days. With no readings, the card points to `/weight`.
- [Ask Evidence](../../app/src/features/advice/AskEvidence.tsx) searches claim statements and domains in the bundled corpus. It returns stored claim cards, never an authored or model-generated answer. No match says the corpus does not cover the question.
- [Advice Feed](../../app/src/features/advice/AdviceFeed.tsx) can show one general, empty-Hub claim. It records the event before display, applies a seven-day cooldown, supports permanent suppression, and stops using the empty-Hub surface once logged data exists. Load failures are silent, while the full corpus remains available.
- Claim cards show the stored statement, evidence grade, and citation. Expanded evidence adds review metadata, all citations, DOI links where present, attributed excerpts, dissent for contested claims, and MyoStat-rendered SVG figures. Publisher figure images are not embedded.
- Advice is selected from a deterministic snapshot and claim predicates. There is no LLM or scholarly-network request in this runtime path.

The Hub currently does not honour numbers-hidden mode for its numeric bodyweight card. That is a known privacy/safety defect, not intended behaviour. The evidence corpus has 32 authored YAML claims, and the review ledger remains mixed; the UI's displayed corpus count or latest review date must not be read as proof that every claim completed editorial review.

## Training

The [workout logger](../../app/src/features/log/LogWorkout.tsx) restores an open workout if one exists; otherwise it offers a fresh start and recent sessions to repeat.

1. **Start or repeat.** Starting creates a local workout. Repeating creates a new workout with the same exercises and set rows, carrying weight and reps forward as editable defaults. Rows start unticked and RIR is cleared; historical sets are not copied into the new session.
2. **Choose exercises.** The local exercise picker can add exercises, and recent exercises remain available. Each exercise reads the latest prior completed set as a fallback.
3. **Log a set.** Weight, reps, and RIR are editable. Leaving weight or reps blank uses the previous-set value; an explicit zero weight is preserved. Ticking a row writes the set. Adding another row is explicit rather than automatic.
4. **Classify the set.** Working and warm-up rows can be toggled. Warm-ups clear and disable RIR in the logger and do not qualify for the finish screen's e1RM count. A known implementation gap is that the weekly muscle-volume aggregation does not currently filter warm-ups, despite the UI describing them as excluded.
5. **Finish.** The summary counts working sets, warm-ups, e1RM-qualifying sets, and the heaviest working set. The user may name the workout before saving it finished.

One contextual evidence card may be budgeted for a workout. The selector chooses it at workout/exercise context, records the event before showing it, and applies cooldown and suppression; it is not reevaluated after every set. Unit coverage lives in [LogWorkout tests](../../app/src/features/log/LogWorkout.test.tsx), while [repeat-session](../../app/e2e/repeat-session.spec.ts) and [advice-surface](../../app/e2e/advice-surfaces.spec.ts) cover browser flows.

### Hevy CSV boundary

[parseHevyCsv()](../../app/src/features/import/hevy.ts) is a tested parser for named Hevy columns, kg/lb conversion, exercise matching, warm-ups, RPE-to-RIR conversion, and row-level problems. It has no production caller, route, file picker, persistence workflow, or browser test. Hevy import is therefore parser-only and not a shipped user workflow. See [parser tests](../../app/src/features/import/hevy.test.ts).

## Bodyweight

The [weight logger](../../app/src/features/log/LogWeight.tsx) appends a finite positive bodyweight and lists recent entries. Its empty state is a blank history beneath the entry form. Invalid input causes no write but currently gives no validation message. History-load and write failures are also silent. The route does not read numbers-hidden mode, so the current entry/history presentation can expose figures even when the preference is enabled.

## Nutrition

The [nutrition day](../../app/src/features/nutrition/EatDay.tsx) moves by date and groups entries into Breakfast, Lunch, Dinner, and Snacks. It shows energy and macros against saved targets without “remaining,” “left,” “under budget,” restriction streaks, or eat-back-to-zero framing. Removing a food writes a tombstone so optional sync can replicate the deletion.

Numbers-hidden mode removes daily totals, targets, macro figures, weekly averages, and per-food energy figures while preserving food names, quantities, meal structure, and add/remove actions. Quick add is unavailable in that mode because it requires numeric energy entry. This route is the strongest current implementation of the setting; Hub and Weight still leak weight figures, documented above.

### Adding food

The [food picker](../../app/src/features/nutrition/FoodPicker.tsx) has four paths:

- **Local, recent, and common:** search the on-device food cache, choose recent items, or use the curated common-food seed. The seed contains 38 CoFID-derived foods and the picker shows up to 12 common items; this is not the larger CoFID catalogue envisaged by the requirements.
- **Grams and servings:** grams are the primary quantity. Provider serving shortcuts appear only when serving data is available.
- **Quick add:** name and energy are required; protein is optional and defaults to zero, while grams are optional. The entry is local and intentionally unavailable when figures are hidden.
- **Open Food Facts:** an explicit online search sends the query through the configured food-search proxy. Missing energy, protein, carbohydrate, or fat fields cause a result to be rejected, and the picker reports how many incomplete results were hidden. Selecting a valid result caches it before logging.

When offline, the picker states that online search and scanning are unavailable and keeps local search, recents, common food, and quick add available. The [food browser test](../../app/e2e/food.spec.ts) covers offline local logging.

### Barcode camera and typed fallback

The [barcode scanner](../../app/src/features/nutrition/BarcodeScanner.tsx) requests the rear-facing camera, recognises EAN-13, EAN-8, and UPC-A, validates the value, and releases the camera on success, cancel, or failure. A scanned code is passed back to the same provider lookup used by typed barcode search. Camera permission denial, unavailable APIs, and decode failure all preserve a typed-barcode fallback.

This wiring is unit-tested with mocked media and decoder APIs in [BarcodeScanner tests](../../app/src/features/nutrition/BarcodeScanner.test.tsx), and the picker tests verify scanner delivery. There is no real-camera/browser-hardware end-to-end test, so camera wiring must not be described as verified on physical camera hardware.

USDA search is not implemented. Open Food Facts is the active online provider, alongside local and CoFID-seeded data.

## Goal setup and nutrition targets

The [goal screen](../../app/src/features/nutrition/GoalSetup.tsx) starts at maintenance. The user can optionally record training experience, then provides sex category, height, birth year, latest or manual bodyweight, and activity level. The calculator uses Mifflin–St Jeor with a ±10% maintenance range and activity multipliers defined in [energy.ts](../../app/src/domain/energy.ts). Partial or out-of-bounds inputs produce no estimate.

Maintain, cut, and bulk drafts are shown as choices. Cut exposes a deficit slider, and both the slider maximum and the saved target pass through [nutrition guard functions](../../app/src/domain/guards.ts):

- maximum daily deficit: 500 kcal;
- sex-specific saved-target floor: 1,800 kcal for male and 1,400 kcal for female or unspecified;
- absolute floor: 1,200 kcal;
- a sex-specific floor never forces a target above estimated maintenance, while the absolute floor remains absolute.

Protein is derived at 1.6 g/kg and rounded. Goal setup intentionally keeps its figures visible when numbers-hidden mode is on and says so, because editing targets requires knowing the values. Bulk may surface its stored evidence claim; maintenance/cut do not invent a general recommendation, though cut includes the deficit-cap evidence card. [Guard tests](../../app/src/domain/guards.test.ts) and [structural enforcement tests](../../app/src/guards-enforcement.test.ts) verify that target-writing paths use the guard.

## Trends

The [Trends screen](../../app/src/features/trends/Trends.tsx) computes three local views:

- **Bodyweight:** the same seven-day-half-life EWMA used by Hub. Numbers-hidden mode hides this figure here.
- **Estimated 1RM:** only working sets with weight and reps above zero, reps at most 10, and non-null RIR from 0–3 qualify. A true 1 rep at 0 RIR uses the lifted weight; other qualifying sets use Epley. A trend needs at least eight points and uses ordinary least squares with a 95% band and slope interval. If change is inside the noise, the trend line and slope are withheld with an explanation.
- **Weekly muscle volume:** exercises contribute fractional sets according to their muscle-contribution map. The 10–20 set band is labelled as a population reference, not a personal target. Warm-ups are currently included by the aggregator and are a known gap.

See [e1RM](../../app/src/domain/e1rm.ts), [trend calculations](../../app/src/domain/trends.ts), [volume](../../app/src/domain/volume.ts), and [Trends tests](../../app/src/features/trends/Trends.test.tsx).

## Weekly review

The [Review screen](../../app/src/features/review/Review.tsx) reads 84 days of local weights, sets, and food logs. It displays a reconciliation verdict and confidence, the measured bodyweight/e1RM signals, unresolved inputs, weekly muscle volume, and protein on days that contain both training and food records. Figures covered by numbers-hidden mode are suppressed; training interpretations remain.

The deterministic [reconciliation model](../../app/src/domain/reconcile.ts) requires at least four weight readings across 14 days before interpreting weight change; ±0.1 kg/week is treated as flat, and higher confidence requires 28 days and eight readings. e1RM is called down only when its slope confidence interval excludes zero. Otherwise the result remains unresolved or holding. The model does not emit a rapid-loss diagnosis. A claim card appears only when the result maps to a stored interpretation claim. The route is read-only and does not record a new advice event merely for opening Review.

## Settings, export, sync, and erasure

The [Settings screen](../../app/src/features/settings/Settings.tsx) controls appearance, training experience, numbers-hidden mode, goal setup, optional sync, export, device erasure, and privacy/wellness information.

- **Appearance:** light, dark, or system/automatic theme.
- **Numbers hidden:** intended to suppress bodyweight and nutrition figures. It works on Eat and the relevant Review/Trends figures, but Hub and Weight currently leak bodyweight figures.
- **Export:** JSON exports users, workouts, sets, weights, food-log entries, and advice events. It excludes the food/exercise catalogues, caches, sync URL, and bearer token. CSV exports live set rows with exercise name and leaves missing RIR blank. Export helpers are unit-tested; there is no browser download end-to-end test.
- **Sync:** a user supplies a server URL and bearer token. Local writes remain primary. Manual sync reports success or failure; connected clients also attempt sync on the browser's `online` event, not on a polling schedule. Failed requests retain pending operations. Protocol/client/Worker tests exist, but no Playwright test performs a real browser-to-D1 exchange.
- **Erase data from this device:** a two-step confirmation hard-deletes local user tables and recreates a default user without consent. There is no undo and no server/cross-device erasure request.
- **Wellness boundary:** Settings states that MyoStat is not medical care and displays Beat and NHS signposting text. Those names are currently plain text rather than clickable links.

Settings displays a claim count and latest review date, but that summary is not a completion certificate. The corpus is short of the v1 target and the curation ledger contains unresolved review work.

## PWA and offline limits

The [Vite PWA configuration](../../app/vite.config.ts) defines an installable standalone app and precaches the HTML, JavaScript, CSS, icons, SVG, and SQLite wasm assets. Offline browser coverage verifies root boot, local reads and writes, a workout set, and food logging after the shell is cached. It also verifies fallback persistence after an explicit flush/reload sequence.

The current service worker has no deep-route navigation fallback. A hard reload at `/train` while offline is therefore expected to fail even though navigation to Train from an already-loaded shell and its database writes work offline. Snapshot-backed memory is also weaker than durable OPFS: snapshot failures are swallowed, so the visible storage warning should be taken seriously rather than as cosmetic copy.

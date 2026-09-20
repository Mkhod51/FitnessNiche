# Safety and privacy

**Status:** current guardrail guide. The [requirements](../REQUIREMENTS.md) remain normative; the [feature status matrix](../reference/feature-status.md) records implementation gaps.

MyoStat handles bodyweight, training, and nutrition records as sensitive health-related data. The product is a wellness tracker, not medical care. Its safety posture is built from constrained calculations, removed incentives, explicit consent, local-first storage, deterministic evidence, and honest failure states.

## Nutrition guardrails

### Maintenance is the default

A fresh profile opens Goal setup in maintenance rather than presuming weight loss. Cut and bulk are explicit choices. An incomplete or implausible profile produces no maintenance estimate rather than filling gaps with assumed values. The current estimator uses Mifflin–St Jeor and displays a ±10% range, which is an estimate rather than a measurement. See [GoalSetup](../../app/src/features/nutrition/GoalSetup.tsx) and [energy calculation](../../app/src/domain/energy.ts).

### Deficit cap and calorie floors

Target-writing code passes cut targets through [guards.ts](../../app/src/domain/guards.ts). The enforced limits are:

- no more than a 500 kcal daily deficit;
- a 1,800 kcal floor for male profiles;
- a 1,400 kcal floor for female or unspecified profiles;
- an absolute 1,200 kcal floor;
- the sex-specific floor does not increase a target above estimated maintenance, while the absolute floor remains absolute.

The slider is bounded and the value is clamped again when saved. This is structural protection rather than warning copy. [Guard unit tests](../../app/src/domain/guards.test.ts) cover the arithmetic; [guard-enforcement tests](../../app/src/guards-enforcement.test.ts) ensure target writers call the guard.

These bounds are product harm guards, not personalised medical advice. MyoStat does not screen for eating disorders or determine whether a calorie target is clinically appropriate for a particular person.

### No streak or eat-back framing

The nutrition day reports energy eaten toward a target. It does not show calories “remaining,” calories “left,” days under budget, restriction streaks, weight-loss leaderboards, or an instruction to exercise calories back to zero. The product defaults to performance and trend framing. [EatDay tests](../../app/src/features/nutrition/EatDay.test.tsx) assert the absence of those phrases and behaviours.

## Numbers-hidden mode

Numbers-hidden mode is intended as a harm-reduction setting, not a cosmetic format. Current behaviour is uneven and should be understood precisely:

| Surface | Current behaviour when figures are hidden |
| --- | --- |
| Nutrition day | Hides energy/macronutrient totals, targets, weekly averages, and per-food energy while preserving food names, quantities, meal slots, and add/remove actions |
| Food picker | Hides numeric food detail and disables quick add, which requires an energy number |
| Goal setup | Deliberately keeps target figures visible and explains that editing targets requires seeing them |
| Trends | Hides the bodyweight figure; training/e1RM/volume information remains |
| Weekly review | Hides bodyweight and protein figures; training verdicts remain |
| Hub | **Known defect:** still displays numeric bodyweight information |
| Weight entry/history | **Known defect:** still displays numeric bodyweight information |

Settings currently describes the preference more broadly than the implementation supports. Until Hub and Weight are corrected, numbers-hidden mode must not be represented as universal. Source coverage includes [EatDay](../../app/src/features/nutrition/EatDay.tsx), [GoalSetup](../../app/src/features/nutrition/GoalSetup.tsx), [Trends](../../app/src/features/trends/Trends.tsx), [Review](../../app/src/features/review/Review.tsx), [Hub](../../app/src/features/hub/Hub.tsx), and [LogWeight](../../app/src/features/log/LogWeight.tsx).

## Wellness-only boundary

MyoStat does not diagnose, detect, monitor, or manage disease. It does not perform an in-app eating-disorder screening flow. Settings says the app is for general wellness and directs people who are worried about food, exercise, or body image toward Beat or NHS support; the names are currently rendered as plain text rather than active links. Clinical questions require refusal and signposting under GR-2/T6, not a claim card that looks like care.

The advice path is deterministic. Advice must resolve to a stored claim identifier, and confidence language, citations, and dissent come from the claim record. No LLM sits in the runtime trust path. Evidence grades describe the support for a general claim; they are not a clinical confidence score for the user. See [provenance tests](../../app/src/provenance.test.ts) and the [evidence rubric](../00-meta/evidence-standards.md).

## Consent

Train, Eat, Goal, Weight, Trends, and Review are protected by the [consent gate](../../app/src/features/onboarding/ConsentGate.tsx). Before logging, it explains on-device health-data storage and the limited food-provider network requests. Accepting writes a timestamp into the local user record. Declining writes nothing and keeps a retry option. If the consent record cannot be read or written, the gate fails closed rather than admitting the user.

Hub is deliberately available without consent for public, bundled evidence; Settings is available for privacy controls. The gate's route use is visible in [App.tsx](../../app/src/App.tsx) and exercised by [consent tests](../../app/src/features/onboarding/ConsentGate.test.tsx).

## On-device storage and offline behaviour

SQLite on the device is the primary write path. The preferred mode uses OPFS SAH-pool storage. Where that is unavailable, MyoStat uses a memory database restored from and snapshotted to IndexedDB, and shows a warning that the fallback is less durable. Snapshot errors can be swallowed, so fallback mode cannot promise the same durability as OPFS.

The PWA precaches its shell and core assets. Browser tests cover offline root boot plus local workout and food writes. Core routes work from an already-loaded shell, but a hard offline refresh on a deep URL such as `/train` is currently limited because there is no navigation fallback. See [offline browser coverage](../../app/e2e/log-offline.spec.ts) and [PWA configuration](../../app/vite.config.ts).

## Food-provider network disclosure

Local foods, recent foods, the common-food seed, and quick add do not need a provider request. When the user explicitly runs Open Food Facts search, the search text is sent through the configured food-search proxy. When the user scans or types a barcode, that product code is sent to Open Food Facts for lookup. Online search and camera scanning are disabled offline; typed/local alternatives remain.

The app rejects provider results that lack energy, protein, carbohydrate, or fat values instead of filling missing nutrition with zero. Selecting a complete result caches it locally. See [provider adapter](../../app/src/food/off.ts) and [FoodPicker](../../app/src/features/nutrition/FoodPicker.tsx).

## Export

Settings offers:

- JSON export of users, workouts, sets, weights, food-log entries, and advice events;
- CSV export of live set rows, including the matched exercise name and blank RIR when no RIR exists.

Exports omit local catalogue/cache tables and the sync URL/token. The export helpers are unit-tested in [export tests](../../app/src/db/export.test.ts); an actual browser download is not covered end to end.

## Erasure

“Erase data from this device” requires two confirmations, hard-deletes local user tables, and recreates a fresh default user without consent. There is no undo. The action is device-only: it does not issue an erasure request to an optional sync server and cannot remove copies held on another device. Server-side and cross-device erasure are absent and must not be implied by the local control. See [local erasure](../../app/src/db/export.ts) and [Settings](../../app/src/features/settings/Settings.tsx).

## Optional sync

Sync is off unless the user configures a server URL and bearer token. Both are stored locally; selected local log tables then replicate using append-log/last-write-wins semantics. Manual sync reports a result, an `online` event can trigger another attempt, and failed attempts retain pending work.

Client, protocol, authentication, and Worker tests exist. There is no browser-to-deployed-Worker/D1 end-to-end test, so remote durability, deployment configuration, and remote erasure should be treated as unverified/absent boundaries rather than inferred from unit tests.

## URLs and network boundaries

The eight in-app routes are fixed and carry no logged health values in their paths or query strings. Sync payloads and food-search text use request bodies. A barcode provider lookup necessarily identifies the product code in the provider request path; a barcode is product data, not the user's logged weight, intake, or workout history. No logged health data is placed in MyoStat navigation URLs. See [route definitions](../../app/src/App.tsx), [sync client](../../app/src/sync/sync.ts), and [Open Food Facts adapter](../../app/src/food/off.ts).

## Copyright and evidence privacy

The claim UI may replot extracted numeric data in MyoStat's own SVG charts and may use short attributed excerpts. It does not embed publisher figure images. The shipped claim bundle is local and searchable without transmitting the user's question to an AI service. Structural [provenance tests](../../app/src/provenance.test.ts) guard these boundaries.

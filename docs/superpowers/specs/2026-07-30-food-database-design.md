# Food database (FR-LOG-6) — design

**Status:** design approved 2026-07-30 (developer), ready to plan + build. Not yet implemented.
**Branch:** `OpenSourceMod` (never merge to `main` — the developer merges themselves).
**Approved mockups:** `docs/mockups/food-picker.{html,png}` (5 screens).
**Start/hand-off prompt:** `docs/superpowers/specs/2026-07-30-food-database-kickoff.md`.

---

## The two decisions that shape everything (developer, 2026-07-30)

1. **Lean and online-assumed.** Offline carries only **recents + a curated common-foods set**. Everything else is fetched **live**, assuming the user has wifi. Every food action that needs the network says plainly **"you'll need wifi"** when there is no connection (never fails silently). Quick-add remains the always-offline fallback. The user does **not** bundle a large food DB.
2. **Direct to the Open Food Facts API, client-side, with local caching.** Chosen items are upserted into `food_items` and become offline-available recents. **CoFID** is the curated offline seed (accurate, UK-gov). USDA FDC stays as a noted future fallback, not v1.

**FR-LOG-6 deviation (log in `00-meta/decision-log.md` when built):** the spec says "self-hosted/cached". This ships **cached but live-fetched from OFF, not self-hosted**. Caching is preserved (fetched rows land in `food_items`). Deliberate, on the developer's "assume online" call. Self-hosting on the Worker (+ an OFF "contribute back" loop) is the documented future path, deferred.

## Data model — no migration needed

`food_items` (migration `0003_nutrition.sql`) already has the right shape: `id, source, name, brand, barcode, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fibre_g_per_100g, serving_grams, serving_label, updated_at`, indexed on `barcode` + `name`. `food_log_entries` already references it via nullable `food_item_id` and is already sync-marked (`markPending`). **The work is populating an existing empty table, not designing one.**

- Caching = **upsert by `barcode`** (OFF items dedupe naturally); CoFID seed items are barcode-less and seeded once.
- A `FoodItemDraft` type (the shape returned by OFF before persistence): `{ source:'OFF', name, brand?, barcode?, kcal_per_100g, protein_g_per_100g, carbs?, fat?, fibre?, serving_grams?, serving_label? }`.

## Curated offline seed (CoFID)

A build-time asset of **~150–200 common whole foods** (the proteins, carbs, fats, veg a cut/bulk lifter eats), with macros taken **verbatim from CoFID** (PHE/OHID, OGL) — never invented. Seeded into `food_items` idempotently on boot, same pattern as `SEED_EXERCISES`, `source='CoFID'`. This is the "most commonly picked foods offline" guarantee. Curation is a one-time task; **accuracy is non-negotiable** — fabricated macros violate the product's core honesty principle. Pull real CoFID values (don't guess).

## Online access — `src/food/off.ts`

- `searchFoodOnline(q): Promise<FoodItemDraft[]>` and `lookupBarcode(barcode): Promise<FoodItemDraft | null>`.
- **Confirm first** (web check): exact OFF v2 search + product endpoints, CORS from a browser, and the `nutriments` field names (`energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`). Prefer UK-tagged results.
- Map `nutriments` → per-100g fields. **Defensive parsing (honesty-critical):** OFF is crowdsource data with missing/incorrect fields. Items missing `kcal` **or** `protein` are **filtered out, not zero-filled** — silent zeros would under-count protein (T3). The UI says results were hidden and why.
- `saveFoodItem(draft)` upserts into `food_items` (`source='OFF'`) → it instantly becomes a recent and works offline next time.

## Local search — `src/food/local.ts`

Name match over `food_items` (curated CoFID + cached recents). The set is small (hundreds), so a plain indexed filter/`LIKE` suffices — **no FTS5 dependency** in v1. Picker order: recently-logged first, then common, then live results when online.

## Connectivity gate — the "go to wifi" rule

A single `isOnline()` (e.g. `navigator.onLine` + a cheap reachability probe) wraps every network action. Search/scan attempted offline → plain notice: *"You'll need wifi to search for new foods. Your recent and common foods are still here — and quick-add works without a connection."* Recents + common foods + quick-add stay fully usable offline. (Per the developer's explicit requirement.)

## UI — food picker on the Eat day view

Build to the approved mockups (`docs/mockups/food-picker.html`): an "add food" flow in the existing printed-form design language (DESIGN.md §Controls) — search field, recents, common foods, live results, each row showing its **source label** (`CoFID` vs `OFF`; no green "verified" tick — that would borrow the confidence-grade language). Selecting → **grams-primary quantity entry** (FR-LOG-3, amended) with a serving hint beside → a pure `macrosForQuantity(item, grams)` computes kcal/protein/carbs/fat → log via the existing `logFood` with `food_item_id` set and quantity shown **as entered**. "Add" is the single filled control; "Quick add instead" beneath. Day-view totals stay countable-mark meters that fill toward a target (never a draining bar — GR-1). Use the frontend-design / impeccable skills for the build; verify against the mockups with Playwright.

## Attribution

Each item stores `source`. Add a short "Data sources" line (Settings and/or picker footer): food data from **Open Food Facts (ODbL)** and **CoFID (OGL)**, with links — satisfying both licences' attribution. The existing Settings note ("Food data will carry its source and licence per entry once a food database ships") gets made true.

## Honesty guards (non-negotiable)

- **No fabricated macros.** Filter incomplete OFF items and say so; CoFID values verbatim.
- **Source transparency** — OFF (community) vs CoFID (gov-verified), visible per item.
- **Numbers-hidden mode** must be respected on the food surface as elsewhere.

## Testing (TDD; the parser gets a check)

- OFF-response **parser fixtures** (missing fields, junk, unit edge cases) — unit test first; this is correctness-critical.
- `macrosForQuantity(item, grams)` math.
- Local search over curated + recents.
- Barcode upsert/dedup.
- e2e mirroring `log-offline.spec.ts`: search attempted offline → the "need wifi" notice; a curated food logged offline survives a reload.

## Out of scope (later slices)

- **Barcode camera scan** (`@zxing/browser`) — separable; search covers v1.
- **Self-host on the Worker** + OFF "contribute back" loop (Approach 2).
- **FTS5** — only if the offline set ever grows large.
- USDA FDC CC0 fallback for CoFID gaps.

## Likely file map

New: `src/food/off.ts`, `src/food/local.ts`, `src/food/macros.ts` (`macrosForQuantity`), `src/food/seed-foods.ts` (+ the curated CoFID data asset), the picker component(s) under `src/features/nutrition/`, `e2e/food*.spec.ts`, OFF parser fixtures.
Modify: `src/features/nutrition/EatDay.tsx` (add-food entry + picker), `src/features/settings/Settings.tsx` (attribution), the boot/seed path (idempotent food seed). No migration expected.

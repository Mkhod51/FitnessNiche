# Remaining Work

This is the ranked handoff ledger for the next implementation agent. It deliberately separates product-critical work from nice polish so the next session can start without re-auditing the whole repo.

## P0 — Start By Reconfirming State

**Goal:** avoid acting on stale docs.

- Run `git status --short --branch`, `git log --oneline -8`, and `git branch --all --contains HEAD`.
- Run `cd app && npm run typecheck && npm test -- --run`.
- Read `app/CLAUDE.md`, this folder, `docs/PROJECT-STATE.md`, `docs/REQUIREMENTS.md`, and `docs/BUILD-PLAN.md`.
- Check whether the user wants commits pushed or a PR opened. Current instruction history says commit regularly, but do not push or merge without explicit direction.

**Done when:** the new agent has a verified baseline and knows whether they are continuing on `main` or making a feature branch.

## P1 — M6 Claim Curation Expansion

**Why it matters:** the app's differentiator is evidence-graded advice. The current claim base is the M1 tranche: 17 YAML claims in `app/claims/`. The build plan and requirements still target roughly 50 curated claims for AC-6.

**Likely files:**

- `app/claims/*.yaml`
- `app/claims/ADDING-A-CLAIM.md`
- `app/claims/schema.md`
- `app/scripts/build-claims.ts`
- `app/src/advice/*`
- `docs/00-meta/decision-log.md`

**Work left:**

- Expand from 17 to about 50 claims across volume, frequency, failure proximity, rest intervals, protein dose/timing, energy balance, deloads, maintenance/cut/bulk framing, and other product-relevant myths.
- Add steelman coverage for contested clusters, not only settled claims.
- Sweep grade-to-language calibration so [C] and [D] claims cannot sound stronger than their evidence.
- Update `lastReviewed` metadata and add or update a review queue.
- Keep claim grading in the main/strong model. Subagents can fetch metadata, format YAML, and write tests, but they should not make final evidence-grade judgments.

**Done when:** `npm run claims`, typecheck, unit tests, provenance tests, and advice UI tests pass; the claim count and coverage are recorded in `PROJECT-STATE.md`.

## P1 — Sync And Data Rights Hardening

**Why it matters:** the UI honestly says device erasure is not server erasure, and browser-to-real-Worker sync is not end-to-end verified.

**Likely files:**

- `app/server/src/index.ts`
- `app/server/src/sync.ts`
- `app/server/src/*.test.ts`
- `app/src/sync/*`
- `app/src/features/settings/Settings.tsx`
- `app/e2e/*`

**Work left:**

- Add a Worker endpoint for server-side erasure if full account deletion is in scope.
- Wire client settings to call that endpoint only with clear copy and the existing safe delete affordance style.
- Add a browser-to-Worker/D1 round-trip test, likely with Miniflare/D1 or a similarly controlled local Worker setup.
- Keep health data out of URLs and preserve bearer-token handling.

**Done when:** device delete and server delete are explicitly distinct in code/tests, a real Worker/D1 round-trip is proven, and full e2e stays green.

## P1 — Food Provider Production Hardening

**Why it matters:** direct browser calls to Open Food Facts are acceptable for the local v1, but deployment should identify the app, enforce provider rate limits, and keep future provider switching cheap.

**Likely files:**

- `app/src/food/off.ts`
- `app/src/food/*`
- `app/server/src/*`
- `app/src/features/settings/Settings.tsx`
- `docs/00-meta/food-data-provider-research.md`

**Work left:**

- Move OFF calls behind a small Worker proxy before meaningful public traffic.
- Set an app-identifying user agent from the proxy and document OFF registration/attribution obligations.
- Add conservative rate limiting and caching at the network boundary.
- Introduce a `FoodProvider` adapter boundary before adding USDA FDC or a paid provider.
- Add a provider-qualified external ID to `food_items` before multi-provider caching. A barcode alone is not a full provider identity.

**Done when:** the browser no longer calls OFF directly in production mode, provider parsing remains defensive, incomplete rows are hidden, and historical `food_log_entries` remain immutable snapshots.

## P2 — Barcode Camera Scanner

**Why it matters:** manual barcode entry works, but camera scanning is the expected mobile path.

**Likely files:**

- `app/src/features/nutrition/FoodPicker.tsx`
- `app/src/features/nutrition/FoodPicker.test.tsx`
- `app/src/food/off.ts`
- `app/e2e/food.spec.ts`
- `app/package.json`

**Work left:**

- Add `@zxing/browser`.
- Add a camera-scan mode in the food picker, keeping manual barcode search as fallback.
- Handle camera permission denied, no camera, no result, reduced motion, and scanner cleanup on close/navigation.
- Keep the result flow identical to manual barcode lookup: scan code, lookup provider, show result, then user confirms quantity.

**Done when:** unit tests cover mode changes and cleanup; browser tests cover the fallback path; manual entry still works.

## P2 — CoFID Seed Expansion

**Why it matters:** the current seed is intentionally small and audited. The original target was 150-200 common foods.

**Likely files:**

- `app/src/db/seed-foods.ts`
- `app/src/db/seed-foods.test.ts`
- `docs/00-meta/decision-log.md`

**Work left:**

- Expand the seed only with verified CoFID 2021 values.
- Keep values copied from the source, never guessed.
- Consider splitting the seed into a data file if the TypeScript constant becomes unwieldy.

**Done when:** seed count and source audit method are documented, tests pass, and no invented macro values enter the app.

## P2 — Cross-Device Food Recents Strategy

**Why it matters:** `food_log_entries` sync, but `food_items` are local reference/cache rows. A selected OFF item may therefore not exist on another device even though the logged snapshot does.

**Likely files:**

- `app/src/sync/protocol.ts`
- `app/src/food/local.ts`
- `app/src/db/schema.ts`
- `app/server/src/sync.ts`

**Options:**

- Leave as v1 local-cache behavior and make the copy explicit.
- Sync selected `food_items` only, not the whole shipped catalogue.
- Rehydrate missing `food_items` from synced `food_log_entries` snapshots where needed.

**Done when:** the chosen behavior is documented and tested.

## P2 — Small Product And Debt Items

- `LogWeight` still uses `type="number"`; polish to the same decimal-keypad text-input treatment used elsewhere if desired.
- The `exercises` table is seeded but not read; decide whether to harden the seeder with a content hash, delete the table until a reader exists, or leave it.
- `npm audit` has high-severity build-tool advisories through `vite-plugin-pwa`/Workbox. Fixing may require a breaking upgrade, so treat this as build-tool debt unless the deployment target demands it.
- Run Lighthouse/PWA audit and write the demo script called for by M6.
- Update README and final project state after the next substantial milestone.

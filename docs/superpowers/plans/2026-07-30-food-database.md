# Food database (FR-LOG-6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user pick a food (curated CoFID offline seed + cached recents + live Open Food Facts search), enter grams, and log it against a meal — offline-first, with source shown per item and incomplete data hidden rather than guessed.

**Architecture:** No new schema — `food_items` / `food_log_entries` already exist (migration `0003`). A new `src/food/` module holds the pure logic (OFF parser, macro math, connectivity gate) and local cache access. The OFF API is called directly from the browser and parsed defensively; chosen items are upserted into `food_items` by barcode so they work offline next time. A picker component on the Eat day view composes recents + common foods + live results, then a grams-first quantity step computes macros and calls the existing `logFood`.

**Tech Stack:** React 19 + TypeScript (strict), drizzle-orm over sqlite-proxy, Vitest, Playwright. No new runtime dependencies. Open Food Facts v2 REST API (read-only, client-side).

## Global Constraints

- **Never merge to `main`.** All work stays on `OpenSourceMod`. The developer merges `main` themselves. (Memory: `never-merge-to-main`.)
- **Offline-first, never lose a write** (NFR-1/2). Recents + common foods + quick-add stay fully usable with no connection.
- **No fabricated food data (T3).** CoFID values are copied **verbatim** from the CoFID dataset; OFF values are taken **as-given**. Never invent a macro. Inventing values is the fabrication this product exists to refuse.
- **Honest UI.** Filter OFF items missing energy **or** protein (no zero-fill); show the source per item (`CoFID` vs `OFF`); surface "N results hidden — missing protein or energy".
- **Grams is the primary quantity** (FR-LOG-3, amended); show the quantity **as entered**.
- **Every network action** shows a plain "you'll need wifi" message when there is no connection (or when the call fails). The app never fails silently.
- **GR-1:** day-view totals stay countable-mark meters that **fill toward** a target — never a draining bar. No shadow anywhere a meter must not deplete to zero.
- **No LLM in the trust path** (T1). Food data is deterministic; the OFF parser is plain code.
- **Prose register:** plain, human copy in the UI — no em-dashes, no "not X but Y", no AI intensifiers (Memory: `avoid-ai-prose-tells`).
- **Commits:** frequent, small, human-sounding messages, **no AI attribution footers, no conventional-commit prefixes** (see `app/CLAUDE.md`). Commit at every green test cycle. Run `cd app && npm run typecheck && npm test -- --run` before each commit.
- **Graphify:** run `graphify query "<question>"` before reading source; run `graphify update .` after code changes.

---

## Critical findings recorded during planning (record these durably at build time)

These surfaced while reading the approved spec against the actual code. They do **not** re-litigate the design — they resolve ambiguities the design left open, or correct a hand-off doc.

1. **`food_items` is deliberately NOT synced.** The hand-off prompt says it is "sync-marked"; it is not. `SYNC_TABLES` in `app/src/sync/protocol.ts:22-29` lists `food_log_entries` but excludes `food_items`, with an explicit comment: *"exercises and food_items are reference data shipped with the build… syncing them would push a catalogue up and down forever."* **Consequence:** `saveFoodItem` does **not** call `markPending`. Cached OFF items are device-local. Cross-device recents are **not** a v1 feature (the `food_log_entries` row syncs, but its underlying `food_items` row does not exist on the other device). → **Record in `docs/00-meta/decision-log.md`** during execution; a cross-device-recent follow-up would require adding `food_items` to `SYNC_TABLES`.

2. **FR-LOG-6 deviation (already flagged in the design).** The spec says "self-hosted/cached"; this ships **live-fetched from OFF + cached, not self-hosted**. Caching is preserved (rows land in `food_items`). → **Append to `docs/00-meta/decision-log.md`** when Task 5 lands.

3. **OFF energy may arrive as kJ only.** Many OFF products have `energy_100g` (kJ) but no `energy-kcal_100g`. Converting kJ→kcal (÷ 4.184) is an **exact unit conversion, not fabrication**, so the parser accepts either source. Protein must be present directly (`proteins_100g`) — there is no honest fallback. This is the one parser judgment call that touches the honesty guard; it is documented in `src/food/off.ts`.

4. **OFF CORS is not conclusively documented** but OFF is known to permit browser GET reads (`Access-Control-Allow-Origin: *`). The client calls OFF directly; because every call is wrapped so that any failure renders the same "you'll need wifi" notice, a CORS surprise degrades to that message rather than breaking. → Verify with a live browser probe in Task 6.

5. **v1 seed count: ~50, not 150–200.** The design targets 150–200 curated foods; v1 ships a tight, fully-verified ~50 (accuracy-first, every value auditable against CoFID) with the loader ready for expansion. The marginal value of rows 50–200 is lower and each row costs a manual verification. Expanding to the full target is a documented follow-up, not a code change. **Surface this to the developer.**

6. **Whey/protein supplements are NOT in CoFID** (CoFID is whole foods). Such items come via OFF live search, not the seed. The curated list below contains only whole foods.

---

## File structure

**New (pure logic + data):**
- `app/src/food/types.ts` — `FoodItem`, `FoodItemDraft`, `FoodSource` types (reuses `foodItems.$inferSelect`).
- `app/src/food/off.ts` — `parseOffProduct`, `parseOffSearch` (pure, honesty-critical) + `searchFoodOnline`, `lookupBarcode` (fetch client).
- `app/src/food/macros.ts` — `macrosForQuantity` (pure).
- `app/src/food/connectivity.ts` — `isOnline`, `useOnline` (the wifi gate).
- `app/src/food/local.ts` — `saveFoodItem`, `getRecentFoods`, `searchFoodLocal`, `getCommonFoods` (drizzle over `food_items`).
- `app/src/db/seed-foods.ts` — `SEED_FOODS` data + `SeedFood` type (mirrors `seed-exercises.ts`; values verbatim from CoFID).
- `app/src/features/nutrition/FoodPicker.tsx` — picker (screens 2–4) + quantity step (screen 5).
- `app/e2e/food.spec.ts` — offline gate + offline-log-survival e2e.

**New tests:** `app/src/food/off.test.ts`, `macros.test.ts`, `connectivity.test.ts`, `local.test.ts`, `app/src/db/seed-foods.test.ts`, `app/src/features/nutrition/FoodPicker.test.tsx`.

**Modify:**
- `app/src/db/seed.ts` — add `seedFoods(exec)` (sibling to `seedExercises`).
- `app/src/db/client.ts:50` — call `seedFoods(execSql)` right after `seedExercises(execSql)`.
- `app/src/features/nutrition/EatDay.tsx` — `+ Add food` opens `FoodPicker`; existing quick-add form moves inside the picker as the "Quick add instead" fallback.
- `app/src/features/settings/Settings.tsx` — make the existing "food data will carry its source…" note true; add a "Data sources" attribution line (OFF/ODbL + CoFID/OGL links).

**Delegation hints** (token discipline; the Agent tool's `model` enum is `sonnet|opus|haiku|fable` — there is no "glm-4.7", so "weaker model" = `haiku`):
- **Keep the strong model (do inline):** Task 1 (parser), Task 3 (connectivity gate), Task 5 (seed data curation), Task 6 (OFF client), Task 7 (picker design decisions), any honesty/GR guard.
- **Delegate to a `haiku` subagent:** Task 2 (macros — near-trivial), Task 4 (local.ts — mirrors `nutrition.ts`), the `seedFoods` loader in Task 5 (mechanical mirror of `seedExercises`), Task 9 (Settings attribution text). Include the graphify-before-reading rule in every subagent prompt.

---

## Task 1: OFF response parser + types (TDD first, correctness-critical)

**Files:**
- Create: `app/src/food/types.ts`, `app/src/food/off.ts`
- Test: `app/src/food/off.test.ts`

**Interfaces:**
- Produces: `FoodItemDraft` (in `types.ts`); `parseOffProduct(product: unknown): FoodItemDraft | null`; `parseOffSearch(products: unknown[]): { drafts: FoodItemDraft[]; hidden: number }`. Consumed by Task 4 (`saveFoodItem`) and Task 6 (client).

- [ ] **Step 1: Write the failing test**

```ts
// app/src/food/off.test.ts
import { describe, it, expect } from 'vitest';
import { parseOffProduct, parseOffSearch } from './off';

const good = {
  code: '737628064502',
  product_name: 'Skyr Plain',
  brands: 'Arla, Siggi’s',
  nutriments: {
    'energy-kcal_100g': 62, 'proteins_100g': 11,
    'carbohydrates_100g': 4, 'fat_100g': 0.2, 'fiber_100g': 0,
  },
};

describe('parseOffProduct', () => {
  it('maps a complete product to a draft', () => {
    expect(parseOffProduct(good)).toMatchObject({
      source: 'off', name: 'Skyr Plain', brand: 'Arla', barcode: '737628064502',
      kcalPer100g: 62, proteinGPer100g: 11, carbsGPer100g: 4, fatGPer100g: 0.2,
    });
  });

  it('converts energy from kJ when kcal is absent (exact, not fabrication)', () => {
    const d = parseOffProduct({ ...good, nutriments: { energy_100g: 259.4, proteins_100g: 11 } });
    expect(d?.kcalPer100g).toBeCloseTo(62, 0); // 259.4 / 4.184
  });

  it('drops a product missing both kcal sources (hidden, not zero-filled)', () => {
    expect(parseOffProduct({ ...good, nutriments: { proteins_100g: 11 } })).toBeNull();
  });

  it('drops a product missing protein — a silent 0 would under-count the day', () => {
    expect(parseOffProduct({ ...good, nutriments: { 'energy-kcal_100g': 62 } })).toBeNull();
  });

  it('drops junk and empty payloads without throwing', () => {
    expect(parseOffProduct(null)).toBeNull();
    expect(parseOffProduct('nope')).toBeNull();
    expect(parseOffProduct({})).toBeNull();
    expect(parseOffProduct({ nutriments: {} })).toBeNull();
  });

  it('drops a product with no readable name', () => {
    expect(parseOffProduct({ code: '1', nutriments: good.nutriments })).toBeNull();
  });
});

describe('parseOffSearch', () => {
  it('returns the kept drafts and how many were hidden', () => {
    const { drafts, hidden } = parseOffSearch([
      good,
      { product_name: 'x', nutriments: { proteins_100g: 5 } }, // missing energy -> hidden
    ]);
    expect(drafts).toHaveLength(1);
    expect(hidden).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- --run src/food/off.test.ts`
Expected: FAIL ("Cannot find module './off'").

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/food/types.ts
import type { foodItems } from '../db/schema';

/** One row of food_items, as stored/queried locally. */
export type FoodItem = typeof foodItems.$inferSelect;
export type FoodSource = 'cofid' | 'off' | 'fdc' | 'user';

/**
 * A food before it is persisted: what OFF returns, mapped to our columns, but
 * not yet written to food_items. saveFoodItem() turns this into a row.
 */
export type FoodItemDraft = {
  source: 'off';
  name: string;
  brand?: string;
  barcode?: string;
  kcalPer100g: number;
  proteinGPer100g: number;
  carbsGPer100g?: number;
  fatGPer100g?: number;
  fibreGPer100g?: number;
  servingGrams?: number;
  servingLabel?: string;
};
```

```ts
// app/src/food/off.ts
import type { FoodItemDraft } from './types';

/** 1 kcal = 4.184 kJ. Exact unit conversion, used only when OFF gives kJ only. */
const KJ_PER_KCAL = 4.184;
type Nutriments = Record<string, number | undefined>;

/** Coerce a crowdsource value to a finite non-negative number, else undefined. */
function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) && (n as number) >= 0 ? (n as number) : undefined;
}

function energyKcal(n: Nutriments): number | undefined {
  const direct = num(n['energy-kcal_100g']);
  if (direct !== undefined) return direct;
  const kj = num(n['energy_100g']);
  return kj === undefined ? undefined : kj / KJ_PER_KCAL;
}

/**
 * Map one OFF product to a draft, or null when it is incomplete.
 *
 * Honesty rule (T3): an item missing energy or protein is DROPPED, never
 * zero-filled — a silent 0 g protein would under-count the day's protein and
 * look like a real number. Energy may come from `energy-kcal_100g` directly or
 * be converted exactly from `energy_100g` (kJ); protein must be present directly.
 */
export function parseOffProduct(p: unknown): FoodItemDraft | null {
  if (!p || typeof p !== 'object') return null;
  const product = p as Record<string, unknown>;
  const n = (product.nutriments ?? {}) as Nutriments;

  const kcal = energyKcal(n);
  const protein = num(n['proteins_100g']);
  if (kcal === undefined || protein === undefined) return null;

  const name = String(product.product_name ?? product['product_name_en'] ?? '').trim();
  if (!name) return null;

  const brands = String(product.brands ?? '');
  return {
    source: 'off',
    name,
    brand: brands ? brands.split(',')[0].trim() : undefined,
    barcode: product.code ? String(product.code) : undefined,
    kcalPer100g: kcal,
    proteinGPer100g: protein,
    carbsGPer100g: num(n['carbohydrates_100g']),
    fatGPer100g: num(n['fat_100g']),
    fibreGPer100g: num(n['fiber_100g']) ?? num(n['fibre_100g']),
  };
}

/** Parse OFF's search payload into usable drafts + how many were hidden. */
export function parseOffSearch(products: unknown[]): { drafts: FoodItemDraft[]; hidden: number } {
  let hidden = 0;
  const drafts: FoodItemDraft[] = [];
  for (const p of products) {
    const d = parseOffProduct(p);
    if (d) drafts.push(d);
    else hidden += 1;
  }
  return { drafts, hidden };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- --run src/food/off.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/food/types.ts app/src/food/off.ts app/src/food/off.test.ts
git commit -m "parse open food facts payloads, hiding items missing energy or protein"
```

---

## Task 2: macrosForQuantity (pure math)

Delegate-able to a `haiku` subagent. The computation the quantity step leans on.

**Files:**
- Create: `app/src/food/macros.ts`
- Test: `app/src/food/macros.test.ts`

**Interfaces:**
- Consumes: `FoodItem` per-100g fields (Task 1's `types.ts`).
- Produces: `macrosForQuantity(item, grams): { kcal, proteinG, carbsG, fatG }`. Consumed by Task 7 (quantity step).

- [ ] **Step 1: Write the failing test**

```ts
// app/src/food/macros.test.ts
import { describe, it, expect } from 'vitest';
import { macrosForQuantity } from './macros';

const chicken = { kcalPer100g: 165, proteinGPer100g: 31, carbsGPer100g: 0, fatGPer100g: 3.6 };

describe('macrosForQuantity', () => {
  it('scales per-100g values to an arbitrary gram weight', () => {
    expect(macrosForQuantity(chicken, 200)).toEqual({ kcal: 330, proteinG: 62, carbsG: 0, fatG: 7.2 });
  });
  it('handles zero grams without NaN', () => {
    expect(macrosForQuantity(chicken, 0)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });
  it('treats missing carbs/fat as zero, not NaN', () => {
    expect(macrosForQuantity({ kcalPer100g: 100, proteinGPer100g: 10 }, 50)).toEqual({ kcal: 50, proteinG: 5, carbsG: 0, fatG: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- --run src/food/macros.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/food/macros.ts
import type { FoodItem } from './types';

export type MacroResult = { kcal: number; proteinG: number; carbsG: number; fatG: number };
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Pure. Macros for an arbitrary gram weight, from a per-100g item. */
export function macrosForQuantity(
  item: Pick<FoodItem, 'kcalPer100g' | 'proteinGPer100g' | 'carbsGPer100g' | 'fatGPer100g'>,
  grams: number,
): MacroResult {
  const f = grams / 100;
  return {
    kcal: Math.round(item.kcalPer100g * f),
    proteinG: r1(item.proteinGPer100g * f),
    carbsG: r1((item.carbsGPer100g ?? 0) * f),
    fatG: r1((item.fatGPer100g ?? 0) * f),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- --run src/food/macros.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/food/macros.ts app/src/food/macros.test.ts
git commit -m "scale per-100g macros to a gram weight"
```

---

## Task 3: connectivity gate (the "you'll need wifi" rule)

Strong model. `navigator.onLine` is the cheap optimistic signal; the real probe is the fetch itself — any failure renders the same notice (Task 6/7 wire that). No separate reachability probe in v1 (YAGNI); note it as the upgrade.

**Files:**
- Create: `app/src/food/connectivity.ts`
- Test: `app/src/food/connectivity.test.ts`

**Interfaces:**
- Produces: `isOnline(): boolean`; `useOnline(): boolean` (React hook). Consumed by Task 6 + Task 7.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/food/connectivity.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { isOnline, useOnline } from './connectivity';

describe('isOnline', () => {
  afterEach(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });
  it('reads navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isOnline()).toBe(false);
  });
  it('defaults to online where navigator is absent', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isOnline()).toBe(true);
  });
});

describe('useOnline', () => {
  it('flips on the browser online/offline events', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });
});
```

> Confirm `@testing-library/react` is already a dependency (it backs the existing `.test.tsx` files). If not, fall back to a hand-rolled hook render — do **not** add a dependency for this.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- --run src/food/connectivity.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/food/connectivity.ts
import { useEffect, useState } from 'react';

/**
 * The cheapest honest signal that the network is reachable.
 * Optimistic on purpose: navigator.onLine can be wrong (captive portals), so
 * the OFF fetch itself is the real probe — any failure renders the same
 * "you'll need wifi" notice. One message, two causes.
 */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/** React hook: online state that tracks the browser's online/offline events. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const go = (v: boolean) => () => setOnline(v);
    const on = go(true);
    const off = go(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- --run src/food/connectivity.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/food/connectivity.ts app/src/food/connectivity.test.ts
git commit -m "add an online gate that the food search falls back through"
```

---

## Task 4: food_items cache access (local.ts)

Delegate-able to `haiku`. Mirrors the drizzle patterns in `app/src/db/nutrition.ts`. Uses the same in-memory test harness as `nutrition.test.ts`.

**Files:**
- Create: `app/src/food/local.ts`
- Test: `app/src/food/local.test.ts`

**Interfaces:**
- Consumes: `FoodItemDraft` (Task 1); drizzle `foodItems` / `foodLogEntries`.
- Produces: `saveFoodItem(draft, now?): Promise<FoodItem>`; `getRecentFoods(limit?): Promise<FoodItem[]>`; `searchFoodLocal(q, limit?): Promise<FoodItem[]>`; `getCommonFoods(limit?): Promise<FoodItem[]>`. Consumed by Task 6 (`searchFoodOnline` saves picks) and Task 7 (picker).

- [ ] **Step 1: Write the failing test**

```ts
// app/src/food/local.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { runMigrations, type Exec } from '../db/migrate';
import { makeProxyCallback, type ExecWithChanges } from '../db/client';
import * as schema from '../db/schema';

let testDz: ReturnType<typeof drizzle>;
vi.mock('../db/client', async () => {
  const actual = await vi.importActual<typeof import('../db/client')>('../db/client');
  return { ...actual, getDrizzle: () => testDz };
});
import { saveFoodItem, getRecentFoods, searchFoodLocal, getCommonFoods } from './local';
import { logFood } from '../db/nutrition';

async function makeTestDb() {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  const exec: ExecWithChanges = async (sql, params = []) => {
    const rows = (db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []) as unknown[][];
    return { rows, changes: db.changes() as number };
  };
  const execRows: Exec = async (sql, p, m) => (await exec(sql, p ?? [], m ?? 'all')).rows;
  await runMigrations(execRows);
  return drizzle(makeProxyCallback(exec), { schema });
}

describe('food_items cache', () => {
  beforeEach(async () => { testDz = await makeTestDb(); });

  it('saves an OFF draft and reads it back', async () => {
    const saved = await saveFoodItem({ source: 'off', name: 'Skyr', barcode: '1', kcalPer100g: 62, proteinGPer100g: 11 });
    expect(saved.id).toBeTruthy();
    expect((await searchFoodLocal('skyr'))[0]).toMatchObject({ name: 'Skyr', source: 'off' });
  });

  it('upserts by barcode instead of duplicating', async () => {
    await saveFoodItem({ source: 'off', name: 'Skyr', barcode: '1', kcalPer100g: 62, proteinGPer100g: 11 });
    await saveFoodItem({ source: 'off', name: 'Skyr Plain', barcode: '1', kcalPer100g: 62, proteinGPer100g: 11 });
    expect((await searchFoodLocal('skyr'))).toHaveLength(1);
  });

  it('recents are the food_items behind recently-logged entries, newest first, deduped', async () => {
    const oats = await saveFoodItem({ source: 'off', name: 'Oats', barcode: 'A', kcalPer100g: 380, proteinGPer100g: 13 });
    const chicken = await saveFoodItem({ source: 'off', name: 'Chicken', barcode: 'B', kcalPer100g: 165, proteinGPer100g: 31 });
    await logFood({ name: 'Oats', mealSlot: 'breakfast', kcal: 300, proteinG: 10, foodItemId: oats.id }, new Date(2026, 6, 28, 8));
    await logFood({ name: 'Chicken', mealSlot: 'dinner', kcal: 330, proteinG: 62, foodItemId: chicken.id }, new Date(2026, 6, 28, 19));
    const recents = await getRecentFoods();
    expect(recents.map((f) => f.name)).toEqual(['Chicken', 'Oats']);
  });

  it('common foods are the CoFID rows', async () => {
    await testDz.insert(schema.foodItems).values({
      id: 'eggs-boiled', source: 'cofid', name: 'Eggs, boiled',
      kcalPer100g: 131, proteinGPer100g: 13, carbsGPer100g: 0, fatGPer100g: 9,
      updatedAt: '2026-07-30T00:00:00.000Z',
    });
    expect((await getCommonFoods()).map((f) => f.name)).toEqual(['Eggs, boiled']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- --run src/food/local.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/food/local.ts
import { and, eq, like, isNull, isNotNull, desc } from 'drizzle-orm';
import { getDrizzle } from '../db/client';
import { foodItems, foodLogEntries } from '../db/schema';
import { newId } from '../db/id';
import { LOCAL_USER_ID } from '../db/user';
import type { FoodItem, FoodItemDraft } from './types';

/**
 * Upsert by barcode. Caches an OFF pick so it works offline next time.
 * No markPending — food_items is reference/cache data, deliberately not synced
 * (SYNC_TABLES excludes it; see protocol.ts).
 */
export async function saveFoodItem(draft: FoodItemDraft, now: Date = new Date()): Promise<FoodItem> {
  const db = getDrizzle();
  const at = now.toISOString();
  const cols = {
    name: draft.name,
    brand: draft.brand ?? null,
    kcalPer100g: draft.kcalPer100g,
    proteinGPer100g: draft.proteinGPer100g,
    carbsGPer100g: draft.carbsGPer100g ?? 0,
    fatGPer100g: draft.fatGPer100g ?? 0,
    fibreGPer100g: draft.fibreGPer100g ?? null,
    servingGrams: draft.servingGrams ?? null,
    servingLabel: draft.servingLabel ?? null,
  };
  if (draft.barcode) {
    const existing = await db.select().from(foodItems).where(eq(foodItems.barcode, draft.barcode)).get();
    if (existing) {
      await db.update(foodItems).set({ ...cols, updatedAt: at }).where(eq(foodItems.id, existing.id)).run();
      return (await db.select().from(foodItems).where(eq(foodItems.id, existing.id)).get())!;
    }
  }
  const id = newId();
  await db.insert(foodItems).values({ id, source: 'off', ...cols, barcode: draft.barcode ?? null, updatedAt: at }).run();
  return (await db.select().from(foodItems).where(eq(foodItems.id, id)).get())!;
}

/** Name match over the local cache (curated CoFID + cached recents). */
export async function searchFoodLocal(q: string, limit = 20): Promise<FoodItem[]> {
  const term = q.trim();
  if (!term) return [];
  return db => db; // placeholder removed below
}
```

Complete `searchFoodLocal`, `getRecentFoods`, `getCommonFoods` as:

```ts
export async function searchFoodLocal(q: string, limit = 20): Promise<FoodItem[]> {
  const db = getDrizzle();
  const term = q.trim();
  if (!term) return [];
  return db.select().from(foodItems).where(like(foodItems.name, `%${term}%`)).limit(limit);
}

/** Recently-logged foods (their food_items row), newest pick first, deduped. */
export async function getRecentFoods(limit = 6): Promise<FoodItem[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ item: foodItems })
    .from(foodLogEntries)
    .innerJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
    .where(and(eq(foodLogEntries.userId, LOCAL_USER_ID), isNull(foodLogEntries.deletedAt), isNotNull(foodLogEntries.foodItemId)))
    .orderBy(desc(foodLogEntries.loggedAt))
    .limit(limit * 3);
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const r of rows) {
    if (seen.has(r.item.id)) continue;
    seen.add(r.item.id);
    out.push(r.item);
    if (out.length === limit) break;
  }
  return out;
}

/** The curated CoFID set — the offline "common foods" list, name-ordered. */
export async function getCommonFoods(limit = 12): Promise<FoodItem[]> {
  const db = getDrizzle();
  return db.select().from(foodItems).where(eq(foodItems.source, 'cofid')).orderBy(foodItems.name).limit(limit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- --run src/food/local.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/food/local.ts app/src/food/local.test.ts
git commit -m "cache picked foods by barcode and read recents locally"
```

---

## Task 5: CoFID seed (loader + curated data) — accuracy-critical

**5a — the loader** (delegate-able to `haiku`; mechanical mirror of `seedExercises`). **5b — the data** (strong model only; values verbatim from CoFID).

**Files:**
- Create: `app/src/db/seed-foods.ts` (`SEED_FOODS`, `SeedFood`)
- Modify: `app/src/db/seed.ts` (add `seedFoods`)
- Modify: `app/src/db/client.ts:50` (call it)
- Test: `app/src/db/seed-foods.test.ts`

**Interfaces:**
- Produces: `SEED_FOODS: SeedFood[]`; `seedFoods(exec): Promise<number>`. The seed populates the `cofid` rows that `getCommonFoods()` (Task 4) reads.

- [ ] **Step 1 (5b first — get the real numbers): Fetch CoFID and curate**

Source: the OHID/PHE **Composition of Foods Integrated Dataset (CoFID)** — `https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid` (OGL). Download the dataset, and for each item below copy **verbatim**: Energy (kcal) per 100g, Protein, Carbohydrate, Fat, Fibre (AOAC where given, else NSP; record which). If a value is genuinely absent in CoFID, omit the optional field — do **not** invent one. Curated v1 list (slug · display name):

```
chicken-breast-grilled · Chicken breast, grilled        turkey-breast-grilled · Turkey breast, grilled
chicken-breast-raw · Chicken breast, raw                beef-mince-lean-raw · Beef mince, lean, raw
beef-steak-grilled · Beef steak, grilled                salmon-atlantic-grilled · Salmon, grilled
salmon-atlantic-raw · Salmon, raw                       tuna-canned-brine · Tuna, canned in brine
cod-raw · Cod, raw                                       prawns-raw · Prawns, raw
eggs-whole-boiled · Eggs, whole, boiled                 egg-white-raw · Egg white, raw
greek-yogurt-plain · Greek yogurt, plain                skyr-plain · Skyr, plain
cottage-cheese · Cottage cheese                          tofu-firm · Tofu, firm
lentils-boiled · Lentils, boiled                         chickpeas-boiled · Chickpeas, boiled
black-beans-boiled · Black beans, boiled                edamame · Edamame beans
oats-rolled · Oats, rolled                               rice-white-boiled · Rice, white, boiled
rice-brown-boiled · Rice, brown, boiled                 pasta-boiled · Pasta, boiled
bread-wholemeal · Bread, wholemeal                       bread-white · Bread, white
potato-boiled · Potato, boiled                           sweet-potato-baked · Sweet potato, baked
quinoa-boiled · Quinoa, boiled                           banana · Banana
apple · Apple                                            broccoli-boiled · Broccoli, boiled
spinach-raw · Spinach, raw                               carrots-raw · Carrots, raw
peppers-red-raw · Peppers, red, raw                      mushrooms-raw · Mushrooms, raw
tomato-raw · Tomato, raw                                 kale · Kale
green-beans-boiled · Green beans, boiled                onion-raw · Onion, raw
olive-oil · Olive oil                                    butter · Butter
peanut-butter · Peanut butter                            almonds · Almonds
walnuts · Walnuts                                        avocado · Avocado
milk-whole · Milk, whole                                 milk-semi-skimmed · Milk, semi-skimmed
cheddar · Cheddar cheese
```

> **Whey/protein powder is intentionally absent** — it is not a CoFID whole food; users find it via OFF search. If a listed item is absent from CoFID entirely, drop it rather than substitute (record the drop).

- [ ] **Step 2: Write `seed-foods.ts` with the real values**

```ts
// app/src/db/seed-foods.ts
/**
 * Curated CoFID seed. Every macro is copied verbatim from the Composition of
 * Foods Integrated Dataset (PHE/OHID, OGL). None are invented — fabricated
 * macros violate this product's core honesty principle. Source page:
 * https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 */
export type SeedFood = {
  id: string;                 // stable slug
  name: string;               // display
  kcalPer100g: number;        // CoFID "Energy (kcal)" per 100g
  proteinGPer100g: number;
  carbsGPer100g: number;
  fatGPer100g: number;
  fibreGPer100g?: number;     // omitted when CoFID gives none
  servingGrams?: number;      // a sensible default gram weight for the serving hint
  servingLabel?: string;
};

export const SEED_FOODS: SeedFood[] = [
  // { id: 'chicken-breast-grilled', name: 'Chicken breast, grilled', kcalPer100g: <cofid>, proteinGPer100g: <cofid>, carbsGPer100g: <cofid>, fatGPer100g: <cofid>, servingGrams: 120, servingLabel: '1 small fillet' },
  // ...one row per curated item, real CoFID values only
];
```

- [ ] **Step 3: Add `seedFoods` to `app/src/db/seed.ts`**

```ts
import { SEED_FOODS } from './seed-foods';

const FOOD_SEED_AT = '2026-07-30T00:00:00.000Z'; // immutable reference data — one fixed stamp

/** Idempotent CoFID seed, same shape as seedExercises. Gated on the cofid row
 * count (cached OFF rows may already live in food_items). insert-or-replace
 * repairs an interrupted first boot. */
export async function seedFoods(exec: Exec): Promise<number> {
  const present = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
  if (Number(present[0]?.[0] ?? 0) === SEED_FOODS.length) return 0;

  await exec('begin', [], 'run');
  try {
    for (const f of SEED_FOODS) {
      await exec(
        `insert or replace into food_items (id, source, name, brand, barcode, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fibre_g_per_100g, serving_grams, serving_label, updated_at)
         values (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [f.id, 'cofid', f.name, null, null, f.kcalPer100g, f.proteinGPer100g, f.carbsGPer100g, f.fatGPer100g, f.fibreGPer100g ?? null, f.servingGrams ?? null, f.servingLabel ?? null, FOOD_SEED_AT],
        'run',
      );
    }
    await exec('commit', [], 'run');
  } catch (err) {
    try { await exec('rollback', [], 'run'); } catch { /* sqlite already rolled back */ }
    throw err;
  }
  return SEED_FOODS.length;
}
```

- [ ] **Step 4: Wire it in `app/src/db/client.ts`**

In `initDb()`, after `await seedExercises(execSql);` (line 50), add:
```ts
await seedFoods(execSql);
```
and the import `{ seedExercises, seedFoods } from './seed'`.

- [ ] **Step 5: Write the loader test (mirror `seed.test.ts`)**

```ts
// app/src/db/seed-foods.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { seedFoods } from './seed';
import { SEED_FOODS } from './seed-foods';
import { runMigrations, type Exec } from './migrate';

async function makeRealExec(): Promise<Exec> {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  return async (sql, params = [], _m) => (db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []) as unknown[][];
}

describe('seedFoods', () => {
  let exec: Exec;
  beforeEach(async () => { exec = await makeRealExec(); await runMigrations(exec); });

  it('seeds every curated food on a fresh database', async () => {
    expect(await seedFoods(exec)).toBe(SEED_FOODS.length);
    const rows = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
    expect(Number(rows[0][0])).toBe(SEED_FOODS.length);
  });
  it('does nothing when the cofid seed is already complete', async () => {
    await seedFoods(exec);
    expect(await seedFoods(exec)).toBe(0);
  });
  it('repairs a half-seeded table left by an interrupted first boot', async () => {
    await seedFoods(exec);
    await exec(`delete from food_items where id = ?`, [SEED_FOODS[0].id], 'run');
    expect(await seedFoods(exec)).toBe(SEED_FOODS.length);
    const rows = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
    expect(Number(rows[0][0])).toBe(SEED_FOODS.length);
  });
  it('leaves cached OFF rows untouched', async () => {
    await exec(`insert into food_items (id, source, name, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, updated_at) values ('x','off','Skyr',62,11,4,0.2,'2026-07-30T00:00:00.000Z')`, [], 'run');
    await seedFoods(exec);
    const off = await exec("select count(*) from food_items where source = 'off'", [], 'all');
    expect(Number(off[0][0])).toBe(1);
  });
});
```

- [ ] **Step 6: Run tests; verify the full suite is green**

Run: `cd app && npm test -- --run src/db/seed-foods.test.ts && npm run typecheck && npm test -- --run`
Expected: PASS; whole suite green.

- [ ] **Step 7: Record the deviation, then commit**

Append to `docs/00-meta/decision-log.md`: the FR-LOG-6 "self-hosted → live-fetched + cached" deviation, the food_items-not-synced finding (finding #1), and the v1 seed-count decision (finding #5).

```bash
git add app/src/db/seed-foods.ts app/src/db/seed.ts app/src/db/client.ts app/src/db/seed-foods.test.ts docs/00-meta/decision-log.md
git commit -m "seed the common-foods list from cofid, verbatim"
```

---

## Task 6: OFF client (search + barcode) — correctness-critical

Strong model. Uses the Task 1 parser and the Task 3 gate. Direct browser `fetch`; any failure surfaces as the wifi notice (Task 7).

**Files:**
- Modify: `app/src/food/off.ts` (append client functions)
- Test: `app/src/food/off-client.test.ts` (mock `fetch`)

**Interfaces:**
- Produces: `searchFoodOnline(q): Promise<{ drafts: FoodItemDraft[]; hidden: number }>`; `lookupBarcode(barcode): Promise<FoodItemDraft | null>`.

- [ ] **Step 1: Confirm CORS with a live probe**

In a browser dev console (or a Playwright snippet against a running preview), run:
```js
fetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=skyr&search_simple=1&action=process&json=1&page_size=1&fields=code,product_name,nutriments')
  .then(r => r.json()).then(j => console.log('ok', j.count, j.products?.[0]?.nutriments));
```
Confirm it resolves (CORS allowed) and note the `nutriments` key spelling (`fiber_100g` vs `fibre_100g`). If it is CORS-blocked, **stop and surface it** — do not silently add a proxy (out of v1 scope). Record the result in `docs/00-meta/decision-log.md`.

Research update, 2026-07-31: OFF v3 has no full-text search and v2 structured search is not the right plain keyword API. Use legacy `/cgi/search.pl` for keyword search, and the current `/api/v3.6/product/{barcode}.json` product endpoint for barcode lookup. Keep direct browser calls in v1, but record the production caveat that browsers cannot set OFF's requested custom User-Agent header; a deployed app should later proxy OFF requests so it can identify itself and enforce rate limits. See `docs/00-meta/food-data-provider-research.md`.

- [ ] **Step 2: Write the failing test**

```ts
// app/src/food/off-client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchFoodOnline, lookupBarcode } from './off';

function mockFetch(payload: unknown, ok = true) {
  globalThis.fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => payload }) as any) as any;
}
beforeEach(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });

describe('searchFoodOnline', () => {
  it('returns parsed drafts and the hidden count', async () => {
    mockFetch({ count: 3, products: [
      { code: '1', product_name: 'Skyr', nutriments: { 'energy-kcal_100g': 62, proteins_100g: 11 } },
      { code: '2', product_name: 'X', nutriments: { proteins_100g: 5 } },
    ]});
    const { drafts, hidden } = await searchFoodOnline('skyr');
    expect(drafts).toHaveLength(1);
    expect(hidden).toBe(1);
  });
  it('throws on a non-ok response (caller shows the wifi notice)', async () => {
    mockFetch({}, false);
    await expect(searchFoodOnline('x')).rejects.toBeDefined();
  });
});

describe('lookupBarcode', () => {
  it('returns a draft for a found product, null for status 0', async () => {
    mockFetch({ status: 1, product: { code: '1', product_name: 'Skyr', nutriments: { 'energy-kcal_100g': 62, proteins_100g: 11 } } });
    expect((await lookupBarcode('1'))?.name).toBe('Skyr');
    mockFetch({ status: 0, product: null });
    expect(await lookupBarcode('nope')).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd app && npm test -- --run src/food/off-client.test.ts`
Expected: FAIL (functions missing).

- [ ] **Step 4: Write minimal implementation** (append to `app/src/food/off.ts`)

```ts
const OFF_ORIGIN = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'code,product_name,product_name_en,brands,nutriments';

/** Live OFF text search. Throws on any failure — the caller renders the wifi notice. */
export async function searchFoodOnline(q: string): Promise<{ drafts: FoodItemDraft[]; hidden: number }> {
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: OFF_FIELDS,
  });
  const url = `${OFF_ORIGIN}/cgi/search.pl?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`OFF search failed (${res.status})`);
  const json = (await res.json()) as { products?: unknown[] };
  return parseOffSearch(json.products ?? []);
}

/** Live OFF barcode lookup, or null when OFF has no match. */
export async function lookupBarcode(barcode: string): Promise<FoodItemDraft | null> {
  const res = await fetch(`${OFF_ORIGIN}/api/v3.6/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`);
  if (!res.ok) throw new Error(`OFF lookup failed (${res.status})`);
  const json = (await res.json()) as { status: number; product?: unknown };
  if (json.status !== 1 || !json.product) return null;
  return parseOffProduct(json.product);
}
```

> UK-preference (`countries_tags_en=united kingdom`) is a tuning knob left out of v1 to maximise recall; add it later if non-UK noise dominates. The UI must avoid search-as-you-type network calls; OFF allows 10 search requests/minute/IP and says not to use search for autocomplete.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd app && npm test -- --run src/food/off-client.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/food/off.ts app/src/food/off-client.test.ts
git commit -m "fetch open food facts directly from the browser"
```

---

## Task 7: FoodPicker component (build to the mockups)

Strong model for structure/state; use the **frontend-design** + **impeccable** skills for the visual build; verify against `docs/mockups/food-picker.{html,png}` with Playwright. Tokens are in the mockup CSS: paper `#FBFAF7`, ink, serif names / sans-caps labels / tabular figures, flat controls, countable-mark meters, no shadows.

**Files:**
- Create: `app/src/features/nutrition/FoodPicker.tsx`, `app/src/features/nutrition/FoodPicker.test.tsx`

**Interfaces:**
- Consumes: `useOnline` (Task 3), `getRecentFoods` / `getCommonFoods` / `searchFoodLocal` / `saveFoodItem` (Task 4), `searchFoodOnline` (Task 6), `macrosForQuantity` (Task 2), `logFood` (existing), `MealSlot` (existing).
- Props: `{ mealSlot: MealSlot; day: Date; onLogged: () => void; onClose: () => void }`.

**Behaviour (screens 2–5):**
- **Empty query:** `Recent` (getRecentFoods) then `Common foods` (getCommonFoods). Each row shows name, `kcal · P g /100g`, and source label (`CoFID` faint-bold / `OFF` faint).
- **Typing, online (debounced ~250ms):** local matches first, then a `Results · Open Food Facts` section from `searchFoodOnline`. Show the italic honesty note `"N results hidden — missing protein or energy. Not shown rather than guessed."` when `hidden > 0`.
- **Typing, offline:** local matches only; if none, render the wifi notice.
- **Offline entirely:** search field dimmed (`opacity .45`) + the notice from screen 4: *"You'll need wifi to search for new foods. Your recent and common foods are still here — and quick-add works without a connection."* Recents + common still render.
- **Any `searchFoodOnline` throw** → render the same wifi notice (do not crash).
- **Selecting a row** → quantity step (screen 5): grams input primary (default `servingGrams ?? 100`), serving-hint chips, live preview via `macrosForQuantity`. "Add to {meal}" is the single filled control; "Quick add instead ›" beneath.
- **Add:** `const item = await saveFoodItem(draft)` for OFF rows (so it caches + becomes a recent), then `logFood({ name, mealSlot, foodItemId: item.id, kcal, proteinG, carbsG, fatG, quantityGrams: grams, quantityLabel: \`${grams} g\` }, loggedAt)`. CoFID rows already have an id — log directly with that `foodItemId`. `loggedAt` = `isToday(day) ? new Date() : noon(day)` (mirror EatDay's quick-add). Then `onLogged()`.
- **Quick-add path:** the existing name/kcal/protein/grams form, log with no `foodItemId` (unchanged behaviour).
- **numbers-hidden** is respected on this surface (no figures where the day view hides them) — show names + source only, as the day view does.

- [ ] **Step 1: Write failing component tests** (jsdom): offline → the wifi notice is present and recents still render; a `hidden > 0` search renders the honesty note; selecting a common food then "Add" calls `logFood` with the right `foodItemId` + macros; source labels render (`CoFID`/`OFF`). Mock the `src/food/*` and `src/db/nutrition` modules.
- [ ] **Step 2: Run tests to verify they fail.**
- [ ] **Step 3: Build `FoodPicker.tsx`** to the mockups using frontend-design + impeccable. Compose the three lists + quantity step as described. Keep it one focused file; extract the quantity step inline if it stays small.
- [ ] **Step 4: Run tests to verify they pass.**
- [ ] **Step 5: Visual check** — render the picker in the running app (Playwright) and compare against `docs/mockups/food-picker.png` for all five states.
- [ ] **Step 6: Commit**

```bash
git add app/src/features/nutrition/FoodPicker.tsx app/src/features/nutrition/FoodPicker.test.tsx
git commit -m "build the food picker: recents, common foods, live search, grams entry"
```

---

## Task 8: Wire the picker into EatDay (keep quick-add as fallback)

**Files:**
- Modify: `app/src/features/nutrition/EatDay.tsx` (the `+ Add food` affordance at L329-336 and the inline quick-add form at L261-327)

- [ ] **Step 1:** Replace the `adding === slot` inline form with a `<FoodPicker mealSlot={slot} day={day} onLogged={() => reload(day)} onClose={() => setAdding(null)} />` render. Keep the existing quick-add markup inside the picker's "Quick add instead" path (it already works; move, do not rewrite).
- [ ] **Step 2:** Keep the existing `EatDay.test.tsx` green (its quick-add test now drives through the picker's quick-add path — update selectors only if needed; do not weaken the assertions).
- [ ] **Step 3: Run** `cd app && npm run typecheck && npm test -- --run src/features/nutrition`.
- [ ] **Step 4: Commit**

```bash
git add app/src/features/nutrition/EatDay.tsx app/src/features/nutrition/EatDay.test.tsx
git commit -m "open the food picker from each meal, keep quick-add as the fallback"
```

---

## Task 9: Settings attribution (make the existing note true)

Delegate-able to `haiku`. Read `app/src/features/settings/Settings.tsx` first (graphify → then read). Find the existing note ("Food data will carry its source and licence per entry once a food database ships") and replace it with a real attribution:

> **Data sources.** Food data from [Open Food Facts](https://world.openfoodfacts.org) (© ODbL) and the [CoFID](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) dataset (© Crown / OGL). Each entry shows its source.

This satisfies both licences' attribution (ODbL for OFF, OGL for CoFID).

- [ ] **Step 1:** Read Settings.tsx, locate the note, update it with the line above. Plain register, no em-dashes.
- [ ] **Step 2:** `cd app && npm run typecheck && npm test -- --run`.
- [ ] **Step 3: Commit**

```bash
git add app/src/features/settings/Settings.tsx
git commit -m "attribute food data to open food facts and cofid"
```

---

## Task 10: e2e — offline gate + offline log survival

Mirror `app/e2e/log-offline.spec.ts`. The online live-search path is unit/contract-tested (Task 1 + Task 6); the e2e proves the offline guarantee.

**Files:**
- Create: `app/e2e/food.spec.ts`

- [ ] **Step 1: Write the spec.** Two cases, mirroring the existing offline harness (build + preview, cut the network via Playwright context):
  1. **Offline search shows the notice, recents/common still work:** open a meal's picker, cut the network, type a query → the wifi notice is visible; a common CoFID food is still tappable and loggable.
  2. **A curated food logged offline survives a reload:** with the network cut, pick a common food, add it; reload the page; assert the entry is still present (read from sqlite via the e2e `window.__db.execSql` hatch used in `persistence.spec.ts`, plus the visible row).
- [ ] **Step 2: Run** `cd app && npx playwright test e2e/food.spec.ts`. (If `window.__db` is undefined, a stale `vite preview` on :4173 is lingering — kill it and re-run, per PROJECT-STATE M5 notes.)
- [ ] **Step 3: Commit**

```bash
git add app/e2e/food.spec.ts
git commit -m "prove the food picker works offline and survives a reload"
```

---

## Final verification (before declaring done — superpowers:verification-before-completion)

- [ ] `cd app && npm run typecheck` — clean.
- [ ] `cd app && npm test -- --run` — all green (the new files + the existing 579).
- [ ] `cd app && npx playwright test` — all green (existing 21 + the new food spec).
- [ ] No guardrail weakened: GR-1 meters still fill toward target; no zero-fill of missing protein; sources visible; offline quick-add + recents + common intact.
- [ ] On `OpenSourceMod` only. `git log origin/main..HEAD` shows the food commits; `main` untouched.
- [ ] Update `docs/PROJECT-STATE.md`: food DB (FR-LOG-6) built, on branch, not merged; note the two honest gaps (v1 seed count ~50; cross-device recents not synced).

---

## Self-review

**1. Spec coverage.** Every design section maps to a task: data model (none needed — Task 4 uses it) ✓; CoFID seed (Task 5) ✓; online access `off.ts` (Tasks 1+6) ✓; local search `local.ts` (Task 4) ✓; connectivity gate (Task 3) ✓; UI picker (Task 7) + grams-primary (Task 7) ✓; EatDay wiring (Task 8) ✓; attribution (Task 9) ✓; honesty guards (filter + source + hidden note: Tasks 1, 7) ✓; testing incl. parser fixtures, macros, local search, barcode dedup, offline e2e (Tasks 1,2,4,5,6,10) ✓. Out-of-scope items (barcode camera scan, Worker self-host, FTS5, USDA) are explicitly deferred.

**2. Placeholder scan.** Task 5's `SEED_FOODS` array is the one place values are not inlined — deliberately, because fabricating numbers would violate the project's core rule; Task 5 Step 1 fetches them verbatim from CoFID. Task 7's full JSX is not inlined — it is a design/build task owned by the frontend-design skill against the mockup; its contract, states, and copy are specified. No other TBDs.

**3. Type consistency.** `FoodItemDraft` fields (`kcalPer100g`, `proteinGPer100g`, …) match the `foodItems` schema camelCase and are reused unchanged by `saveFoodItem`, `parseOffProduct`, and the client. `macrosForQuantity` consumes those same fields. `logFood`'s `FoodEntryInput` (existing) is called with `foodItemId`, `quantityGrams`, `quantityLabel` exactly as the picker computes them. `seedFoods` mirrors `seedExercises`'s `Exec` signature; both are called from `initDb` with `execSql`.

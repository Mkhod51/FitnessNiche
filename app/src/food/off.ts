import type { FoodItemDraft } from './types';

/** 1 kcal = 4.184 kJ. Exact unit conversion, used only when OFF gives kJ only. */
const KJ_PER_KCAL = 4.184;
type Nutriments = Record<string, unknown>;

/** Coerce a crowdsource value to a finite non-negative number, else undefined. */
function num(v: unknown): number | undefined {
  if (typeof v === 'string' && v.trim() === '') return undefined;
  if (typeof v !== 'string' && typeof v !== 'number') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
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
 * Honesty rule (T3): an item missing energy, protein, carbs, or fat is DROPPED,
 * never zero-filled. Energy may come from `energy-kcal_100g` directly or be
 * converted exactly from `energy_100g` (kJ); the macros must be present directly.
 */
export function parseOffProduct(p: unknown): FoodItemDraft | null {
  if (!p || typeof p !== 'object') return null;
  const product = p as Record<string, unknown>;
  const n = (product.nutriments ?? {}) as Nutriments;

  const kcal = energyKcal(n);
  const protein = num(n['proteins_100g']);
  const carbs = num(n['carbohydrates_100g']);
  const fat = num(n['fat_100g']);
  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) return null;

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
    carbsGPer100g: carbs,
    fatGPer100g: fat,
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

const OFF_ORIGIN = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'code,product_name,product_name_en,brands,nutriments';

function foodSearchEndpoint(): string {
  const configured = import.meta.env.VITE_FOOD_SEARCH_URL as string | undefined;
  if (!configured) return '/api/food/search';
  return `${configured.replace(/\/$/, '')}/api/food/search`;
}

/** Live OFF text search. Throws on provider/network failure so the caller can offer a retry. */
export async function searchFoodOnline(q: string): Promise<{ drafts: FoodItemDraft[]; hidden: number }> {
  const res = await fetch(foodSearchEndpoint(), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, pageSize: 20 }),
  });
  if (!res.ok) throw new Error(`OFF search failed (${res.status})`);

  const json = await res.json() as { hits?: unknown[]; products?: unknown[] };
  return parseOffSearch(json.hits ?? json.products ?? []);
}

/** Live OFF barcode lookup, or null when OFF has no matching product. */
export async function lookupBarcode(barcode: string): Promise<FoodItemDraft | null> {
  const url = `${OFF_ORIGIN}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`;
  const res = await fetch(url);
  if (res.status === 404) {
    const json = await res.json() as { result?: { id?: string } };
    if (json.result?.id === 'product_not_found') return null;
  }
  if (!res.ok) throw new Error(`OFF lookup failed (${res.status})`);

  const json = await res.json() as { status?: string | number; product?: unknown };
  return (json.status === 'success' || json.status === 1) && json.product ? parseOffProduct(json.product) : null;
}

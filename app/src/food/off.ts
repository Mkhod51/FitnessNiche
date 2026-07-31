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

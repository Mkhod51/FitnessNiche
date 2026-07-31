// app/src/food/macros.ts
import type { FoodItem } from './types';

export type MacroResult = { kcal: number; proteinG: number; carbsG: number; fatG: number };
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Pure. Macros for an arbitrary gram weight, from a per-100g item. */
export function macrosForQuantity(
  item: Pick<FoodItem, 'kcalPer100g' | 'proteinGPer100g'> & Partial<Pick<FoodItem, 'carbsGPer100g' | 'fatGPer100g'>>,
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

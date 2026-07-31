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

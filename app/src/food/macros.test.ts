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
});

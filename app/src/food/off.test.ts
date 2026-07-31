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

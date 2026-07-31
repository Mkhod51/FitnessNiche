import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupBarcode, searchFoodOnline } from './off';

function mockFetch(payload: unknown, ok = true) {
  globalThis.fetch = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  }) as Response) as typeof fetch;
}

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

describe('searchFoodOnline', () => {
  it('returns parsed drafts and the hidden count', async () => {
    mockFetch({
      count: 3,
      products: [
        { code: '1', product_name: 'Skyr', nutriments: { 'energy-kcal_100g': 62, proteins_100g: 11 } },
        { code: '2', product_name: 'X', nutriments: { proteins_100g: 5 } },
      ],
    });

    const { drafts, hidden } = await searchFoodOnline('skyr');

    expect(drafts).toHaveLength(1);
    expect(hidden).toBe(1);
  });

  it('uses OFF legacy keyword search', async () => {
    mockFetch({ products: [] });

    await searchFoodOnline('skyr & oats');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=skyr+%26+oats&search_simple=1&action=process&json=1&page_size=20&fields=code%2Cproduct_name%2Cproduct_name_en%2Cbrands%2Cnutriments',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('throws on a non-ok response so the caller can show the wifi notice', async () => {
    mockFetch({}, false);

    await expect(searchFoodOnline('x')).rejects.toBeDefined();
  });
});

describe('lookupBarcode', () => {
  it('returns a draft for a found product, null for status 0', async () => {
    mockFetch({
      status: 1,
      product: { code: '1', product_name: 'Skyr', nutriments: { 'energy-kcal_100g': 62, proteins_100g: 11 } },
    });
    expect((await lookupBarcode('1'))?.name).toBe('Skyr');

    mockFetch({ status: 0, product: null });
    expect(await lookupBarcode('nope')).toBeNull();
  });

  it('throws on a non-ok response so the caller can show the wifi notice', async () => {
    mockFetch({}, false);

    await expect(lookupBarcode('1')).rejects.toBeDefined();
  });

  it('uses OFF v3.6 barcode lookup and encodes the barcode', async () => {
    mockFetch({ status: 0, product: null });

    await lookupBarcode('abc/123');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://world.openfoodfacts.org/api/v3.6/product/abc%2F123.json?fields=code,product_name,product_name_en,brands,nutriments',
    );
  });
});

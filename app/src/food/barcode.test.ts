import { describe, expect, it } from 'vitest';
import { isPlausibleBarcode } from './barcode';

describe('isPlausibleBarcode', () => {
  it('accepts the retail barcode lengths the scanner decodes', () => {
    expect(isPlausibleBarcode('12345670')).toBe(true); // EAN-8
    expect(isPlausibleBarcode('012345678905')).toBe(true); // UPC-A
    expect(isPlausibleBarcode('5000159484695')).toBe(true); // EAN-13
    expect(isPlausibleBarcode('12345678901234')).toBe(true); // EAN-14 / GTIN
  });

  it('rejects lengths outside the retail range', () => {
    expect(isPlausibleBarcode('1234567')).toBe(false); // too short
    expect(isPlausibleBarcode('123456789012345')).toBe(false); // too long
    expect(isPlausibleBarcode('')).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(isPlausibleBarcode('1234567abcd')).toBe(false);
    expect(isPlausibleBarcode('12-3456-7890')).toBe(false);
    expect(isPlausibleBarcode(' 12345678 ')).toBe(false); // callers trim before calling
  });
});

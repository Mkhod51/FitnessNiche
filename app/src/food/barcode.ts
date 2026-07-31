/**
 * Plausibility check for a decoded or typed barcode before it is sent to the
 * Open Food Facts product lookup. The range covers the retail formats the
 * scanner decodes and that OFF resolves: EAN-8 (8), UPC-A (12), EAN-13 (13)
 * and EAN-14/GTIN (14). Digits only — callers trim surrounding whitespace and
 * a scanner returns pure digits, so this stays strict rather than forgiving
 * strings OFF would only reject downstream.
 */
export function isPlausibleBarcode(term: string): boolean {
  return /^\d{8,14}$/.test(term);
}

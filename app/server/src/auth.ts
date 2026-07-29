/**
 * Constant-time string compare.
 *
 * `===` short-circuits on the first mismatched byte, so a wrong token that
 * happens to share a long prefix with the real one returns measurably
 * slower than one that doesn't -- enough of a signal for an attacker to
 * recover the token one byte at a time over many requests. This walks every
 * byte regardless of where the first mismatch is.
 *
 * The length check up front does leak the token's length via timing, but
 * that's a fixed, public-ish property (not a secret worth defending), and
 * comparing unequal-length buffers byte-by-byte would need padding logic
 * that buys nothing here.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

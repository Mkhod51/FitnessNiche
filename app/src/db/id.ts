/**
 * A row id, on every origin the app actually runs on.
 *
 * `crypto.randomUUID` is secure-context-only, so it is simply absent when the
 * app is served over a bare LAN IP (`http://192.168.x.x:5173`) — which is
 * exactly how the app gets opened on a phone during development. Calling it
 * there threw, which killed the first write of every session ("start a workout"
 * did nothing) while the desktop, on `localhost`, stayed a secure context and
 * looked fine.
 *
 * `crypto.getRandomValues` carries no such restriction, so the fallback is a
 * real v4 UUID from the same CSPRNG, not a weaker id.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10x
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

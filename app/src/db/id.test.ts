import { describe, it, expect, afterEach } from 'vitest';
import { newId } from './id';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const real = crypto.randomUUID;

afterEach(() => {
  Object.defineProperty(crypto, 'randomUUID', { value: real, configurable: true });
});

describe('newId', () => {
  it('returns a v4 uuid on a secure context', () => {
    expect(newId()).toMatch(V4);
  });

  // The regression this exists for: on an insecure origin (a phone opening the
  // dev server over a LAN IP) randomUUID is simply absent, and every write that
  // mints an id used to throw.
  it('still returns a distinct v4 uuid when randomUUID is unavailable', () => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });

    const ids = new Set(Array.from({ length: 500 }, newId));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(V4);
  });
});

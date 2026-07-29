import { describe, it, expect } from 'vitest';
import { incomingWins, canonicalise, isSyncTable, SYNC_TABLES } from './protocol';

const T = '2026-08-03T10:00:00.000Z';
const LATER = '2026-08-03T10:00:01.000Z';

describe('incomingWins — ordinary last-write-wins', () => {
  it('accepts anything when the row is new to this side', () => {
    expect(incomingWins({ updatedAt: T, data: { a: 1 } }, undefined)).toBe(true);
  });

  it('prefers the later write', () => {
    expect(incomingWins({ updatedAt: LATER, data: { a: 1 } }, { updatedAt: T, data: { a: 2 } })).toBe(true);
    expect(incomingWins({ updatedAt: T, data: { a: 1 } }, { updatedAt: LATER, data: { a: 2 } })).toBe(false);
  });
});

describe('incomingWins — the same-millisecond tie', () => {
  // The regression. This function is only ever called with two versions of the
  // SAME row, so the previous id-based tie-break was `id > id` — always false —
  // and the tie silently resolved to whoever the server heard from first. That
  // is not something both sides can compute, so a client and the server could
  // reach different answers and stay there.
  it('resolves a tie without reference to arrival order', () => {
    const a = { updatedAt: T, data: { weightKg: 100 } };
    const b = { updatedAt: T, data: { weightKg: 102.5 } };

    // Exactly one of the two directions wins, and which one does not depend on
    // which was labelled "incoming".
    const aOverB = incomingWins(a, b);
    const bOverA = incomingWins(b, a);
    expect(aOverB).not.toBe(bOverA);
  });

  it('reaches the same winner from either side, for many different pairs', () => {
    for (let i = 0; i < 50; i++) {
      const a = { updatedAt: T, data: { reps: i, note: `x${i}` } };
      const b = { updatedAt: T, data: { reps: 100 - i, note: `y${100 - i}` } };
      // Whichever content sorts higher wins, consistently in both directions.
      expect(incomingWins(a, b)).toBe(!incomingWins(b, a));
    }
  });

  // Identical content is not a conflict. Reporting it as superseded would send
  // the client off to re-read a row it already has, forever.
  it('treats identical content as no change rather than as a conflict', () => {
    const row = { updatedAt: T, data: { weightKg: 100, reps: 5 } };
    expect(incomingWins(row, { ...row })).toBe(false);
  });
});

describe('canonicalise', () => {
  // Two devices can build the same row with columns in a different order; a
  // key-order-sensitive comparison would call those rows different and hand the
  // tie to whichever happened to serialise "higher".
  it('is insensitive to key order', () => {
    expect(canonicalise({ a: 1, b: 2 })).toBe(canonicalise({ b: 2, a: 1 }));
  });

  it('distinguishes genuinely different content', () => {
    expect(canonicalise({ a: 1 })).not.toBe(canonicalise({ a: 2 }));
  });

  it('handles nested values and nulls without throwing', () => {
    expect(() => canonicalise({ a: [1, { b: null }], c: undefined })).not.toThrow();
    expect(canonicalise(null)).toBe('null');
  });
});

describe('the sync table allowlist', () => {
  // Table names are interpolated into SQL on the server (SQLite has no
  // placeholder for identifiers), so this allowlist is the only thing standing
  // between a request body and the query.
  it('rejects anything not on the list', () => {
    expect(isSyncTable('sets')).toBe(true);
    expect(isSyncTable('exercises')).toBe(false);
    expect(isSyncTable('sync_meta')).toBe(false);
    expect(isSyncTable('sets; drop table sets')).toBe(false);
    expect(isSyncTable('')).toBe(false);
  });

  it('carries the six tables that hold the user, and no reference data', () => {
    expect([...SYNC_TABLES].sort()).toEqual(
      ['advice_events', 'food_log_entries', 'sets', 'users', 'weights', 'workouts'].sort(),
    );
  });
});

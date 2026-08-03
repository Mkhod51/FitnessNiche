// Proves getUser/recordConsent/hasConsented (GR-5/FR-ONB-3: no logging before
// consentedAt is set) against a REAL sqlite engine, the same way
// drizzle-contract.test.ts does — a mocked `getDrizzle()` is the seam that
// lets user.ts (which must use the real client.ts getDrizzle() per the task
// brief) be exercised against an in-memory database instead of a live worker.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { runMigrations, type Exec } from './migrate';
import { makeProxyCallback, type ExecWithChanges } from './client';
import * as schema from './schema';

let testDz: ReturnType<typeof drizzle>;

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  // getUser() opens the store itself before reading, so the boot has to be
  // stubbed too — these tests supply their own in-memory engine below and
  // must not spin up the real worker.
  return { ...actual, getDrizzle: () => testDz, initDb: async () => 'memory-fallback' as const };
});

async function makeTestDb() {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  const exec: ExecWithChanges = async (sql, params = []) => {
    const rows = (db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []) as unknown[][];
    return { rows, changes: db.changes() as number };
  };
  const execRows: Exec = async (sql, params, method) => (await exec(sql, params ?? [], method ?? 'all')).rows;
  await runMigrations(execRows);
  return drizzle(makeProxyCallback(exec), { schema });
}

// Imported after the mock above is set up (vi.mock is hoisted by vitest).
import { getUser, recordConsent, hasConsented, LOCAL_USER_ID, type User } from './user';

const baseUser: User = {
  id: 'someone',
  goal: 'maintain',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: false,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  birthYear: null,
  goalStartedAt: null,
  consentedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('hasConsented (pure predicate)', () => {
  it('is false when consentedAt is null — GR-5: no logging before this is set', () => {
    expect(hasConsented({ ...baseUser, consentedAt: null })).toBe(false);
  });

  it('is true once consentedAt carries a timestamp', () => {
    expect(hasConsented({ ...baseUser, consentedAt: '2026-07-25T14:00:00.000Z' })).toBe(true);
  });
});

describe('getUser / recordConsent against a real db', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('lazily creates the single local user row on first call, unconsented', async () => {
    const user = await getUser();
    expect(user.id).toBe(LOCAL_USER_ID);
    expect(user.consentedAt).toBeNull();
  });

  it('does not create a second row on a later call — same fixed id, one row', async () => {
    const first = await getUser();
    const second = await getUser();
    expect(second).toEqual(first);

    const all = await testDz.select().from(schema.users);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(LOCAL_USER_ID);
  });

  it('recordConsent stamps consentedAt with the current time and it round-trips as non-null', async () => {
    const before = Date.now();
    const consented = await recordConsent();
    const after = Date.now();

    expect(consented.consentedAt).not.toBeNull();
    expect(hasConsented(consented)).toBe(true);
    const stamped = new Date(consented.consentedAt as string).getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);
  });

  it('consent persists across reload — a brand-new getUser() read after recordConsent still sees it', async () => {
    const consented = await recordConsent();

    // Simulate "reload": nothing in-process is reused except the db itself.
    const reloaded = await getUser();
    expect(hasConsented(reloaded)).toBe(true);
    expect(reloaded.consentedAt).toBe(consented.consentedAt);
  });

  it('recordConsent works even when getUser() was never called first (lazy creation covers it too)', async () => {
    const all = await testDz.select().from(schema.users);
    expect(all).toHaveLength(0);

    const consented = await recordConsent();
    expect(consented.id).toBe(LOCAL_USER_ID);
    expect(hasConsented(consented)).toBe(true);

    const rows = await testDz.select().from(schema.users);
    expect(rows).toHaveLength(1);
  });
});

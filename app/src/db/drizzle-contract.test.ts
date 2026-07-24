// Proves out the drizzle-orm/sqlite-proxy contract against a REAL sqlite
// engine (sqlite-wasm, in-memory) rather than trusting the adapter shape by
// inspection. The worker (Task 2) always executes with rowMode: 'array' and
// returnValue: 'resultRows' regardless of the `method` argument it's given,
// so this test's `exec` deliberately reproduces that — same as the real
// worker — to see whether the client-side adapter compensates correctly.
import { describe, it, expect, beforeAll } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
import { runMigrations, type Exec } from './migrate';
import { makeProxyCallback } from './client';
import * as schema from './schema';

async function makeRealExec(): Promise<Exec> {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  // Mirrors sqlite.worker.ts exactly: `method` is accepted but ignored.
  return async (sql, params = [], _method) => {
    const rows = db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' });
    return (rows ?? []) as unknown[][];
  };
}

describe('drizzle-orm/sqlite-proxy contract against a real sqlite engine', () => {
  let exec: Exec;

  beforeAll(async () => {
    exec = await makeRealExec();
    await runMigrations(exec);
  });

  it('rejects the brief-literal adapter (rows[0] ?? []) — .get() with no match must be undefined, not a blank row', async () => {
    const buggyDz = drizzle(async (sql, params, method) => {
      const rows = await exec(sql, params, method);
      return { rows: method === 'get' ? (rows[0] ?? []) : rows };
    }, { schema });

    const missing = await buggyDz.select().from(schema.users).where(eq(schema.users.id, 'nobody')).get();
    // This is the bug: `rows[0] ?? []` turns "no row" into `[]`, which is
    // truthy, so sqlite-proxy's `mapGetResult` skips its `!row` early return
    // and maps an all-undefined-fields object instead of returning undefined.
    expect(missing).not.toBeUndefined();
  });

  it('the corrected adapter (rows[0], no fallback) round-trips select/insert/get correctly', async () => {
    // Build this from the actual shipped adapter, not a hand-copied
    // duplicate — that's the only way reverting client.ts's proxy callback
    // to the buggy `rows[0] ?? []` would ever fail this suite.
    const dz = drizzle(makeProxyCallback(exec), { schema });

    await dz.insert(schema.users).values({ id: 'u1', updatedAt: '2026-01-01T00:00:00.000Z' }).run();

    const all = await dz.select().from(schema.users);
    expect(all).toEqual([
      {
        id: 'u1',
        goal: 'maintain',
        sex: 'unspecified',
        heightCm: null,
        numbersHidden: false,
        consentedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const found = await dz.select().from(schema.users).where(eq(schema.users.id, 'u1')).get();
    expect(found).toEqual(all[0]);

    const missing = await dz.select().from(schema.users).where(eq(schema.users.id, 'nobody')).get();
    expect(missing).toBeUndefined();
  });
});

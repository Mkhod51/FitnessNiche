// Same real-sqlite harness as workouts.test.ts: a mocked getDrizzle() backed
// by an in-memory sqlite-wasm database, migrated with the real runner.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
import { runMigrations, type Exec } from './migrate';
import { makeProxyCallback, type ExecWithChanges } from './client';
import * as schema from './schema';

let testDz: ReturnType<typeof drizzle>;

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, getDrizzle: () => testDz };
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
import { logWeight, getWeightHistory } from './weights';
import { LOCAL_USER_ID } from './user';

describe('logWeight — writes straight to sqlite, same as logSet', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('writes a reading owned by the local user that a fresh read still sees', async () => {
    const created = await logWeight(82.4, new Date('2026-07-25T10:00:00.000Z'));
    expect(created.userId).toBe(LOCAL_USER_ID);
    expect(created.valueKg).toBe(82.4);
    expect(created.deletedAt).toBeNull();

    const reread = await testDz.select().from(schema.weights);
    expect(reread).toHaveLength(1);
    expect(reread[0].id).toBe(created.id);
  });
});

describe('getWeightHistory — ascending by measuredAt, soft-deletes excluded', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('returns an empty array when nothing has been logged', async () => {
    expect(await getWeightHistory()).toEqual([]);
  });

  it('returns readings oldest first', async () => {
    await logWeight(80, new Date('2026-07-20T08:00:00.000Z'));
    await logWeight(81, new Date('2026-07-10T08:00:00.000Z'));
    await logWeight(82, new Date('2026-07-25T08:00:00.000Z'));

    const history = await getWeightHistory();
    expect(history.map((w) => w.valueKg)).toEqual([81, 80, 82]);
  });

  it('excludes soft-deleted readings', async () => {
    const created = await logWeight(80, new Date('2026-07-20T08:00:00.000Z'));
    await testDz
      .update(schema.weights)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(schema.weights.id, created.id))
      .run();

    expect(await getWeightHistory()).toEqual([]);
  });
});

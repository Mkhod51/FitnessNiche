// Same real-sqlite harness as src/db/*.test.ts: a mocked getDrizzle() backed
// by an in-memory sqlite-wasm database, migrated with the real runner.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq } from 'drizzle-orm';
import { runMigrations, type Exec } from '../db/migrate';
import { makeProxyCallback, type ExecWithChanges } from '../db/client';
import * as schema from '../db/schema';

let testDz: ReturnType<typeof drizzle>;

vi.mock('../db/client', async () => {
  const actual = await vi.importActual<typeof import('../db/client')>('../db/client');
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
import { markPending, clearPending, pendingRows, getWatermark, setWatermark } from './queue';
import { LOCAL_USER_ID } from '../db/user';

async function insertWorkout(id: string, updatedAt: string, deletedAt: string | null = null) {
  await testDz
    .insert(schema.workouts)
    .values({ id, userId: LOCAL_USER_ID, startedAt: updatedAt, updatedAt, deletedAt })
    .run();
}

describe('markPending — idempotent so a constantly-edited row never starves', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('records a fresh pending entry on first call', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));

    const meta = await testDz
      .select()
      .from(schema.syncMeta)
      .where(eq(schema.syncMeta.rowId, 'w1'))
      .get();
    expect(meta?.pendingSince).toBe('2026-07-25T10:00:00.000Z');
  });

  it('does not reset pendingSince on a row already queued', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));
    await markPending('workouts', 'w1', new Date('2026-07-25T11:00:00.000Z')); // edited again an hour later
    await markPending('workouts', 'w1', new Date('2026-07-25T12:00:00.000Z')); // and again

    const meta = await testDz
      .select()
      .from(schema.syncMeta)
      .where(eq(schema.syncMeta.rowId, 'w1'))
      .get();
    expect(meta?.pendingSince, 'the original queue time must survive repeated edits').toBe('2026-07-25T10:00:00.000Z');
  });

  it('starts a new pendingSince once a row has been cleared and is edited again', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));
    await clearPending('workouts', 'w1', new Date('2026-07-25T10:05:00.000Z'));

    await markPending('workouts', 'w1', new Date('2026-07-26T09:00:00.000Z'));

    const meta = await testDz
      .select()
      .from(schema.syncMeta)
      .where(eq(schema.syncMeta.rowId, 'w1'))
      .get();
    expect(meta?.pendingSince).toBe('2026-07-26T09:00:00.000Z');
  });
});

describe('clearPending', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('clears the pending flag and stamps lastPushedAt', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));

    await clearPending('workouts', 'w1', new Date('2026-07-25T12:00:00.000Z'));

    const meta = await testDz
      .select()
      .from(schema.syncMeta)
      .where(eq(schema.syncMeta.rowId, 'w1'))
      .get();
    expect(meta?.pendingSince).toBeNull();
    expect(meta?.lastPushedAt).toBe('2026-07-25T12:00:00.000Z');
  });
});

describe('pendingRows — joins the queue back to the real tables', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('returns an empty array when nothing is queued', async () => {
    expect(await pendingRows()).toEqual([]);
  });

  it('returns a full SyncRow for a queued workout', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));

    const rows = await pendingRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ table: 'workouts', id: 'w1', updatedAt: '2026-07-25T10:00:00.000Z', deletedAt: null });
    expect(rows[0].data).toMatchObject({ id: 'w1', userId: LOCAL_USER_ID });
  });

  it('carries the real deletedAt for a soft-deleted row', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z', '2026-07-25T11:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T11:00:00.000Z'));

    const [row] = await pendingRows();
    expect(row.deletedAt).toBe('2026-07-25T11:00:00.000Z');
  });

  it('forces deletedAt to null for users, which has no such column', async () => {
    await markPending('users', LOCAL_USER_ID, new Date('2026-07-25T10:00:00.000Z'));
    await testDz.insert(schema.users).values({ id: LOCAL_USER_ID, updatedAt: '2026-07-25T10:00:00.000Z' }).run();

    const [row] = await pendingRows();
    expect(row.table).toBe('users');
    expect(row.deletedAt).toBeNull();
  });

  // Adversarial: a row was queued, then hard-deleted by something other than
  // the normal soft-delete path. It must not be pushed (nothing to push), and
  // the stale queue entry must not be checked forever.
  it('skips a queued row that no longer exists, and clears the stale entry', async () => {
    await insertWorkout('w1', '2026-07-25T10:00:00.000Z');
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));
    await testDz.delete(schema.workouts).where(eq(schema.workouts.id, 'w1')).run();

    expect(await pendingRows()).toEqual([]);

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince, 'the stale entry must be cleared, not left to be re-checked forever').toBeNull();
  });

  it('never returns the watermark bookkeeping row as a pending row', async () => {
    await setWatermark(80);
    expect(await pendingRows()).toEqual([]);
  });
});

describe('watermark — the SERVER clock, never the device clock', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('is null before the first sync', async () => {
    expect(await getWatermark()).toBeNull();
  });

  it('round-trips through set/get as a number', async () => {
    await setWatermark(80);
    expect(await getWatermark()).toBe(80);
  });

  it('overwrites rather than accumulating', async () => {
    await setWatermark(80);
    await setWatermark(206);
    expect(await getWatermark()).toBe(206);
  });

  // A watermark left behind by the old timestamp scheme is not a number. Rather
  // than resuming from a value the server can no longer interpret, it reads as
  // null and the next sync re-pulls everything once. The merge is idempotent,
  // so that costs bandwidth and nothing else — and resuming from a stale
  // timestamp would silently skip rows instead.
  it('treats a legacy timestamp watermark as no watermark at all', async () => {
    const { syncMeta } = await import('../db/schema');
    await testDz
      .insert(syncMeta)
      .values({ tableName: '__sync__', rowId: 'watermark', pendingSince: null, lastPushedAt: '2026-07-25T09:00:00.000Z' })
      .run();
    expect(await getWatermark()).toBeNull();
  });
});

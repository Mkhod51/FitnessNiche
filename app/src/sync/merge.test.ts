// Same real-sqlite harness as src/db/*.test.ts and queue.test.ts.
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
import { applyIncoming } from './merge';
import { markPending } from './queue';
import { LOCAL_USER_ID } from '../db/user';
import type { SyncRow } from './protocol';

describe('applyIncoming — last-write-wins via protocol.incomingWins, UPSERT semantics', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('inserts a row that does not exist locally yet', async () => {
    const incoming: SyncRow = {
      table: 'workouts',
      id: 'w1',
      updatedAt: '2026-07-25T10:00:00.000Z',
      deletedAt: null,
      data: { id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'Push day', finishedAt: null, updatedAt: '2026-07-25T10:00:00.000Z', deletedAt: null },
    };

    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, 'w1')).get();
    expect(row).toMatchObject({ id: 'w1', name: 'Push day' });
  });

  it('updates a local row when the incoming row is newer', async () => {
    await testDz.insert(schema.workouts).values({
      id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-20T10:00:00.000Z', name: 'old name', updatedAt: '2026-07-20T10:00:00.000Z',
    }).run();

    const incoming: SyncRow = {
      table: 'workouts',
      id: 'w1',
      updatedAt: '2026-07-25T10:00:00.000Z',
      deletedAt: null,
      data: { id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-20T10:00:00.000Z', name: 'new name', finishedAt: null, updatedAt: '2026-07-25T10:00:00.000Z', deletedAt: null },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, 'w1')).get();
    expect(row?.name).toBe('new name');
  });

  // Adversarial: the incoming row is stale relative to what's already stored.
  it('does NOT overwrite a local row that is newer than the incoming one', async () => {
    await testDz.insert(schema.workouts).values({
      id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'local newer', updatedAt: '2026-07-25T12:00:00.000Z',
    }).run();

    const incoming: SyncRow = {
      table: 'workouts',
      id: 'w1',
      updatedAt: '2026-07-25T09:00:00.000Z', // older than the local row
      deletedAt: null,
      data: { id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T09:00:00.000Z', name: 'stale incoming', finishedAt: null, updatedAt: '2026-07-25T09:00:00.000Z', deletedAt: null },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, 'w1')).get();
    expect(row?.name, 'the newer local write must survive an older incoming row').toBe('local newer');
  });

  // CRITICAL (NFR-1): a local row can be edited again — and re-queued — while
  // its own earlier push is in flight. A pull landing right after must not
  // clobber that fresh edit just because it looks newer than whatever was
  // pushed. applyIncoming re-reads the row live rather than trusting a
  // pre-push snapshot, so this must hold regardless of the pending flag.
  it('does not clobber a local row that is still pending push and is newer than the incoming row', async () => {
    await testDz.insert(schema.workouts).values({
      id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'edited during the round trip', updatedAt: '2026-07-25T12:00:00.000Z',
    }).run();
    // queued from an earlier moment — this row is actively pending push right now
    await markPending('workouts', 'w1', new Date('2026-07-25T10:00:00.000Z'));

    const incoming: SyncRow = {
      table: 'workouts',
      id: 'w1',
      updatedAt: '2026-07-25T11:00:00.000Z', // newer than the push snapshot, but older than the live row
      deletedAt: null,
      data: { id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'from another device', finishedAt: null, updatedAt: '2026-07-25T11:00:00.000Z', deletedAt: null },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, 'w1')).get();
    expect(row?.name, 'the still-pending, newer local edit must not be lost').toBe('edited during the round trip');

    // merge.ts must not have touched the queue bookkeeping either
    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince).toBe('2026-07-25T10:00:00.000Z');
  });

  it('applies a soft-deleted incoming row as a deletion', async () => {
    await testDz.insert(schema.workouts).values({
      id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'to be deleted', updatedAt: '2026-07-25T10:00:00.000Z',
    }).run();

    const incoming: SyncRow = {
      table: 'workouts',
      id: 'w1',
      updatedAt: '2026-07-25T11:00:00.000Z',
      deletedAt: '2026-07-25T11:00:00.000Z',
      data: { id: 'w1', userId: LOCAL_USER_ID, startedAt: '2026-07-25T10:00:00.000Z', name: 'to be deleted', finishedAt: null, updatedAt: '2026-07-25T11:00:00.000Z', deletedAt: '2026-07-25T11:00:00.000Z' },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.workouts).where(eq(schema.workouts.id, 'w1')).get();
    expect(row?.deletedAt).toBe('2026-07-25T11:00:00.000Z');
  });

  it('inserts a brand-new tombstone (deleted on another device before this one ever saw it)', async () => {
    const incoming: SyncRow = {
      table: 'weights',
      id: 'wt1',
      updatedAt: '2026-07-25T11:00:00.000Z',
      deletedAt: '2026-07-25T11:00:00.000Z',
      data: { id: 'wt1', userId: LOCAL_USER_ID, valueKg: 80, measuredAt: '2026-07-25T10:00:00.000Z', updatedAt: '2026-07-25T11:00:00.000Z', deletedAt: '2026-07-25T11:00:00.000Z' },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.weights).where(eq(schema.weights.id, 'wt1')).get();
    expect(row?.deletedAt).toBe('2026-07-25T11:00:00.000Z');
  });

  it('handles users, which has no deletedAt column, without error', async () => {
    const incoming: SyncRow = {
      table: 'users',
      id: LOCAL_USER_ID,
      updatedAt: '2026-07-25T11:00:00.000Z',
      deletedAt: null,
      data: { id: LOCAL_USER_ID, goal: 'cut', sex: 'unspecified', numbersHidden: false, deficitKcal: 0, updatedAt: '2026-07-25T11:00:00.000Z' },
    };
    await applyIncoming([incoming]);

    const row = await testDz.select().from(schema.users).where(eq(schema.users.id, LOCAL_USER_ID)).get();
    expect(row?.goal).toBe('cut');
  });
});

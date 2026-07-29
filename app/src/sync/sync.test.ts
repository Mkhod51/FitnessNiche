// Same real-sqlite harness as queue.test.ts/merge.test.ts, plus a mocked
// fetch and stubbed Vite env vars for the network half of this module.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
import { syncNow, startAutoSync } from './sync';
import { markPending, getWatermark } from './queue';
import { LOCAL_USER_ID } from '../db/user';
import { SYNC_PATH, type PushPullResponse } from './protocol';

const SYNC_URL = 'https://sync.example.workers.dev';
const SYNC_TOKEN = 'test-token';

function configureSync() {
  vi.stubEnv('VITE_SYNC_URL', SYNC_URL);
  vi.stubEnv('VITE_SYNC_TOKEN', SYNC_TOKEN);
}

function jsonResponse(body: PushPullResponse) {
  return { ok: true, status: 200, statusText: 'OK', json: async () => body };
}

async function insertPendingWorkout(id: string, now: string) {
  await testDz.insert(schema.workouts).values({ id, userId: LOCAL_USER_ID, startedAt: now, updatedAt: now }).run();
  await markPending('workouts', id, new Date(now));
}

let cleanupAutoSync: (() => void) | undefined;

beforeEach(async () => {
  testDz = await makeTestDb();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanupAutoSync?.();
  cleanupAutoSync = undefined;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('unconfigured sync — inert by default (no server configured is the normal state)', () => {
  it('syncNow reports not configured and never touches the network', async () => {
    const result = await syncNow();
    expect(result).toEqual({ configured: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('startAutoSync attaches nothing, and its cleanup is harmless', async () => {
    cleanupAutoSync = startAutoSync();
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();

    expect(fetch).not.toHaveBeenCalled();
    expect(() => cleanupAutoSync?.()).not.toThrow();
  });
});

describe('syncNow — happy path', () => {
  beforeEach(() => configureSync());

  it('pushes pending rows, applies the pull, and clears the queue', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ serverSeq: 1, changes: [], superseded: [] }) as unknown as Response,
    );

    const result = await syncNow(new Date('2026-07-25T10:05:00.000Z'));
    expect(result).toEqual({ configured: true, pushed: 1, pulled: 0, superseded: 0 });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${SYNC_URL}${SYNC_PATH}`);
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${SYNC_TOKEN}`);

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince).toBeNull();
    expect(await getWatermark()).toBe(1);
  });

  it('re-marks a superseded row as pending instead of dropping it', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');
    await insertPendingWorkout('w2', '2026-07-25T10:00:00.000Z');

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        serverSeq: 1,
        changes: [],
        superseded: [{ table: 'workouts', id: 'w1' }],
      }) as unknown as Response,
    );

    await syncNow(new Date('2026-07-25T10:05:00.000Z'));

    const w1 = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    const w2 = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w2')).get();
    expect(w1?.pendingSince, 'the superseded row must still be queued, not lost').not.toBeNull();
    expect(w2?.pendingSince, 'the accepted row must be cleared').toBeNull();
  });
});

// Adversarial: NFR-1. A failed push/pull must leave every queued row exactly
// as pending as before — a thrown error is the only acceptable outcome, never
// a queue silently cleared against a request that never landed.
describe('syncNow — network failure leaves the queue intact', () => {
  beforeEach(() => configureSync());

  it('a rejected fetch throws and does not touch the queue', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    await expect(syncNow()).rejects.toThrow('network down');

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince, 'still pending — nothing was pushed').toBe('2026-07-25T10:00:00.000Z');
    expect(await getWatermark()).toBeNull();
  });

  it('a non-ok response throws and does not touch the queue', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' } as unknown as Response);

    await expect(syncNow()).rejects.toThrow(/500/);

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince).toBe('2026-07-25T10:00:00.000Z');
  });

  it('an { error } body throws and does not touch the queue', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, statusText: 'OK', json: async () => ({ error: 'bad token' }) } as unknown as Response);

    await expect(syncNow()).rejects.toThrow('bad token');

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince).toBe('2026-07-25T10:00:00.000Z');
  });
});

describe('syncNow — concurrent calls do not double-push', () => {
  beforeEach(() => configureSync());

  it('a second call while one is in flight shares the same attempt', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');

    let resolveFetch: (v: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.mocked(fetch).mockReturnValue(pending as Promise<Response>);

    const first = syncNow();
    const second = syncNow(); // fired before the first has resolved

    resolveFetch(jsonResponse({ serverSeq: 1, changes: [], superseded: [] }));

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });

  it('a call after the first has settled starts a genuinely new attempt', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z');
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ serverSeq: 1, changes: [], superseded: [] }) as unknown as Response,
    );

    await syncNow();
    await syncNow();

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

// Adversarial: the write survives a full offline stretch and reaches the
// server the moment connectivity returns, without any timer polling for it.
describe('startAutoSync — drains the queue on reconnect', () => {
  beforeEach(() => configureSync());

  it('a write made while offline pushes as soon as the online event fires', async () => {
    await insertPendingWorkout('w1', '2026-07-25T10:00:00.000Z'); // the "offline write"
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ serverSeq: 1, changes: [], superseded: [] }) as unknown as Response,
    );

    cleanupAutoSync = startAutoSync();
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const meta = await testDz.select().from(schema.syncMeta).where(eq(schema.syncMeta.rowId, 'w1')).get();
    expect(meta?.pendingSince).toBeNull();
  });

  it('the cleanup function stops it from reacting to further reconnects', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ serverSeq: 1, changes: [], superseded: [] }) as unknown as Response,
    );

    const cleanup = startAutoSync();
    cleanup();
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();

    expect(fetch).not.toHaveBeenCalled();
  });
});

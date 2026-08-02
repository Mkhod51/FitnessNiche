import { afterEach, describe, expect, it, vi } from 'vitest';
import app from './index';
import type { D1Database, D1PreparedStatement } from './d1';
import { incomingWins, type PushPullResponse, type SyncErrorResponse, type SyncRow } from '../../src/sync/protocol';

const TOKEN = 'test-secret-token';
const realFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = realFetch;
});

/**
 * In-memory stand-in for the D1 binding.
 *
 * Not a SQL engine -- it pattern-matches the handful of query shapes
 * sync.ts actually issues (select by id, select-since, upsert) rather than
 * parsing SQL generally. That's fine: this fake exists to test our own
 * merge logic, not to be a second SQLite implementation, and the query
 * shapes are pinned in sync.ts right next to it.
 */
interface FakeRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
  data: string;
  server_seq: number;
}

function createFakeD1(): D1Database {
  const tables = new Map<string, Map<string, FakeRow>>();
  const foodSearchLimits = new Map<string, { client_id: string; window_start: number; count: number }>();
  // Stands in for the single-row sync_state table that owns the sequence.
  let seq = 0;

  function tableRows(name: string) {
    let t = tables.get(name);
    if (!t) {
      t = new Map();
      tables.set(name, t);
    }
    return t;
  }

  function run(sql: string, params: unknown[]) {
    if (/sync_state/i.test(sql)) {
      if (/^\s*UPDATE/i.test(sql)) {
        seq = params[0] as number;
        return [];
      }
      return [{ seq }];
    }

    if (/food_search_limits/i.test(sql)) {
      if (/^\s*SELECT/i.test(sql)) {
        const [clientId] = params as [string];
        const row = foodSearchLimits.get(clientId);
        return row ? [row] : [];
      }
      if (/^\s*INSERT/i.test(sql)) {
        const [clientId, windowStart] = params as [string, number];
        if (!foodSearchLimits.has(clientId)) {
          foodSearchLimits.set(clientId, { client_id: clientId, window_start: windowStart, count: 0 });
        }
        return [];
      }
      if (/^\s*UPDATE/i.test(sql)) {
        if (/RETURNING count/i.test(sql)) {
          const [clientId, windowStart, limit] = params as [string, number, number];
          const row = foodSearchLimits.get(clientId);
          if (row && row.window_start === windowStart && row.count < limit) {
            row.count += 1;
            return [row];
          }
          return [];
        }
        const [windowStart, clientId] = params as [number, string, number];
        const row = foodSearchLimits.get(clientId);
        if (row && row.window_start !== windowStart) {
          row.window_start = windowStart;
          row.count = 0;
        }
        return [];
      }
    }

    const table = /(?:FROM|INTO)\s+(\w+)/i.exec(sql)?.[1];
    if (!table) throw new Error(`fake D1 could not find a table name in: ${sql}`);
    const rows = tableRows(table);

    if (/^\s*INSERT/i.test(sql)) {
      const [id, updatedAt, deletedAt, data, serverSeq] = params as [string, string, string | null, string, number];
      rows.set(id, { id, updated_at: updatedAt, deleted_at: deletedAt, data, server_seq: serverSeq });
      return [];
    }
    if (/WHERE id = \?/i.test(sql)) {
      const [id] = params as [string];
      const row = rows.get(id);
      return row ? [row] : [];
    }
    if (/server_seq > \?/i.test(sql)) {
      const [since] = params as [number];
      return [...rows.values()].filter((r) => r.server_seq > since);
    }
    return [...rows.values()];
  }

  function prepare(sql: string): D1PreparedStatement {
    let bound: unknown[] = [];
    const stmt: D1PreparedStatement = {
      bind(...values) {
        bound = values;
        return stmt;
      },
      async first() {
        const rows = run(sql, bound);
        return (rows[0] ?? null) as never;
      },
      async all() {
        return { results: run(sql, bound) as never[] };
      },
      async run() {
        run(sql, bound);
        return {};
      },
    };
    return stmt;
  }

  return {
    prepare,
    async batch(statements) {
      const results = [];
      for (const s of statements) results.push(await s.run());
      return results;
    },
  };
}

function env(overrides: Partial<{ FOOD_SEARCH_ALLOWED_ORIGINS: string }> = {}) {
  return { DB: createFakeD1(), SYNC_TOKEN: TOKEN, ...overrides };
}

async function sync(body: unknown, token: string | undefined, testEnv: ReturnType<typeof env>) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  const init: RequestInit = { method: 'POST', headers };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return app.request('/sync', init, testEnv);
}

async function foodSearch(
  body: unknown = { q: 'granola', pageSize: 99 },
  headers: Record<string, string> = {},
  testEnv: ReturnType<typeof env> = env(),
) {
  return app.request(
    '/api/food/search',
    { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) },
    testEnv,
  );
}

function row(overrides: Partial<SyncRow> = {}): SyncRow {
  return {
    table: 'weights',
    id: 'w1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    data: { valueKg: 80 },
    ...overrides,
  };
}

describe('POST /sync auth', () => {
  it('401s when the Authorization header is missing', async () => {
    const res = await sync({ since: null, changes: [] }, undefined, env());
    expect(res.status).toBe(401);
    const body = (await res.json()) as SyncErrorResponse;
    expect(body.error).toBeTruthy();
  });

  it('401s on a wrong token', async () => {
    const res = await sync({ since: null, changes: [] }, 'not-the-token', env());
    expect(res.status).toBe(401);
  });
});

describe('POST /api/food/search', () => {
  it('proxies keyword searches through Search-a-licious without putting the query in the URL', async () => {
    globalThis.fetch = vi.fn(async () => new Response(
      JSON.stringify({ hits: [{ code: '1', product_name: 'Granola' }] }),
      { headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

    const testEnv = env({ FOOD_SEARCH_ALLOWED_ORIGINS: 'https://app.example' });
    const res = await foodSearch({ q: 'granola', pageSize: 3 }, { Origin: 'https://app.example' }, testEnv);
    const body = (await res.json()) as { hits: unknown[] };

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example');
    expect(body.hits).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://search.openfoodfacts.org/search',
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'granola',
          page_size: 3,
          fields: ['code', 'product_name', 'product_name_en', 'brands', 'nutriments'],
        }),
      },
    );
  });

  it('returns an empty search payload without calling OFF for blank queries', async () => {
    globalThis.fetch = vi.fn() as typeof fetch;

    const res = await foodSearch({ q: '  ' });
    const body = (await res.json()) as { hits: unknown[] };

    expect(res.status).toBe(200);
    expect(body.hits).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('caps page size and reports provider failures as a bad gateway', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 503 })) as typeof fetch;

    const res = await foodSearch();
    const body = (await res.json()) as { error?: string };

    expect(res.status).toBe(502);
    expect(body.error).toBe('food search failed');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://search.openfoodfacts.org/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          q: 'granola',
          page_size: 20,
          fields: ['code', 'product_name', 'product_name_en', 'brands', 'nutriments'],
        }),
      }),
    );
  });

  it('answers CORS preflight for configured static app origins', async () => {
    const res = await app.request(
      '/api/food/search',
      { method: 'OPTIONS', headers: { Origin: 'https://app.example' } },
      env({ FOOD_SEARCH_ALLOWED_ORIGINS: 'https://app.example' }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('blocks unconfigured browser origins before forwarding upstream', async () => {
    globalThis.fetch = vi.fn() as typeof fetch;

    const res = await foodSearch({ q: 'granola' }, { Origin: 'https://random.example' });
    const body = (await res.json()) as { error?: string };

    expect(res.status).toBe(403);
    expect(body.error).toBe('origin not allowed');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed search request bodies', async () => {
    const res = await app.request(
      '/api/food/search',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{nope' },
      env(),
    );

    expect(res.status).toBe(400);
  });

  it('rate limits repeated searches from one client before forwarding upstream', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ hits: [] }))) as typeof fetch;
    const testEnv = env();

    for (let i = 0; i < 10; i += 1) {
      expect((await foodSearch({ q: `granola ${i}` }, { 'CF-Connecting-IP': '203.0.113.10' }, testEnv)).status).toBe(200);
    }
    const limited = await foodSearch({ q: 'granola again' }, { 'CF-Connecting-IP': '203.0.113.10' }, testEnv);

    expect(limited.status).toBe(429);
    expect(globalThis.fetch).toHaveBeenCalledTimes(10);
  });
});

describe('POST /sync body validation', () => {
  it('400s on invalid JSON', async () => {
    const res = await sync('{not json', TOKEN, env());
    expect(res.status).toBe(400);
  });

  it('400s when changes is missing', async () => {
    const res = await sync({ since: null }, TOKEN, env());
    expect(res.status).toBe(400);
  });

  it('400s when a change row has an unknown table', async () => {
    const res = await sync({ since: null, changes: [row({ table: 'not_a_table' as never })] }, TOKEN, env());
    expect(res.status).toBe(400);
  });

  it('400s when a change row is missing updatedAt', async () => {
    const bad = { table: 'weights', id: 'w1', deletedAt: null, data: {} };
    const res = await sync({ since: null, changes: [bad] }, TOKEN, env());
    expect(res.status).toBe(400);
  });
});

describe('push then pull', () => {
  it('stores a new row and returns it on a later pull', async () => {
    const e = env();
    const pushed = row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z' });
    const pushRes = await sync({ since: null, changes: [pushed] }, TOKEN, e);
    expect(pushRes.status).toBe(200);

    const pullRes = await sync({ since: 0, changes: [] }, TOKEN, e);
    const pullBody = (await pullRes.json()) as PushPullResponse;
    expect(pullBody.changes).toHaveLength(1);
    expect(pullBody.changes[0]).toMatchObject({ id: 'w1', data: { valueKg: 80 } });
  });

  it('does not hand back the exact row a client just pushed', async () => {
    const e = env();
    const pushed = row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z' });
    const res = await sync({ since: null, changes: [pushed] }, TOKEN, e);
    const body = (await res.json()) as PushPullResponse;
    expect(body.changes.find((r) => r.id === 'w1')).toBeUndefined();
  });

  // The watermark is a server-owned SEQUENCE, not a clock. It used to be a
  // timestamp, which quietly lost rows: `updated_at` is written by the device
  // that made the change, so filtering a pull by a server clock compares two
  // clocks that were never synchronised, and a phone running slow has its rows
  // skipped entirely.
  it('advances the sequence on a write and leaves it alone on an empty pull', async () => {
    const e = env();

    const first = (await (await sync({ since: null, changes: [row({ id: 'w1' })] }, TOKEN, e)).json()) as PushPullResponse;
    expect(typeof first.serverSeq).toBe('number');
    expect(first.serverSeq).toBeGreaterThan(0);

    const idle = (await (await sync({ since: first.serverSeq, changes: [] }, TOKEN, e)).json()) as PushPullResponse;
    expect(idle.serverSeq).toBe(first.serverSeq);
    expect(idle.changes).toHaveLength(0);

    const second = (await (await sync({ since: idle.serverSeq, changes: [row({ id: 'w2' })] }, TOKEN, e)).json()) as PushPullResponse;
    expect(second.serverSeq).toBeGreaterThan(first.serverSeq);
  });

  // The pull is filtered on the sequence, so a row whose updated_at is far in
  // the past — a device with a slow clock, or an imported history — still
  // reaches the other device. Under the old timestamp watermark this row was
  // invisible forever.
  it('delivers a row stamped long in the past, because the pull does not use clocks', async () => {
    const e = env();
    const recent = (await (await sync(
      { since: null, changes: [row({ id: 'recent', updatedAt: '2026-06-01T00:00:00.000Z' })] },
      TOKEN,
      e,
    )).json()) as PushPullResponse;

    // A second device pushes a row it wrote while its clock was badly behind.
    await sync({ since: null, changes: [row({ id: 'stale-clock', updatedAt: '2019-01-01T00:00:00.000Z' })] }, TOKEN, e);

    const pull = (await (await sync({ since: recent.serverSeq, changes: [] }, TOKEN, e)).json()) as PushPullResponse;
    expect(pull.changes.map((r) => r.id)).toContain('stale-clock');
  });
});

describe('last-write-wins merge', () => {
  it('rejects an older incoming row and reports it in superseded', async () => {
    const e = env();
    await sync({ since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-05T00:00:00.000Z', data: { valueKg: 90 } })] }, TOKEN, e);

    const staleRes = await sync(
      { since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z', data: { valueKg: 999 } })] },
      TOKEN,
      e,
    );
    const staleBody = (await staleRes.json()) as PushPullResponse;
    expect(staleBody.superseded).toEqual([{ table: 'weights', id: 'w1' }]);

    const pullRes = await sync({ since: null, changes: [] }, TOKEN, e);
    const pullBody = (await pullRes.json()) as PushPullResponse;
    const serverCopy = pullBody.changes.find((r) => r.id === 'w1');
    expect(serverCopy?.data).toEqual({ valueKg: 90 });
  });

  it('accepts a newer incoming row and overwrites the server copy', async () => {
    const e = env();
    await sync({ since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z', data: { valueKg: 80 } })] }, TOKEN, e);

    const newerRes = await sync(
      { since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-05T00:00:00.000Z', data: { valueKg: 82 } })] },
      TOKEN,
      e,
    );
    const newerBody = (await newerRes.json()) as PushPullResponse;
    expect(newerBody.superseded).toEqual([]);

    const pullRes = await sync({ since: null, changes: [] }, TOKEN, e);
    const pullBody = (await pullRes.json()) as PushPullResponse;
    expect(pullBody.changes.find((r) => r.id === 'w1')?.data).toEqual({ valueKg: 82 });
  });

  // The comparator itself is tested in app/src/sync/protocol.test.ts. What
  // matters HERE is that the server's outcome for a tie does not depend on
  // arrival order — the property the old id-based tie-break silently failed to
  // provide, since it only ever compared a row's id against itself.
  it('resolves a same-timestamp conflict the same way whichever push arrives first', async () => {
    const t = '2026-01-01T00:00:00.000Z';
    const lighter = row({ id: 'w1', updatedAt: t, data: { valueKg: 80 } });
    const heavier = row({ id: 'w1', updatedAt: t, data: { valueKg: 999 } });

    async function settleWith(first: SyncRow, second: SyncRow) {
      const e = env();
      await sync({ since: null, changes: [first] }, TOKEN, e);
      await sync({ since: null, changes: [second] }, TOKEN, e);
      const pull = (await (await sync({ since: null, changes: [] }, TOKEN, e)).json()) as PushPullResponse;
      return pull.changes.find((r) => r.id === 'w1')?.data;
    }

    // Same pair of writes, opposite order, same surviving row.
    expect(await settleWith(lighter, heavier)).toEqual(await settleWith(heavier, lighter));
  });

  it('tells the losing side to re-read rather than dropping its push silently', async () => {
    const e = env();
    await sync({ since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-05T00:00:00.000Z' })] }, TOKEN, e);

    const stale = (await (await sync(
      { since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z', data: { valueKg: 999 } })] },
      TOKEN,
      e,
    )).json()) as PushPullResponse;

    expect(stale.superseded).toEqual([{ table: 'weights', id: 'w1' }]);
  });
});

describe('soft delete', () => {
  it('propagates deletedAt through push and pull', async () => {
    const e = env();
    await sync({ since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-01T00:00:00.000Z' })] }, TOKEN, e);
    await sync(
      { since: null, changes: [row({ id: 'w1', updatedAt: '2026-01-02T00:00:00.000Z', deletedAt: '2026-01-02T00:00:00.000Z' })] },
      TOKEN,
      e,
    );

    const pullRes = await sync({ since: null, changes: [] }, TOKEN, e);
    const pullBody = (await pullRes.json()) as PushPullResponse;
    expect(pullBody.changes.find((r) => r.id === 'w1')?.deletedAt).toBe('2026-01-02T00:00:00.000Z');
  });
});

describe('since filtering', () => {
  it('returns only rows written after the watermark the client last saw', async () => {
    const e = env();
    const afterOld = (await (await sync(
      { since: null, changes: [row({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' })] },
      TOKEN,
      e,
    )).json()) as PushPullResponse;

    await sync({ since: null, changes: [row({ id: 'new', updatedAt: '2026-01-10T00:00:00.000Z' })] }, TOKEN, e);

    const body = (await (await sync({ since: afterOld.serverSeq, changes: [] }, TOKEN, e)).json()) as PushPullResponse;
    const ids = body.changes.map((r) => r.id);
    expect(ids).toContain('new');
    expect(ids).not.toContain('old');
  });

  it('returns everything when since is null', async () => {
    const e = env();
    await sync({ since: null, changes: [row({ id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' })] }, TOKEN, e);
    await sync({ since: null, changes: [row({ id: 'b', updatedAt: '2026-01-02T00:00:00.000Z' })] }, TOKEN, e);

    const res = await sync({ since: null, changes: [] }, TOKEN, e);
    const body = (await res.json()) as PushPullResponse;
    const ids = body.changes.map((r) => r.id);
    expect(ids.sort()).toEqual(['a', 'b']);
  });
});

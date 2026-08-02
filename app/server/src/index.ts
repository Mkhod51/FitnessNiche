import { Hono, type Context } from 'hono';
import { AUTH_HEADER, AUTH_SCHEME, SYNC_PATH, type SyncErrorResponse } from '../../src/sync/protocol';
import { timingSafeEqual } from './auth';
import { applySync, isValidPushPullRequest } from './sync';
import type { D1Database } from './d1';

type Bindings = {
  DB: D1Database;
  SYNC_TOKEN: string;
  FOOD_SEARCH_ALLOWED_ORIGINS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const FOOD_SEARCH_PATH = '/api/food/search';
const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const OFF_SEARCH_FIELDS = ['code', 'product_name', 'product_name_en', 'brands', 'nutriments'];
const FOOD_SEARCH_CORS_BASE = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};
const FOOD_SEARCH_LIMIT = 10;
const FOOD_SEARCH_WINDOW_MS = 60_000;

function unauthorized(message: string): SyncErrorResponse {
  return { error: message };
}

function boundedPageSize(value: unknown): number {
  const size = Number(value ?? 20);
  if (!Number.isFinite(size)) return 20;
  return Math.min(Math.max(Math.trunc(size), 1), 20);
}

function allowedFoodSearchOrigins(c: Context<{ Bindings: Bindings }>): string[] {
  return (c.env.FOOD_SEARCH_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function foodSearchCorsHeaders(c: Context<{ Bindings: Bindings }>): Record<string, string> {
  const origin = c.req.header('Origin');
  if (!origin) return { ...FOOD_SEARCH_CORS_BASE };
  const selfOrigin = new URL(c.req.url).origin;
  if (origin === selfOrigin || allowedFoodSearchOrigins(c).includes(origin)) {
    return { ...FOOD_SEARCH_CORS_BASE, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  }
  return { ...FOOD_SEARCH_CORS_BASE };
}

function foodSearchOriginAllowed(c: Context<{ Bindings: Bindings }>): boolean {
  const origin = c.req.header('Origin');
  if (!origin) return true;
  const selfOrigin = new URL(c.req.url).origin;
  return origin === selfOrigin || allowedFoodSearchOrigins(c).includes(origin);
}

function foodSearchResponse(c: Context<{ Bindings: Bindings }>, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...foodSearchCorsHeaders(c), 'Content-Type': 'application/json' },
  });
}

function foodSearchClientId(c: Context<{ Bindings: Bindings }>): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0].trim() ?? 'unknown';
}

async function isFoodSearchRateLimited(db: D1Database, clientId: string, now = Date.now()): Promise<boolean> {
  const windowStart = Math.floor(now / FOOD_SEARCH_WINDOW_MS) * FOOD_SEARCH_WINDOW_MS;
  await db
    .prepare('UPDATE food_search_limits SET window_start = ?, count = 0 WHERE client_id = ? AND window_start != ?')
    .bind(windowStart, clientId, windowStart)
    .run();
  await db
    .prepare('INSERT OR IGNORE INTO food_search_limits (client_id, window_start, count) VALUES (?, ?, 0)')
    .bind(clientId, windowStart)
    .run();

  const consumed = await db
    .prepare('UPDATE food_search_limits SET count = count + 1 WHERE client_id = ? AND window_start = ? AND count < ? RETURNING count')
    .bind(clientId, windowStart, FOOD_SEARCH_LIMIT)
    .first<{ count: number }>();
  return !consumed;
}

app.options(FOOD_SEARCH_PATH, (c) => {
  if (!foodSearchOriginAllowed(c)) return new Response(null, { status: 403, headers: FOOD_SEARCH_CORS_BASE });
  return new Response(null, { status: 204, headers: foodSearchCorsHeaders(c) });
});

app.post(FOOD_SEARCH_PATH, async (c) => {
  if (!foodSearchOriginAllowed(c)) return foodSearchResponse(c, { error: 'origin not allowed' }, 403);

  let body: { q?: unknown; pageSize?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return foodSearchResponse(c, { error: 'malformed request body' }, 400);
  }

  const q = typeof body.q === 'string' ? body.q.trim() : '';
  if (!q) return foodSearchResponse(c, { hits: [] }, 200);
  if (await isFoodSearchRateLimited(c.env.DB, foodSearchClientId(c))) {
    return foodSearchResponse(c, { error: 'food search rate limited' }, 429);
  }

  try {
    const upstream = await fetch(OFF_SEARCH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, page_size: boundedPageSize(body.pageSize), fields: OFF_SEARCH_FIELDS }),
    });
    if (!upstream.ok) return foodSearchResponse(c, { error: 'food search failed' }, 502);
    return new Response(await upstream.text(), {
      status: 200,
      headers: {
        ...foodSearchCorsHeaders(c),
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch {
    return foodSearchResponse(c, { error: 'food search failed' }, 502);
  }
});

app.post(SYNC_PATH, async (c) => {
  const header = c.req.header(AUTH_HEADER);
  const prefix = `${AUTH_SCHEME} `;
  if (!header || !header.startsWith(prefix)) {
    return c.json(unauthorized('missing bearer token'), 401);
  }
  const token = header.slice(prefix.length);
  if (!timingSafeEqual(token, c.env.SYNC_TOKEN)) {
    return c.json(unauthorized('invalid bearer token'), 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(unauthorized('malformed request body'), 400);
  }

  if (!isValidPushPullRequest(body)) {
    return c.json(unauthorized('request body does not match PushPullRequest'), 400);
  }

  const response = await applySync(c.env.DB, body);
  return c.json(response, 200);
});

export default app;

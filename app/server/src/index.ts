import { Hono } from 'hono';
import { AUTH_HEADER, AUTH_SCHEME, SYNC_PATH, type SyncErrorResponse } from '../../src/sync/protocol';
import { timingSafeEqual } from './auth';
import { applySync, isValidPushPullRequest } from './sync';
import type { D1Database } from './d1';

type Bindings = {
  DB: D1Database;
  SYNC_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function unauthorized(message: string): SyncErrorResponse {
  return { error: message };
}

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

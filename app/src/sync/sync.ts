import {
  AUTH_HEADER,
  AUTH_SCHEME,
  SYNC_PATH,
  type PushPullRequest,
  type PushPullResponse,
  type SyncErrorResponse,
} from './protocol';
import { pendingRows, clearPending, markPending, getWatermark, setWatermark } from './queue';
import { applyIncoming } from './merge';
import { getSyncConfig } from './config';

export type SyncResult =
  | { configured: false }
  | { configured: true; pushed: number; pulled: number; superseded: number };

/**
 * Runtime config first (Settings-entered), then env vars as a dev/CI fallback.
 * Reads fresh on every call rather than caching at module load — no config
 * means no server today (the default state), which must never become a hard
 * requirement. Tests flip the env half per-case with `vi.stubEnv` without a
 * module reset; the runtime half is just localStorage.
 */
function config(): { url: string; token: string } | null {
  const runtime = getSyncConfig();
  if (runtime) return runtime;
  const url = import.meta.env.VITE_SYNC_URL as string | undefined;
  const token = import.meta.env.VITE_SYNC_TOKEN as string | undefined;
  if (!url || !token) return null;
  return { url, token };
}

let inFlight: Promise<SyncResult> | null = null;

/**
 * Pushes every pending row, applies whatever the server sends back, and
 * settles the queue against the result.
 *
 * Concurrent callers share one in-flight attempt — same caching trick
 * client.ts's initDb() uses — so a manual "sync now" button and the
 * reconnect listener firing at the same moment cannot each collect the
 * pending rows and push them twice.
 */
export function syncNow(now: Date = new Date()): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = runSync(now).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync(now: Date): Promise<SyncResult> {
  const cfg = config();
  if (!cfg) return { configured: false }; // no server configured — offline-only is the supported default, not an error

  const changes = await pendingRows();
  const request: PushPullRequest = { since: await getWatermark(), changes };

  // pendingRows() above only reads — nothing is marked pushed until the
  // server has actually confirmed it below. A thrown error here (bad
  // network, non-2xx, a parsed `{ error }` body) leaves every row exactly as
  // pending as it was before this call, which is the whole of NFR-1's
  // guarantee on this path: a failed sync must never look like a successful
  // one to the queue.
  const res = await fetch(`${cfg.url}${SYNC_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [AUTH_HEADER]: `${AUTH_SCHEME} ${cfg.token}` },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status} ${res.statusText}`);

  const body = (await res.json()) as PushPullResponse | SyncErrorResponse;
  if ('error' in body) throw new Error(`sync rejected: ${body.error}`);

  await applyIncoming(body.changes);

  const supersededKeys = new Set(body.superseded.map((s) => `${s.table}:${s.id}`));
  for (const row of changes) {
    if (supersededKeys.has(`${row.table}:${row.id}`)) {
      // The server kept its own newer copy instead of ours. markPending is
      // idempotent, so this doesn't reset the original pendingSince — a row
      // that keeps losing the LWW comparison doesn't get to look
      // freshly-queued each cycle.
      await markPending(row.table, row.id, now);
    } else {
      await clearPending(row.table, row.id, now);
    }
  }

  await setWatermark(body.serverSeq);

  return { configured: true, pushed: changes.length, pulled: body.changes.length, superseded: body.superseded.length };
}

/**
 * Syncs the moment connectivity comes back, and only then — no polling
 * timer. `online` already fires exactly when a retry has a chance of
 * working; polling on an interval would just spend battery hitting a Worker
 * that isn't there yet.
 *
 * Returns a cleanup function so a component can remove the listener on
 * unmount. When sync isn't configured this is a no-op both ways: nothing is
 * attached, and the returned cleanup has nothing to remove.
 *
 * Idempotent and re-armable: calling it again (after Settings changes the
 * config) tears down the previous listener first, so the online handler
 * always reflects the current config and never stacks. The single armed
 * listener is tracked module-side so a re-arm and the previous cleanup
 * can't both be holding the same handler.
 */
let armedCleanup: (() => void) | null = null;

export function startAutoSync(): () => void {
  // Disarm whatever is currently armed, regardless of config — a re-call after
  // a config change must re-evaluate from a clean slate.
  armedCleanup?.();
  armedCleanup = null;

  if (!config()) return () => {};

  const onOnline = () => {
    syncNow().catch((err) => {
      // Auto-sync is a best-effort retry, not a request anyone is awaiting —
      // the next reconnect (or a manual sync) tries again. Swallowing this
      // silently would hide a persistently broken endpoint, so it's logged.
      console.error('auto-sync failed', err);
    });
  };

  window.addEventListener('online', onOnline);
  const cleanup = () => {
    window.removeEventListener('online', onOnline);
    if (armedCleanup === cleanup) armedCleanup = null;
  };
  armedCleanup = cleanup;
  return cleanup;
}

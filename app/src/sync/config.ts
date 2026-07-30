/**
 * Runtime sync configuration.
 *
 * The bearer token lives in localStorage, not in SQLite. It is the credential
 * for the sync server itself: storing it in a sync'd table would push the
 * server's own key up to the server, and there is no user-health reason for it
 * to cross the wire. localStorage is the right place for a non-health
 * connection setting — it stays on this device, out of the replication set,
 * and out of exports (db/export.ts only reads SQLite).
 *
 * Env vars (`VITE_SYNC_URL` / `VITE_SYNC_TOKEN`) remain as a fallback for dev
 * and CI; sync.ts reads runtime config first, then env, then gives up. The
 * unconfigured state is the normal one — sync is opt-in, never a hard
 * requirement (NFR-1: offline-only is supported).
 */

const STORAGE_KEY = 'myostat.sync';

export interface SyncConfig {
  url: string;
  token: string;
}

/**
 * localStorage with a memory fallback. In a normal browser localStorage is
 * present and functional and this is a passthrough. The fallback covers two
 * real cases: some private-mode contexts throw on access, and the Node test
 * runner exposes a half-installed experimental `localStorage` whose `setItem`
 * is undefined (which would otherwise crash every test and every Settings
 * save). The fallback is per-session only — a config that lands in memory
 * does not survive a reload, which is the correct degradation for a broken
 * storage backend, not a silent data-loss path.
 */
const mem = new Map<string, string>();
const storage = {
  get(key: string): string | null {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.getItem === 'function') {
      try {
        return ls.getItem(key);
      } catch {
        return mem.get(key) ?? null;
      }
    }
    return mem.get(key) ?? null;
  },
  set(key: string, value: string): void {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.setItem === 'function') {
      try {
        ls.setItem(key, value);
        return;
      } catch {
        /* fall through to memory */
      }
    }
    mem.set(key, value);
  },
  remove(key: string): void {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.removeItem === 'function') {
      try {
        ls.removeItem(key);
      } catch {
        /* fall through */
      }
    }
    mem.delete(key);
  },
};

export function getSyncConfig(): SyncConfig | null {
  const raw = storage.get(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SyncConfig>;
    if (parsed.url && parsed.token) return { url: parsed.url, token: parsed.token };
    return null;
  } catch {
    // Corrupt storage is the same as no storage — sync stays off rather than
    // throwing on every boot. The user re-enters the config.
    return null;
  }
}

/**
 * Persists the config. Does NOT re-arm auto-sync itself — that would create a
 * circular import with sync.ts. The caller (Settings) calls `startAutoSync()`
 * after this so the online listener re-evaluates against the new config.
 */
export function setSyncConfig(url: string, token: string): void {
  storage.set(STORAGE_KEY, JSON.stringify({ url: url.trim(), token: token.trim() }));
}

export function clearSyncConfig(): void {
  storage.remove(STORAGE_KEY);
}

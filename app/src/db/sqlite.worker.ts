import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { DbRequest, DbResponse, StorageMode } from './protocol';
import { saveSnapshot, loadSnapshot } from './snapshot';

let db: Database | null = null;
let storage: StorageMode = 'memory-fallback';
let sqlite3Static: Sqlite3Static | null = null;

// D6: OPFS SAHPool is single-connection — a second tab can't get the pool
// lock and falls back to `:memory:`, which has no persistence of its own.
// After a mutating write this exports the whole (in-memory) database to
// IndexedDB so fallback mode survives a reload.
//
// The coalescing window is 0, not a "safe" 250ms, and that is deliberate.
// Measured in a real second tab against the seeded database, a full
// sqlite3_js_db_export plus the IndexedDB put costs 0.5-1.0 ms. The real usage
// scene writes roughly one set every 90 seconds, so a longer window saves
// nothing measurable and buys a window in which closing the tab loses the write
// this whole mechanism exists to protect. A 0ms timeout still coalesces a burst
// of statements issued in one synchronous turn (a multi-insert transaction),
// which is the only batching that was ever worth having.
// Revisit only if the database grows enough for that 0.5 ms to move.
const SNAPSHOT_DEBOUNCE_MS = 0;
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

function exportSnapshot(): Uint8Array {
  if (!db || !sqlite3Static) throw new Error('db not initialised');
  return sqlite3Static.capi.sqlite3_js_db_export(db);
}

async function flushSnapshot(): Promise<void> {
  if (snapshotTimer) {
    clearTimeout(snapshotTimer);
    snapshotTimer = null;
  }
  if (!db || storage !== 'memory-fallback') return;
  await saveSnapshot(exportSnapshot());
}

function scheduleSnapshot(): void {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    snapshotTimer = null;
    void flushSnapshot();
  }, SNAPSHOT_DEBOUNCE_MS);
}

async function init(): Promise<StorageMode> {
  // The installed .d.mts declares `init(): Promise<Sqlite3Static>` with no
  // params (the brief assumed a `{ print, printErr }` config arg) — follow
  // the types and take the default console output.
  const sqlite3 = await sqlite3InitModule();
  sqlite3Static = sqlite3;
  let pool;
  try {
    // Preferred: persistent, no COOP/COEP needed, iOS Safari 16.4+.
    // Only the capability probe goes in this try — private browsing,
    // unsupported browser, or pool-lock acquisition failure are legitimate
    // "this environment can't" outcomes worth falling back for.
    pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'etl-pool' });
  } catch (err) {
    console.warn('OPFS SAHPool unavailable, falling back to in-memory:', err);
    db = new sqlite3.oo1.DB(':memory:');
    storage = 'memory-fallback';
    // D6: restore whatever the last memory-fallback session managed to
    // export before its tab closed, so a second tab isn't starting blank.
    const bytes = await loadSnapshot();
    if (bytes) {
      const p = sqlite3.wasm.allocFromTypedArray(bytes);
      sqlite3.capi.sqlite3_deserialize(
        db.pointer!,
        'main',
        p,
        bytes.length,
        bytes.length,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
      );
    }
    return storage;
  }
  // The pool installed fine, so constructing the db from it is a plain API
  // call. A failure here is almost certainly a bug (NFR-1: no silent data
  // loss) — let it throw so `init` rejects instead of masquerading as a
  // capability fallback.
  db = new pool.OpfsSAHPoolDb('/app.db');
  storage = 'opfs-sahpool';
  return storage;
}

self.onmessage = async (e: MessageEvent<DbRequest>) => {
  const req = e.data;
  const post = (r: DbResponse) => self.postMessage(r);
  try {
    if (req.kind === 'init') {
      const mode = await init();
      post({ id: req.id, ok: true, kind: 'init', storage: mode });
      return;
    }
    if (req.kind === 'flush') {
      await flushSnapshot();
      post({ id: req.id, ok: true, kind: 'flush' });
      return;
    }
    if (!db) throw new Error('db not initialised');
    const rows = db.exec({
      sql: req.sql,
      bind: req.params as BindingSpec,
      rowMode: 'array',
      returnValue: 'resultRows',
    }) as unknown[][];
    const changes = db.changes() as number;
    // Only in memory-fallback: OPFS already persists on its own, so exporting
    // the whole db there per write would be pure waste. Only on an actual
    // mutation: reads leave `changes()` at whatever the last write left it,
    // so gating on it here means a run of selects never triggers a serialise.
    if (storage === 'memory-fallback' && changes > 0) scheduleSnapshot();
    post({ id: req.id, ok: true, kind: 'exec', rows: rows ?? [], changes });
  } catch (err) {
    post({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import type { DbRequest, DbResponse, StorageMode } from './protocol';

let db: Database | null = null;
let storage: StorageMode = 'memory-fallback';

async function init(): Promise<StorageMode> {
  // The installed .d.mts declares `init(): Promise<Sqlite3Static>` with no
  // params (the brief assumed a `{ print, printErr }` config arg) — follow
  // the types and take the default console output.
  const sqlite3 = await sqlite3InitModule();
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
    if (!db) throw new Error('db not initialised');
    const rows = db.exec({
      sql: req.sql,
      bind: req.params as BindingSpec,
      rowMode: 'array',
      returnValue: 'resultRows',
    }) as unknown[][];
    post({ id: req.id, ok: true, kind: 'exec', rows: rows ?? [] });
  } catch (err) {
    post({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};

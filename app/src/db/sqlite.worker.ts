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
  try {
    // Preferred: persistent, no COOP/COEP needed, iOS Safari 16.4+.
    const pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'etl-pool' });
    db = new pool.OpfsSAHPoolDb('/app.db');
    storage = 'opfs-sahpool';
  } catch (err) {
    // Private browsing, unsupported browser, or pool acquisition failure.
    console.warn('OPFS SAHPool unavailable, falling back to in-memory:', err);
    db = new sqlite3.oo1.DB(':memory:');
    storage = 'memory-fallback';
  }
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

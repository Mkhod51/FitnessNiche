import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { createRpc } from './rpc';
import type { SqlMethod, StorageMode } from './protocol';
import { runMigrations } from './migrate';
import * as schema from './schema';

let rpc: ReturnType<typeof createRpc> | null = null;
let mode: StorageMode | null = null;
let initPromise: Promise<StorageMode> | null = null;
let dz: ReturnType<typeof drizzle> | null = null;

// sqlite-proxy contract: 'get' must resolve to a single row (or undefined),
// never an array of rows. The worker (Task 2) always executes with
// rowMode: 'array' and returnValue: 'resultRows' regardless of `method`, so
// `execSql` always resolves to an array of row-arrays — `rows[0]` picks the
// single row out for 'get'. Deliberately no `?? []` fallback: sqlite-proxy's
// mapGetResult treats a falsy row as "not found" and returns undefined, but
// `[]` is truthy, so it would map an all-undefined-fields row instead
// (verified with a real sqlite engine in drizzle-contract.test.ts).
function makeDrizzle() {
  return drizzle(async (sql, params, method) => {
    const rows = await execSql(sql, params, method as SqlMethod);
    return { rows: method === 'get' ? rows[0] : rows };
  }, { schema });
}

export async function initDb(): Promise<StorageMode> {
  if (mode) return mode;
  // Cache the in-flight promise (not just the settled `mode`) so concurrent
  // callers — e.g. React StrictMode's double effect invocation — await the
  // same initialisation instead of each spawning their own worker.
  if (!initPromise) {
    initPromise = (async () => {
      const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
      rpc = createRpc(worker);
      mode = await rpc.init();
      await runMigrations(execSql);
      dz = makeDrizzle();
      return mode;
    })();
  }
  return initPromise;
}

export function getStorageMode(): StorageMode | null {
  return mode;
}

export function getDrizzle() {
  if (!dz) throw new Error('initDb() must be called first');
  return dz;
}

export async function execSql(sql: string, params: unknown[] = [], method: SqlMethod = 'all') {
  if (!rpc) throw new Error('initDb() must be called first');
  return rpc.exec(sql, params, method);
}

// e2e-only escape hatch: the persistence e2e test runs against the built +
// previewed bundle, where page.evaluate() can't `import()` a raw /src module
// (it isn't served, and isn't transformed from .ts). Gated to the `e2e`
// build mode (`vite build --mode e2e`, see playwright.config.ts) — never
// present in a normal production build.
if (import.meta.env.MODE === 'e2e') {
  (window as unknown as { __db: { execSql: typeof execSql } }).__db = { execSql };
}

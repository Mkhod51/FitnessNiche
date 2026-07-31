import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { createRpc } from './rpc';
import type { SqlMethod, StorageMode } from './protocol';
import { runMigrations } from './migrate';
import { seedExercises, seedFoods } from './seed';
import * as schema from './schema';

let rpc: ReturnType<typeof createRpc> | null = null;
let mode: StorageMode | null = null;
let initPromise: Promise<StorageMode> | null = null;
let dz: ReturnType<typeof drizzle> | null = null;

// Richer than `Exec` (D8): also reports `changes` (db.changes()) so a
// drizzle `.run()` can tell the caller how many rows an insert/update/delete
// touched. Kept separate from `Exec` rather than widening it everywhere —
// migrate.ts/seed.ts never need a row count, only the drizzle proxy does.
export type ExecWithChanges = (sql: string, params: unknown[], method: SqlMethod) => Promise<{ rows: unknown[][]; changes: number }>;

// sqlite-proxy contract: 'get' must resolve to a single row (or undefined),
// never an array of rows. The worker (Task 2) always executes with
// rowMode: 'array' and returnValue: 'resultRows' regardless of `method`, so
// `execSql` always resolves to an array of row-arrays — `rows[0]` picks the
// single row out for 'get'. Deliberately no `?? []` fallback: sqlite-proxy's
// mapGetResult treats a falsy row as "not found" and returns undefined, but
// `[]` is truthy, so it would map an all-undefined-fields row instead
// (verified with a real sqlite engine in drizzle-contract.test.ts).
export function makeProxyCallback(exec: ExecWithChanges) {
  return async (sql: string, params: unknown[], method: string) => {
    const { rows, changes } = await exec(sql, params, method as SqlMethod);
    return { rows: method === 'get' ? rows[0] : rows, changes };
  };
}

function makeDrizzle() {
  return drizzle(makeProxyCallback(execSqlWithChanges), { schema });
}

export async function initDb(): Promise<StorageMode> {
  if (mode) return mode;
  // Cache the in-flight promise (not just the settled `mode`) so concurrent
  // callers — e.g. React StrictMode's double effect invocation — await the
  // same initialisation instead of each spawning their own worker.
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
        rpc = createRpc(worker);
        mode = await rpc.init();
        await runMigrations(execSql);
        await seedExercises(execSql);
        await seedFoods(execSql);
        dz = makeDrizzle();
        return mode;
      } catch (err) {
        // `mode` gets assigned before migrations/seed run, so a failure
        // there must clear it too — otherwise the next call's `if (mode)
        // return mode` above resolves successfully against a database that
        // never finished migrating, and getDrizzle() throws downstream
        // instead of the real error surfacing here.
        mode = null;
        initPromise = null;
        throw err;
      }
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

// The rows-and-changes shape drizzle needs (D8). Kept internal to this
// module — everything outside (migrate.ts, seed.ts, the e2e window.__db
// hatch below) only ever wanted the rows array, which `execSql` still gives
// them unchanged.
export async function execSqlWithChanges(sql: string, params: unknown[] = [], method: SqlMethod = 'all') {
  if (!rpc) throw new Error('initDb() must be called first');
  return rpc.exec(sql, params, method);
}

export async function execSql(sql: string, params: unknown[] = [], method: SqlMethod = 'all') {
  const { rows } = await execSqlWithChanges(sql, params, method);
  return rows;
}

// memory-fallback only: force the worker's debounced snapshot export to run
// now (see sqlite.worker.ts). No-ops in opfs-sahpool.
export async function flush(): Promise<void> {
  if (!rpc) throw new Error('initDb() must be called first');
  await rpc.flush();
}

// D6: a debounced export in the worker (see sqlite.worker.ts) means a write
// in memory-fallback mode isn't durable the instant it happens — only after
// the trailing delay. A user who logs a set and immediately closes the tab
// would otherwise lose exactly that write, so force the flush the moment the
// tab is about to go away. No-ops in opfs-sahpool (the worker checks).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush().catch(() => {});
  });
}

// e2e-only escape hatch: the persistence e2e test runs against the built +
// previewed bundle, where page.evaluate() can't `import()` a raw /src module
// (it isn't served, and isn't transformed from .ts). Gated to the `e2e`
// build mode (`vite build --mode e2e`, see playwright.config.ts) — never
// present in a normal production build. `flush` is exposed alongside
// `execSql` so fallback-persistence.spec.ts can deterministically trigger
// the exact same export the visibilitychange handler above fires, instead
// of racing a real tab-close against the worker's async IndexedDB write.
if (import.meta.env.MODE === 'e2e') {
  (window as unknown as { __db: { execSql: typeof execSql; flush: typeof flush } }).__db = { execSql, flush };
}

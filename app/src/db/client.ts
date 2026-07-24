import { createRpc } from './rpc';
import type { SqlMethod, StorageMode } from './protocol';

let rpc: ReturnType<typeof createRpc> | null = null;
let mode: StorageMode | null = null;
let initPromise: Promise<StorageMode> | null = null;

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
      return mode;
    })();
  }
  return initPromise;
}

export function getStorageMode(): StorageMode | null {
  return mode;
}

export async function execSql(sql: string, params: unknown[] = [], method: SqlMethod = 'all') {
  if (!rpc) throw new Error('initDb() must be called first');
  return rpc.exec(sql, params, method);
}

import { createRpc } from './rpc';
import type { SqlMethod, StorageMode } from './protocol';

let rpc: ReturnType<typeof createRpc> | null = null;
let mode: StorageMode | null = null;

export async function initDb(): Promise<StorageMode> {
  if (mode) return mode;
  const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
  rpc = createRpc(worker);
  mode = await rpc.init();
  return mode;
}

export function getStorageMode(): StorageMode | null {
  return mode;
}

export async function execSql(sql: string, params: unknown[] = [], method: SqlMethod = 'all') {
  if (!rpc) throw new Error('initDb() must be called first');
  return rpc.exec(sql, params, method);
}

import type { DbRequest, DbResponse, SqlMethod, StorageMode } from './protocol';

// Plain `Omit` collapses a discriminated union to only its shared keys
// (keyof over a union is an intersection); this distributes it per member.
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

export function createRpc(worker: Worker) {
  let nextId = 1;
  const pending = new Map<number, { resolve: (v: never) => void; reject: (e: Error) => void }>();

  worker.onmessage = (e: MessageEvent<DbResponse>) => {
    const res = e.data;
    const entry = pending.get(res.id);
    if (!entry) return;
    pending.delete(res.id);
    if (!res.ok) { entry.reject(new Error(res.error)); return; }
    entry.resolve((res.kind === 'exec' ? res.rows : res.storage) as never);
  };

  function send<T>(req: DistributiveOmit<DbRequest, 'id'>): Promise<T> {
    const id = nextId++;
    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as (v: never) => void, reject });
      worker.postMessage({ ...req, id } as DbRequest);
    });
  }

  return {
    init: () => send<StorageMode>({ kind: 'init' }),
    exec: (sql: string, params: unknown[] = [], method: SqlMethod = 'all') =>
      send<unknown[][]>({ kind: 'exec', sql, params, method }),
    dispose: () => worker.terminate(),
  };
}

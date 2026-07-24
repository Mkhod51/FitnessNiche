import type { DbRequest, DbResponse, SqlMethod, StorageMode } from './protocol';

// Plain `Omit` collapses a discriminated union to only its shared keys
// (keyof over a union is an intersection); this distributes it per member.
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

export function createRpc(worker: Worker) {
  let nextId = 1;
  // Set once the worker has crashed; every call made after that point
  // rejects immediately instead of posting into a torn-down worker and
  // hanging forever (nothing will ever reply to it).
  let dead: Error | null = null;
  const pending = new Map<number, { resolve: (v: never) => void; reject: (e: Error) => void }>();

  worker.onmessage = (e: MessageEvent<DbResponse>) => {
    const res = e.data;
    const entry = pending.get(res.id);
    if (!entry) return;
    pending.delete(res.id);
    if (!res.ok) { entry.reject(new Error(res.error)); return; }
    entry.resolve((res.kind === 'exec' ? res.rows : res.storage) as never);
  };

  // A dead/crashed worker never posts a response, so without this every
  // pending caller hangs forever. Reject them all here instead.
  // Deliberately no per-request timeout: slow devices and cold wasm init
  // make timeouts a source of false failures, and a crash is already
  // covered by onerror — a timeout would only add false positives, not
  // catch anything this doesn't.
  worker.onerror = (e: ErrorEvent) => {
    const error = new Error(`worker crashed: ${e.message}`);
    dead = error;
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  };

  function send<T>(req: DistributiveOmit<DbRequest, 'id'>): Promise<T> {
    if (dead) return Promise.reject(dead);
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
    // Debug-only: lets tests confirm the map is actually emptied on crash,
    // not just that the promises settled.
    _pendingCount: () => pending.size,
  };
}

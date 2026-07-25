export type SqlMethod = 'run' | 'all' | 'values' | 'get';
export type StorageMode = 'opfs-sahpool' | 'memory-fallback';

export type DbRequest =
  | { id: number; kind: 'init' }
  | { id: number; kind: 'exec'; sql: string; params: unknown[]; method: SqlMethod };

export type DbResponse =
  | { id: number; ok: true; kind: 'init'; storage: StorageMode }
  | { id: number; ok: true; kind: 'exec'; rows: unknown[][] }
  | { id: number; ok: false; error: string };

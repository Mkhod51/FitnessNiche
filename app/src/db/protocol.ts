export type SqlMethod = 'run' | 'all' | 'values' | 'get';
export type StorageMode = 'opfs-sahpool' | 'memory-fallback';

export type DbRequest =
  | { id: number; kind: 'init' }
  | { id: number; kind: 'exec'; sql: string; params: unknown[]; method: SqlMethod }
  // memory-fallback only: force the debounced snapshot export to run now,
  // instead of waiting out its trailing delay. Sent on visibilitychange ->
  // hidden, since a tab that closes mid-debounce would otherwise lose the
  // write that hasn't been exported yet.
  | { id: number; kind: 'flush' };

export type DbResponse =
  | { id: number; ok: true; kind: 'init'; storage: StorageMode }
  // `changes` is a widening (D8) — populated from db.changes() so the
  // drizzle adapter can report rows-affected on writes. Existing callers
  // that only read `.rows` are unaffected.
  | { id: number; ok: true; kind: 'exec'; rows: unknown[][]; changes: number }
  | { id: number; ok: true; kind: 'flush' }
  | { id: number; ok: false; error: string };

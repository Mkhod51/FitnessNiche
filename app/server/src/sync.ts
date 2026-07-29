import {
  incomingWins,
  isSyncTable,
  SYNC_TABLES,
  type PushPullRequest,
  type PushPullResponse,
  type SyncRow,
  type SyncTable,
} from '../../src/sync/protocol';
import type { D1Database } from './d1';

interface StoredRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
  data: string;
  server_seq: number;
}

function toSyncRow(table: SyncTable, row: StoredRow): SyncRow {
  return {
    table,
    id: row.id,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    data: JSON.parse(row.data) as Record<string, unknown>,
  };
}

async function fetchExisting(
  db: D1Database,
  table: SyncTable,
  id: string,
): Promise<{ updatedAt: string; data: Record<string, unknown> } | undefined> {
  // `data` is selected as well as the timestamp because the tie-break compares
  // row CONTENT — comparing ids would be comparing a row against itself.
  const row = await db
    .prepare(`SELECT updated_at, data FROM ${table} WHERE id = ?`)
    .bind(id)
    .first<{ updated_at: string; data: string }>();
  return row ? { updatedAt: row.updated_at, data: JSON.parse(row.data) as Record<string, unknown> } : undefined;
}

function upsertStatement(db: D1Database, row: SyncRow, seq: number) {
  // Table name is interpolated, not bound -- SQLite has no placeholder for
  // identifiers. Safe here only because `row.table` was already checked
  // against isSyncTable in validation; it never carries request-controlled
  // free text.
  return db
    .prepare(
      `INSERT INTO ${row.table} (id, updated_at, deleted_at, data, server_seq)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         data = excluded.data,
         server_seq = excluded.server_seq`,
    )
    .bind(row.id, row.updatedAt, row.deletedAt, JSON.stringify(row.data), seq);
}

async function selectSince(
  db: D1Database,
  table: SyncTable,
  since: number | null,
): Promise<{ row: SyncRow; serverSeq: number }[]> {
  // Filtered on server_seq, never on updated_at: see schema.sql for why mixing
  // the device's clock into the pull loses rows outright.
  const stmt =
    since === null
      ? db.prepare(`SELECT id, updated_at, deleted_at, data, server_seq FROM ${table}`)
      : db.prepare(`SELECT id, updated_at, deleted_at, data, server_seq FROM ${table} WHERE server_seq > ?`).bind(since);
  const { results } = await stmt.all<StoredRow>();
  return results.map((r) => ({ row: toSyncRow(table, r), serverSeq: r.server_seq }));
}

/**
 * Applies a push and computes the matching pull, in that order, so a device
 * that just wrote something never sees it come back as if it were someone
 * else's change (the `wonKeys` exclusion below).
 *
 * All accepted writes go through a single db.batch() call -- if the batch
 * throws, nothing in it was applied. Doing this as N separate `.run()` calls
 * would let a crash between call 3 and 4 leave the two devices' logs
 * disagreeing about which rows made it, which is exactly the class of bug
 * last-write-wins is supposed to make impossible.
 */
export async function applySync(db: D1Database, request: PushPullRequest): Promise<PushPullResponse> {
  const superseded: { table: SyncTable; id: string }[] = [];
  const winners: SyncRow[] = [];
  const wonKeys = new Set<string>();

  for (const incoming of request.changes) {
    const existing = await fetchExisting(db, incoming.table, incoming.id);
    if (incomingWins(incoming, existing)) {
      winners.push(incoming);
      wonKeys.add(`${incoming.table}:${incoming.id}`);
    } else {
      superseded.push({ table: incoming.table, id: incoming.id });
    }
  }

  // One sequence per accepted batch, not per row. Rows written together share a
  // number, which is exactly right: `since` is a strict `>`, so a client either
  // sees the whole batch or none of it, and can never resume in the middle of
  // one and skip the rest.
  const current = await currentSeq(db);
  const seq = winners.length > 0 ? current + 1 : current;

  if (winners.length > 0) {
    await db.batch([
      ...winners.map((row) => upsertStatement(db, row, seq)),
      db.prepare('UPDATE sync_state SET seq = ? WHERE id = 1').bind(seq),
    ]);
  }

  const changes: SyncRow[] = [];
  let highest = seq;
  for (const table of SYNC_TABLES) {
    const rows = await selectSince(db, table, request.since);
    for (const { row, serverSeq } of rows) {
      if (serverSeq > highest) highest = serverSeq;
      if (!wonKeys.has(`${table}:${row.id}`)) changes.push(row);
    }
  }

  // The watermark returned is the highest sequence this response ACCOUNTS FOR,
  // never simply "the counter as it stands". Returning the latter would let a
  // client skip past rows written by someone else between the select and the
  // reply, and it would never ask for them again.
  return { serverSeq: highest, changes, superseded };
}

async function currentSeq(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT seq FROM sync_state WHERE id = 1').first<{ seq: number }>();
  return row?.seq ?? 0;
}

/** Narrows unknown request bodies to PushPullRequest. No throwing -- callers turn a false into a 400. */
export function isValidPushPullRequest(body: unknown): body is PushPullRequest {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.since !== null && typeof b.since !== 'number') return false;
  if (!Array.isArray(b.changes)) return false;
  return b.changes.every(isValidSyncRow);
}

function isValidSyncRow(row: unknown): row is SyncRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  if (typeof r.table !== 'string' || !isSyncTable(r.table)) return false;
  if (typeof r.id !== 'string' || r.id.length === 0) return false;
  if (typeof r.updatedAt !== 'string' || r.updatedAt.length === 0) return false;
  if (r.deletedAt !== null && typeof r.deletedAt !== 'string') return false;
  if (typeof r.data !== 'object' || r.data === null || Array.isArray(r.data)) return false;
  return true;
}

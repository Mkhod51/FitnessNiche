/**
 * protocol.ts — the wire contract between the app and the sync Worker.
 *
 * Shared by both sides on purpose: the client and the Worker import this same
 * file, so a change to the shape breaks the build on both ends at once rather
 * than at runtime on someone's phone in a basement.
 *
 * NFR-2 pins the strategy: **append-log push/pull with last-write-wins on
 * `updated_at`**. No CRDTs, no operational transform — explicitly the wrong
 * problem class for a single-user app, and the decision is already logged.
 */

/**
 * The tables that replicate.
 *
 * Deliberately not everything in the schema:
 * - `exercises` and `food_items` are reference data shipped with the build, not
 *   the user's. Syncing them would push a catalogue up and down forever.
 * - `sync_meta` is this mechanism's own bookkeeping. Syncing the queue through
 *   the queue is a loop.
 */
export const SYNC_TABLES = [
  'users',
  'workouts',
  'sets',
  'weights',
  'advice_events',
  'food_log_entries',
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];

export function isSyncTable(name: string): name is SyncTable {
  return (SYNC_TABLES as readonly string[]).includes(name);
}

/**
 * One row in flight.
 *
 * `updatedAt` is the merge key and is never optional — a row without one cannot
 * be ordered against its counterpart, so it cannot be merged at all.
 *
 * `deletedAt` carries soft deletes across the wire. A hard delete would be
 * invisible to the other device: it would pull nothing, notice nothing, and
 * silently keep the row forever. `users` is the one table with no
 * `deleted_at` column, and it does not need one — it is a singleton, and
 * erasing it is the delete-account path (GR-5), not a sync operation.
 */
export interface SyncRow {
  table: SyncTable;
  id: string;
  updatedAt: string;
  deletedAt: string | null;
  /** The full row, column names as the local schema spells them. */
  data: Record<string, unknown>;
}

export interface PushPullRequest {
  /**
   * Server clock value from the previous successful sync, or null on first run.
   * The server returns everything it holds with `updatedAt` strictly after this.
   */
  since: string | null;
  /** Local rows with pending writes. May be empty — an empty push is a pull. */
  changes: SyncRow[];
}

export interface PushPullResponse {
  /**
   * The server's clock at the moment it answered. The client stores this and
   * sends it back as `since` next time.
   *
   * Deliberately the SERVER's time, never the device's: phone clocks drift, and
   * a device running fast would set a watermark into the future and then never
   * pull the rows written in the gap.
   */
  serverTime: string;
  /** Rows the server holds that the client has not seen since `since`. */
  changes: SyncRow[];
  /** Rows the server REJECTED because its copy was newer. Client re-reads these. */
  superseded: { table: SyncTable; id: string }[];
}

export interface SyncErrorResponse {
  error: string;
}

/**
 * Last-write-wins, with the tie broken deterministically.
 *
 * Two writes landing in the same millisecond is not hypothetical — an import
 * writes a whole session at once, and ISO strings only carry milliseconds. With
 * no tie-break the winner would depend on which side asked first, so the same
 * pair of devices could disagree forever, each certain it was right. Comparing
 * the id when the timestamps match is arbitrary but *stable*, which is the
 * property that matters: both sides independently reach the same answer.
 *
 * Returns true when `incoming` should replace `existing`.
 */
export function incomingWins(
  incoming: { updatedAt: string; id: string },
  existing: { updatedAt: string; id: string } | undefined,
): boolean {
  if (!existing) return true;
  if (incoming.updatedAt !== existing.updatedAt) return incoming.updatedAt > existing.updatedAt;
  return incoming.id > existing.id;
}

/** Single-user bearer auth (BUILD-PLAN §stack). Header name pinned here so both ends agree. */
export const AUTH_HEADER = 'Authorization';
export const AUTH_SCHEME = 'Bearer';
export const SYNC_PATH = '/sync';

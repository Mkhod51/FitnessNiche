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
   * The server sequence this client has already seen, or null on first run.
   * The server returns everything stamped strictly after it.
   *
   * A SEQUENCE, not a timestamp, and that is the whole point. `updatedAt` is
   * written by the device that made the change, so filtering the pull by a
   * server clock compares two clocks that were never synchronised: a phone
   * running five minutes slow stamps its rows in the past, the other device's
   * watermark has already moved beyond them, and those rows are never pulled at
   * all. Silent data loss across devices, and it needs no clock skew to happen —
   * a push arriving during another device's request loses the same way.
   *
   * The sequence is assigned by the server, on write, from a counter it owns. No
   * clock takes part in deciding what a device has already seen.
   */
  since: number | null;
  /** Local rows with pending writes. May be empty — an empty push is a pull. */
  changes: SyncRow[];
}

export interface PushPullResponse {
  /**
   * The highest sequence this response accounts for. The client stores it and
   * sends it back as `since` next time.
   */
  serverSeq: number;
  /** Rows the server holds that the client has not seen since `since`. */
  changes: SyncRow[];
  /** Rows the server REJECTED because its copy was newer. Client re-reads these. */
  superseded: { table: SyncTable; id: string }[];
}

export interface SyncErrorResponse {
  error: string;
}

/**
 * A stable serialisation of a row's contents, for comparing two versions of it.
 *
 * Keys are sorted, so two devices that built the same row in a different column
 * order still produce the same string. Only used as a tie-break ordering — it is
 * never stored, never sent, and never shown.
 */
export function canonicalise(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(',')}}`;
}

/**
 * Last-write-wins, with the tie broken on content.
 *
 * Two writes landing in the same millisecond is not hypothetical — an import
 * writes a whole session at once, and ISO strings only carry milliseconds.
 *
 * The tie-break compares the rows' CONTENT, not their ids. An earlier version
 * compared ids, which was dead code: this is only ever called with two versions
 * of the SAME row, so `id > id` is always false and the tie silently resolved to
 * "whoever the server heard from first". That is not a property both sides can
 * compute — the server's arrival order decides it — so a client merging locally
 * and the server merging remotely could reach different answers and stay there.
 *
 * Content comparison restores what the tie-break is actually for: the winner is
 * a pure function of the two rows, so every party independently reaches the same
 * answer without needing to know who arrived first. Which row wins is arbitrary.
 * That it is the same one everywhere is not.
 *
 * Returns true when `incoming` should replace `existing`.
 */
export function incomingWins(
  incoming: { updatedAt: string; data?: Record<string, unknown> },
  existing: { updatedAt: string; data?: Record<string, unknown> } | undefined,
): boolean {
  if (!existing) return true;
  if (incoming.updatedAt !== existing.updatedAt) return incoming.updatedAt > existing.updatedAt;
  // Identical content is not a conflict — nothing changes either way, and
  // reporting it as superseded would send the client off to re-read a row it
  // already has.
  return canonicalise(incoming.data ?? null) > canonicalise(existing.data ?? null);
}

/** Single-user bearer auth (BUILD-PLAN §stack). Header name pinned here so both ends agree. */
export const AUTH_HEADER = 'Authorization';
export const AUTH_SCHEME = 'Bearer';
export const SYNC_PATH = '/sync';

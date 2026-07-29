import { incomingWins, type SyncRow } from './protocol';
import { readRow, writeRow } from './tables';

/**
 * Writes server rows into the local DB: last-write-wins on `updatedAt`,
 * using protocol.ts's `incomingWins` exactly as written — never a local
 * reimplementation of the comparison, which is the one thing both ends of
 * the wire have to agree on byte-for-byte.
 *
 * The existing row is re-read fresh for every incoming row rather than
 * trusting anything sync.ts saw before the network round trip. That gap is
 * real: the device can edit a row again while its own push for that same row
 * is in flight, and a pull landing moments later carries a server value that
 * only looks newer than the STALE pre-push snapshot. Comparing against the
 * live row instead means a pending edit that happened during the round trip
 * is never clobbered by a pull that raced it — which is exactly NFR-1 (never
 * lose a write) for this code path.
 */
export async function applyIncoming(rows: SyncRow[]): Promise<void> {
  for (const row of rows) {
    const existing = await readRow(row.table, row.id);
    // The tie-break compares row CONTENT, so the local row's own columns go in
    // — not its id, which is the same on both sides and could never
    // discriminate. The local row is read fresh here, after the network round
    // trip, so an edit made DURING the sync is compared against rather than
    // overwritten (NFR-1: never lose a write).
    const existingKey = existing
      ? { updatedAt: existing.updatedAt as string, data: existing as Record<string, unknown> }
      : undefined;

    if (!incomingWins({ updatedAt: row.updatedAt, data: row.data }, existingKey)) continue; // local wins — including a still-pending local edit that is newer

    // `row.data` is the full row as the wire spells it, but id/updatedAt/
    // deletedAt are also carried as their own top-level SyncRow fields
    // precisely because they're the merge key and the tombstone — treat
    // those as authoritative over anything duplicated inside `data`.
    const values: Record<string, unknown> = { ...row.data, id: row.id, updatedAt: row.updatedAt };
    if (row.table !== 'users') values.deletedAt = row.deletedAt; // soft delete travels as an ordinary column write

    await writeRow(row.table, row.id, existing !== undefined, values);
  }
}

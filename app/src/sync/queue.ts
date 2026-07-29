import { and, eq, isNotNull } from 'drizzle-orm';
import { getDrizzle } from '../db/client';
import { syncMeta } from '../db/schema';
import { isSyncTable, type SyncRow, type SyncTable } from './protocol';
import { readRow } from './tables';

/**
 * The push queue: which local rows have edits the server hasn't seen yet.
 * `sync_meta` also stores the watermark (below), under a table/row pair no
 * real sync table can produce, so the two concerns share a table without
 * colliding.
 */

const WATERMARK_TABLE = '__sync__';
const WATERMARK_ROW = 'watermark';

function metaKey(table: string, rowId: string) {
  return and(eq(syncMeta.tableName, table), eq(syncMeta.rowId, rowId));
}

/**
 * Records that a row needs pushing. Idempotent on purpose: a row edited
 * repeatedly before it ever gets a chance to sync (a set corrected three
 * times in a row) must keep its ORIGINAL `pendingSince`, not the latest edit
 * time — resetting it on every edit would let a constantly-touched row look
 * perpetually fresh and never reach the front of any age-ordered retry.
 */
export async function markPending(table: SyncTable, rowId: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  const existing = await db.select().from(syncMeta).where(metaKey(table, rowId)).get();
  if (existing?.pendingSince) return; // already queued — leave it alone

  if (existing) {
    await db.update(syncMeta).set({ pendingSince: now.toISOString() }).where(metaKey(table, rowId)).run();
  } else {
    await db
      .insert(syncMeta)
      .values({ tableName: table, rowId, pendingSince: now.toISOString(), lastPushedAt: null })
      .run();
  }
}

/** Marks a row pushed: clears the pending flag and stamps when it happened. */
export async function clearPending(table: SyncTable, rowId: string, pushedAt: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  await db
    .update(syncMeta)
    .set({ pendingSince: null, lastPushedAt: pushedAt.toISOString() })
    .where(metaKey(table, rowId))
    .run();
}

/**
 * Every row queued for push, joined back to its real table so the caller
 * gets a full SyncRow rather than just the (table, id) pair.
 *
 * A queued row can have been hard-deleted since it was marked pending —
 * sync_meta doesn't cascade with the tables it tracks, and the app's own
 * delete paths soft-delete (deletedAt), but nothing stops a row from being
 * removed outright some other way. Such an entry has nothing left to push:
 * it's skipped, and the stale queue entry is cleared so it doesn't get
 * checked again on every future sync.
 */
export async function pendingRows(): Promise<SyncRow[]> {
  const db = getDrizzle();
  const queued = await db.select().from(syncMeta).where(isNotNull(syncMeta.pendingSince));
  const out: SyncRow[] = [];

  for (const q of queued) {
    if (!isSyncTable(q.tableName)) continue; // the watermark row never sets pendingSince, but guard anyway

    const row = await readRow(q.tableName, q.rowId);
    if (!row) {
      await clearPending(q.tableName, q.rowId, new Date());
      continue;
    }

    out.push({
      table: q.tableName,
      id: q.rowId,
      updatedAt: row.updatedAt as string,
      // `users` has no deletedAt column at all (protocol.ts) — it is never a
      // tombstone candidate, so it always reports not-deleted.
      deletedAt: q.tableName === 'users' ? null : ((row.deletedAt as string | null) ?? null),
      data: row,
    });
  }

  return out;
}

/**
 * The server sequence this device has already seen, or null before the first
 * sync. Stored under a reserved (table, row) pair in sync_meta so the watermark
 * needs no table of its own.
 *
 * A SEQUENCE, not a clock — see PushPullRequest.since in protocol.ts. An
 * earlier version stored the server's timestamp and filtered the pull against
 * `updated_at`, which is written by whichever device made the change: a phone
 * running slow stamped its rows in the past, the other device's watermark had
 * already moved beyond them, and those rows were never pulled at all.
 *
 * Held in the existing `lastPushedAt` TEXT column, so it comes back as a string
 * and is parsed here. A non-numeric value means a watermark written by the old
 * timestamp scheme; treating it as null re-pulls everything once, which is
 * correct and self-healing — the merge is idempotent, so a full re-pull costs
 * bandwidth and nothing else.
 */
export async function getWatermark(): Promise<number | null> {
  const db = getDrizzle();
  const row = await db.select().from(syncMeta).where(metaKey(WATERMARK_TABLE, WATERMARK_ROW)).get();
  if (row?.lastPushedAt == null) return null;
  const seq = Number(row.lastPushedAt);
  return Number.isFinite(seq) ? seq : null;
}

export async function setWatermark(serverSeq: number): Promise<void> {
  const db = getDrizzle();
  const value = String(serverSeq);
  const existing = await db.select().from(syncMeta).where(metaKey(WATERMARK_TABLE, WATERMARK_ROW)).get();
  if (existing) {
    await db.update(syncMeta).set({ lastPushedAt: value }).where(metaKey(WATERMARK_TABLE, WATERMARK_ROW)).run();
  } else {
    await db
      .insert(syncMeta)
      .values({ tableName: WATERMARK_TABLE, rowId: WATERMARK_ROW, pendingSince: null, lastPushedAt: value })
      .run();
  }
}

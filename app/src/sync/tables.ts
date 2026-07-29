import { eq } from 'drizzle-orm';
import { getDrizzle } from '../db/client';
import { users, workouts, sets, weights, adviceEvents, foodLogEntries } from '../db/schema';
import type { SyncTable } from './protocol';

/**
 * One place mapping the wire's table name to the local drizzle table.
 * queue.ts and merge.ts both need to treat a sync table generically —
 * without this they'd each grow their own switch over SYNC_TABLES, and the
 * two would drift the day a table is added or renamed.
 */
export const TABLES = {
  users,
  workouts,
  sets,
  weights,
  advice_events: adviceEvents,
  food_log_entries: foodLogEntries,
} satisfies Record<SyncTable, unknown>;

/**
 * Reads one row by id, in the shape SyncRow.data expects — camelCase, as the
 * schema spells it. Every synced table keys on `id`, so this one function
 * covers all six.
 *
 * The `any` casts are contained to this file: drizzle types each table with
 * its own distinct row shape, and this module's whole job is treating six of
 * them uniformly, which TS has no shared interface for (the schema doesn't
 * export one, and inventing one for a six-line helper would be the
 * speculative abstraction the codebase avoids elsewhere).
 */
export async function readRow(table: SyncTable, id: string): Promise<Record<string, unknown> | undefined> {
  const db = getDrizzle();
  const t = TABLES[table] as any;
  return db.select().from(t).where(eq(t.id, id)).get();
}

/** Inserts when the row doesn't exist locally yet, updates when it does. */
export async function writeRow(
  table: SyncTable,
  id: string,
  exists: boolean,
  values: Record<string, unknown>,
): Promise<void> {
  const db = getDrizzle();
  const t = TABLES[table] as any;
  if (exists) {
    await db.update(t).set(values).where(eq(t.id, id)).run();
  } else {
    await db.insert(t).values(values).run();
  }
}

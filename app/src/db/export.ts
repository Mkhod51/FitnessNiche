import { getDrizzle } from './client';
import { users, workouts, sets, weights, foodLogEntries, adviceEvents } from './schema';

/**
 * GR-5 / NFR-4: health data is special-category under UK GDPR, and the data
 * subject's rights to export and to erasure are obligations rather than
 * features. Both live here so a screen cannot half-implement either.
 */

/** Everything this install holds about the person, in one object. */
export async function exportEverything(): Promise<Record<string, unknown[]>> {
  const db = getDrizzle();
  // Exercises are deliberately excluded: they are catalogue data shipped with
  // the app, not anything the user told us. Including them would pad an export
  // people may need to read.
  const [u, w, s, wt, food, advice] = await Promise.all([
    db.select().from(users),
    db.select().from(workouts),
    db.select().from(sets),
    db.select().from(weights),
    db.select().from(foodLogEntries),
    db.select().from(adviceEvents),
  ]);
  return { users: u, workouts: w, sets: s, weights: wt, foodLogEntries: food, adviceEvents: advice };
}

/**
 * A stable, readable filename — dated, so successive exports do not overwrite.
 *
 * Built from LOCAL date parts, not `toISOString().slice(0, 10)`. That slice is
 * UTC, so an export taken at 00:30 in BST would be stamped with the previous
 * day — the file would disagree with the day the person remembers asking for it.
 */
export function exportFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `myostat-export-${y}-${m}-${d}.json`;
}

/**
 * Erasure, and it means erasure.
 *
 * Everything else in this app soft-deletes, because sync is append-log with
 * last-write-wins and a hard delete has nothing to replicate. This is the one
 * place that rule is wrong: a right-to-erasure request answered with
 * `deleted_at = now` has not erased anything, and would resurrect on the next
 * pull from any device that still held the rows.
 *
 * The user row is recreated empty rather than dropped, so the app still boots
 * into a usable state — with consent cleared, which means logging is gated
 * again exactly as it is on a fresh install.
 */
export async function deleteEverything(now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  await db.delete(sets).run();
  await db.delete(workouts).run();
  await db.delete(weights).run();
  await db.delete(foodLogEntries).run();
  await db.delete(adviceEvents).run();
  await db.delete(users).run();

  const { LOCAL_USER_ID } = await import('./user');
  await db.insert(users).values({ id: LOCAL_USER_ID, updatedAt: now.toISOString() }).run();
}

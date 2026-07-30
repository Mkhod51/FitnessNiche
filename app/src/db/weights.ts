import { and, asc, eq, isNull } from 'drizzle-orm';
import { getDrizzle } from './client';
import { weights } from './schema';
import { LOCAL_USER_ID } from './user';
import { newId } from './id';
import { markPending } from '../sync/queue';

export type WeightReading = typeof weights.$inferSelect;

/** FR-LOG-4/NFR-1: writes straight to sqlite, same pattern as logSet. */
export async function logWeight(valueKg: number, now: Date = new Date()): Promise<WeightReading> {
  const db = getDrizzle();
  const id = newId();
  const nowIso = now.toISOString();

  await db
    .insert(weights)
    .values({ id, userId: LOCAL_USER_ID, valueKg, measuredAt: nowIso, updatedAt: nowIso })
    .run();

  const created = await db.select().from(weights).where(eq(weights.id, id)).get();
  if (!created) throw new Error('failed to create weight row');
  await markPending('weights', id, now);
  return created;
}

/** Oldest first, so trend smoothing (trends.ts's ewma) can consume it directly. */
export async function getWeightHistory(): Promise<WeightReading[]> {
  const db = getDrizzle();
  return db
    .select()
    .from(weights)
    .where(and(eq(weights.userId, LOCAL_USER_ID), isNull(weights.deletedAt)))
    .orderBy(asc(weights.measuredAt));
}

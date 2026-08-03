import { and, desc, eq, gte, isNull, isNotNull } from 'drizzle-orm';
import { getDrizzle } from './client';
import { adviceEvents } from './schema';
import { LOCAL_USER_ID } from './user';
import { newId } from './id';

export type AdviceEvent = typeof adviceEvents.$inferSelect;

/**
 * How long a claim stays quiet after it has been shown.
 *
 * Seven days because that is the cadence of the data that earns it — weekly
 * volume does not change between Tuesday and Wednesday, so showing the same
 * claim on both is noise dressed as insight. An advice surface that repeats
 * gets switched off, and a switched-off differentiator is no differentiator.
 */
export const COOLDOWN_DAYS = 7;

/** DM-ADVICE-EVENT: every shown advice traces to a claim. */
export async function recordAdviceShown(
  claimId: string,
  trigger: 'rule' | 'query' | 'data-earned',
  workoutId: string | null,
  now: Date = new Date(),
): Promise<AdviceEvent> {
  const db = getDrizzle();
  const id = newId();
  const nowIso = now.toISOString();
  await db
    .insert(adviceEvents)
    .values({
      id,
      userId: LOCAL_USER_ID,
      claimId,
      trigger,
      workoutId,
      shownAt: nowIso,
      updatedAt: nowIso,
    })
    .run();
  const created = await db.select().from(adviceEvents).where(eq(adviceEvents.id, id)).get();
  if (!created) throw new Error('failed to record advice event');
  return created;
}

/** "Don't show this again" — permanent, and reachable without a settings trip. */
export async function suppressClaim(claimId: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  const nowIso = now.toISOString();
  await db
    .update(adviceEvents)
    .set({ suppressedAt: nowIso, updatedAt: nowIso })
    .where(and(eq(adviceEvents.claimId, claimId), isNull(adviceEvents.deletedAt)))
    .run();
}

/** Claims the user has permanently silenced. */
export async function suppressedClaimIds(): Promise<string[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ claimId: adviceEvents.claimId })
    .from(adviceEvents)
    .where(and(isNull(adviceEvents.deletedAt), isNotNull(adviceEvents.suppressedAt)));
  return [...new Set(rows.map((r) => r.claimId))];
}

/** Claims shown recently enough to still be cooling down. */
export async function recentlyShownClaimIds(now: Date = new Date()): Promise<string[]> {
  const since = new Date(now.getTime() - COOLDOWN_DAYS * 86_400_000).toISOString();
  const db = getDrizzle();
  const rows = await db
    .select({ claimId: adviceEvents.claimId })
    .from(adviceEvents)
    .where(and(isNull(adviceEvents.deletedAt), gte(adviceEvents.shownAt, since)));
  return [...new Set(rows.map((r) => r.claimId))];
}

/** Whether anything has already been shown inside this session. */
export async function shownInWorkout(workoutId: string): Promise<boolean> {
  const db = getDrizzle();
  const row = await db
    .select({ id: adviceEvents.id })
    .from(adviceEvents)
    .where(and(eq(adviceEvents.workoutId, workoutId), isNull(adviceEvents.deletedAt)))
    .orderBy(desc(adviceEvents.shownAt))
    .limit(1)
    .get();
  return row !== undefined;
}

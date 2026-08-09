import { and, eq, gte, isNull, lt, desc } from 'drizzle-orm';
import { getDrizzle } from './client';
import { foodLogEntries } from './schema';
import { LOCAL_USER_ID } from './user';
import { newId } from './id';
import { markPending } from '../sync/queue';

export type FoodEntry = typeof foodLogEntries.$inferSelect;
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type FoodEntryInput = {
  name: string;
  mealSlot: MealSlot;
  kcal: number;
  proteinG: number;
  carbsG?: number | null;
  fatG?: number | null;
  /** Null for a quick-add — FR-LOG-3 makes that path first-class, not degraded. */
  foodItemId?: string | null;
  quantityGrams?: number | null;
  /** What the user actually entered: "2 palms", "180 g". Never back-converted. */
  quantityLabel?: string | null;
};

/**
 * Local-day bounds as ISO strings.
 *
 * A food day is a *local* day — you eat breakfast at 8am wherever you are, not
 * at 8am UTC. Comparing ISO strings works because `toISOString` is fixed-width
 * and lexicographic order matches chronological order.
 */
export function localDayBounds(day: Date): { start: string; end: string } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * FR-LOG-4/NFR-1: straight to sqlite, durable the instant it resolves. No save
 * button, nothing queued in React state waiting to be lost.
 */
export async function logFood(input: FoodEntryInput, now: Date = new Date()): Promise<FoodEntry> {
  const db = getDrizzle();
  const id = newId();
  const nowIso = now.toISOString();

  await db
    .insert(foodLogEntries)
    .values({
      id,
      userId: LOCAL_USER_ID,
      foodItemId: input.foodItemId ?? null,
      name: input.name,
      mealSlot: input.mealSlot,
      quantityGrams: input.quantityGrams ?? null,
      quantityLabel: input.quantityLabel ?? null,
      kcal: input.kcal,
      proteinG: input.proteinG,
      carbsG: input.carbsG ?? null,
      fatG: input.fatG ?? null,
      loggedAt: nowIso,
      updatedAt: nowIso,
    })
    .run();

  const created = await db.select().from(foodLogEntries).where(eq(foodLogEntries.id, id)).get();
  if (!created) throw new Error('failed to create food log entry');
  await markPending('food_log_entries', id, now);
  return created;
}

/** Everything logged on one local day, oldest first so meals read in order. */
export async function getEntriesForDay(day: Date = new Date()): Promise<FoodEntry[]> {
  const { start, end } = localDayBounds(day);
  const db = getDrizzle();
  return db
    .select()
    .from(foodLogEntries)
    .where(
      and(
        eq(foodLogEntries.userId, LOCAL_USER_ID),
        isNull(foodLogEntries.deletedAt),
        gte(foodLogEntries.loggedAt, start),
        lt(foodLogEntries.loggedAt, end),
      ),
    )
    .orderBy(foodLogEntries.loggedAt);
}

/**
 * Soft delete, like every other user row here — the sync layer is append-log
 * with last-write-wins, and a hard delete has nothing to replicate.
 */
export async function deleteFoodEntry(id: string, now: Date = new Date()): Promise<void> {
  const db = getDrizzle();
  const nowIso = now.toISOString();
  await db
    .update(foodLogEntries)
    .set({ deletedAt: nowIso, updatedAt: nowIso })
    .where(eq(foodLogEntries.id, id))
    .run();
  await markPending('food_log_entries', id, now);
}

/** Entries across a window, newest first — the 7-day average the day view leans on. */
export async function getEntriesSince(sinceIso: string): Promise<FoodEntry[]> {
  const db = getDrizzle();
  return db
    .select()
    .from(foodLogEntries)
    .where(
      and(
        eq(foodLogEntries.userId, LOCAL_USER_ID),
        isNull(foodLogEntries.deletedAt),
        gte(foodLogEntries.loggedAt, sinceIso),
      ),
    )
    .orderBy(desc(foodLogEntries.loggedAt));
}

/** Whether any non-deleted food row exists, regardless of the advice window. */
export async function hasFoodEntries(): Promise<boolean> {
  const db = getDrizzle();
  const row = await db
    .select({ id: foodLogEntries.id })
    .from(foodLogEntries)
    .where(and(eq(foodLogEntries.userId, LOCAL_USER_ID), isNull(foodLogEntries.deletedAt)))
    .limit(1)
    .get();
  return row !== undefined;
}

export type DayTotals = { kcal: number; proteinG: number; carbsG: number; fatG: number };

/** Pure. Missing carbs/fat count as zero rather than poisoning the sum with NaN. */
export function totalsOf(entries: FoodEntry[]): DayTotals {
  return entries.reduce<DayTotals>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + (e.carbsG ?? 0),
      fatG: acc.fatG + (e.fatG ?? 0),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/**
 * The average of the days that were actually logged, not of the calendar window.
 *
 * Dividing by 7 when only three days were logged reports a deficit nobody ate,
 * and the whole reason the 7-day figure leads the day view is that a single
 * day's intake carries 12–54% self-report error. Averaging in silent zeroes
 * would be a worse number wearing a more confident label (T3).
 */
export function averageKcalPerLoggedDay(entries: FoodEntry[]): { kcal: number; days: number } | null {
  if (entries.length === 0) return null;
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.loggedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    byDay.set(key, (byDay.get(key) ?? 0) + e.kcal);
  }
  const days = byDay.size;
  const total = [...byDay.values()].reduce((a, b) => a + b, 0);
  return { kcal: Math.round(total / days), days };
}

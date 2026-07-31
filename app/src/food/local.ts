import { and, eq, like, isNull, isNotNull, desc } from 'drizzle-orm';
import { getDrizzle } from '../db/client';
import { foodItems, foodLogEntries } from '../db/schema';
import { newId } from '../db/id';
import { LOCAL_USER_ID } from '../db/user';
import type { FoodItem, FoodItemDraft } from './types';

export async function saveFoodItem(draft: FoodItemDraft, now: Date = new Date()): Promise<FoodItem> {
  if (!Number.isFinite(draft.carbsGPer100g) || !Number.isFinite(draft.fatGPer100g)) {
    throw new Error('OFF foods need complete carbs and fat values before they can be saved');
  }
  const db = getDrizzle();
  const at = now.toISOString();
  const cols = {
    name: draft.name,
    brand: draft.brand ?? null,
    kcalPer100g: draft.kcalPer100g,
    proteinGPer100g: draft.proteinGPer100g,
    carbsGPer100g: draft.carbsGPer100g,
    fatGPer100g: draft.fatGPer100g,
    fibreGPer100g: draft.fibreGPer100g ?? null,
    servingGrams: draft.servingGrams ?? null,
    servingLabel: draft.servingLabel ?? null,
  };
  if (draft.barcode) {
    const existing = await db.select().from(foodItems).where(eq(foodItems.barcode, draft.barcode)).get();
    if (existing) {
      await db.update(foodItems).set({ ...cols, updatedAt: at }).where(eq(foodItems.id, existing.id)).run();
      return (await db.select().from(foodItems).where(eq(foodItems.id, existing.id)).get())!;
    }
  }
  const id = newId();
  await db.insert(foodItems).values({ id, source: 'off', ...cols, barcode: draft.barcode ?? null, updatedAt: at }).run();
  return (await db.select().from(foodItems).where(eq(foodItems.id, id)).get())!;
}

export async function searchFoodLocal(q: string, limit = 20): Promise<FoodItem[]> {
  const db = getDrizzle();
  const term = q.trim();
  if (!term) return [];
  return db.select().from(foodItems).where(like(foodItems.name, `%${term}%`)).limit(limit);
}

export async function getRecentFoods(limit = 6): Promise<FoodItem[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ item: foodItems })
    .from(foodLogEntries)
    .innerJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
    .where(and(eq(foodLogEntries.userId, LOCAL_USER_ID), isNull(foodLogEntries.deletedAt), isNotNull(foodLogEntries.foodItemId)))
    .orderBy(desc(foodLogEntries.loggedAt))
    .limit(limit * 3);
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const r of rows) {
    if (seen.has(r.item.id)) continue;
    seen.add(r.item.id);
    out.push(r.item);
    if (out.length === limit) break;
  }
  return out;
}

export async function getCommonFoods(limit = 12): Promise<FoodItem[]> {
  const db = getDrizzle();
  return db.select().from(foodItems).where(eq(foodItems.source, 'cofid')).orderBy(foodItems.name).limit(limit);
}

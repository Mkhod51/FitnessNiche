import { SEED_EXERCISES } from './seed-exercises';
import { SEED_FOODS } from './seed-foods';
import type { Exec } from './migrate';

const FOOD_SEED_AT = '2026-07-30T00:00:00.000Z';

export async function seedExercises(exec: Exec): Promise<number> {
  const rows = await exec('select count(*) from exercises', [], 'all');
  // Gate on "already complete", not "already started" — an interrupted first
  // boot (OPFS quota, worker killed, tab closed mid-insert) must not look
  // done just because some rows made it in. `insert or replace` below makes
  // re-running this over a partial table a repair, not a duplicate-key crash.
  if (Number(rows[0]?.[0] ?? 0) === SEED_EXERCISES.length) return 0;

  await exec('begin', [], 'run');
  try {
    for (const e of SEED_EXERCISES) {
      await exec(
        'insert or replace into exercises (id, name, modality, is_compound, contributions) values (?, ?, ?, ?, ?)',
        [e.id, e.name, e.modality, e.isCompound ? 1 : 0, JSON.stringify(e.contributions)],
        'run',
      );
    }
    await exec('commit', [], 'run');
  } catch (err) {
    // sqlite auto-rolls-back on some errors (SQLITE_FULL/IOERR/BUSY), which
    // makes a follow-up `rollback` throw "no transaction is active" — swallow
    // that so the real error from the loop above is what the caller sees.
    try {
      await exec('rollback', [], 'run');
    } catch {
      /* no-op: transaction was already rolled back by sqlite itself */
    }
    throw err;
  }
  return SEED_EXERCISES.length;
}

// Idempotent CoFID seed. Gate on the CoFID row count rather than the whole
// table: cached OFF rows are device-local reference data and must survive.
export async function seedFoods(exec: Exec): Promise<number> {
  const present = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
  if (Number(present[0]?.[0] ?? 0) === SEED_FOODS.length) return 0;

  await exec('begin', [], 'run');
  try {
    for (const food of SEED_FOODS) {
      await exec(
        `insert or replace into food_items (id, source, name, brand, barcode, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fibre_g_per_100g, serving_grams, serving_label, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          food.id,
          'cofid',
          food.name,
          null,
          null,
          food.kcalPer100g,
          food.proteinGPer100g,
          food.carbsGPer100g,
          food.fatGPer100g,
          food.fibreGPer100g ?? null,
          food.servingGrams ?? null,
          food.servingLabel ?? null,
          FOOD_SEED_AT,
        ],
        'run',
      );
    }
    await exec('commit', [], 'run');
  } catch (err) {
    try {
      await exec('rollback', [], 'run');
    } catch {
      /* sqlite already rolled back */
    }
    throw err;
  }
  return SEED_FOODS.length;
}

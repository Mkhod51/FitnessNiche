import { beforeEach, describe, expect, it } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { BindingSpec, Database } from '@sqlite.org/sqlite-wasm';
import { seedFoods } from './seed';
import { SEED_FOODS } from './seed-foods';
import { runMigrations, type Exec } from './migrate';

async function makeRealExec(): Promise<Exec> {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  return async (sql, params = [], _method) => (
    db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' }) ?? []
  ) as unknown[][];
}

describe('seedFoods', () => {
  let exec: Exec;

  beforeEach(async () => {
    exec = await makeRealExec();
    await runMigrations(exec);
  });

  it('seeds every curated food on a fresh database', async () => {
    expect(await seedFoods(exec)).toBe(SEED_FOODS.length);
    const rows = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
    expect(Number(rows[0][0])).toBe(SEED_FOODS.length);
  });

  it('does nothing when the CoFID seed is already complete', async () => {
    await seedFoods(exec);
    expect(await seedFoods(exec)).toBe(0);
  });

  it('repairs a half-seeded table left by an interrupted first boot', async () => {
    await seedFoods(exec);
    await exec('delete from food_items where id = ?', [SEED_FOODS[0].id], 'run');

    expect(await seedFoods(exec)).toBe(SEED_FOODS.length);
    const rows = await exec("select count(*) from food_items where source = 'cofid'", [], 'all');
    expect(Number(rows[0][0])).toBe(SEED_FOODS.length);
  });

  it('leaves cached OFF rows untouched', async () => {
    await exec(
      "insert into food_items (id, source, name, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, updated_at) values ('x', 'off', 'Skyr', 62, 11, 4, 0.2, '2026-07-30T00:00:00.000Z')",
      [],
      'run',
    );

    await seedFoods(exec);

    const off = await exec("select count(*) from food_items where source = 'off'", [], 'all');
    expect(Number(off[0][0])).toBe(1);
  });
});

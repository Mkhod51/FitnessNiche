import { describe, it, expect, beforeEach } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { seedExercises } from './seed';
import { SEED_EXERCISES } from './seed-exercises';
import { runMigrations, type Exec } from './migrate';

// Real sqlite engine, not a hand-rolled fake — `begin`/`commit`/`rollback`
// and `insert or replace` need real transaction semantics to prove anything
// (see drizzle-contract.test.ts for the same pattern).
async function makeRealExec(): Promise<Exec> {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  return async (sql, params = [], _method) => {
    const rows = db.exec({ sql, bind: params as BindingSpec, rowMode: 'array', returnValue: 'resultRows' });
    return (rows ?? []) as unknown[][];
  };
}

describe('seedExercises', () => {
  let exec: Exec;

  beforeEach(async () => {
    exec = await makeRealExec();
    await runMigrations(exec);
  });

  it('inserts every seed exercise on a fresh database', async () => {
    const n = await seedExercises(exec);
    expect(n).toBe(SEED_EXERCISES.length);
    const rows = await exec('select count(*) from exercises', [], 'all');
    expect(Number(rows[0][0])).toBe(SEED_EXERCISES.length);
  });

  it('does nothing when exercises are already present', async () => {
    await seedExercises(exec);
    const second = await seedExercises(exec);
    expect(second).toBe(0);
  });

  it('stores contributions as json', async () => {
    await seedExercises(exec);
    const rows = await exec('select contributions from exercises where id = ?', [SEED_EXERCISES[0].id], 'all');
    expect(() => JSON.parse(String(rows[0][0]))).not.toThrow();
  });

  it('repairs a half-seeded table left behind by an interrupted first boot', async () => {
    await seedExercises(exec);

    // Simulate insert #31 never happening: delete a few rows to leave a
    // table that's non-empty but incomplete, the state a killed tab/worker
    // or an OPFS quota error would leave behind.
    await exec(
      'delete from exercises where id in (?, ?, ?)',
      [SEED_EXERCISES[0].id, SEED_EXERCISES[10].id, SEED_EXERCISES[SEED_EXERCISES.length - 1].id],
      'run',
    );
    const partial = await exec('select count(*) from exercises', [], 'all');
    expect(Number(partial[0][0])).toBe(SEED_EXERCISES.length - 3);

    const repaired = await seedExercises(exec);
    expect(repaired).toBe(SEED_EXERCISES.length);

    const whole = await exec('select count(*) from exercises', [], 'all');
    expect(Number(whole[0][0])).toBe(SEED_EXERCISES.length);
  });
});

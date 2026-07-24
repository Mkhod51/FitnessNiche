import { describe, it, expect } from 'vitest';
import { seedExercises } from './seed';
import { SEED_EXERCISES } from './seed-exercises';

function fakeExec() {
  const rows: unknown[][] = [];
  const exec = async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith('select count(*) from exercises')) return [[rows.length]];
    if (sql.startsWith('insert into exercises')) { rows.push(params); return []; }
    return [];
  };
  return { exec, rows };
}

describe('seedExercises', () => {
  it('inserts every seed exercise on a fresh database', async () => {
    const f = fakeExec();
    const n = await seedExercises(f.exec);
    expect(n).toBe(SEED_EXERCISES.length);
    expect(f.rows.length).toBe(SEED_EXERCISES.length);
  });

  it('does nothing when exercises are already present', async () => {
    const f = fakeExec();
    await seedExercises(f.exec);
    const second = await seedExercises(f.exec);
    expect(second).toBe(0);
  });

  it('stores contributions as json', async () => {
    const f = fakeExec();
    await seedExercises(f.exec);
    const contributions = f.rows[0][4];
    expect(() => JSON.parse(String(contributions))).not.toThrow();
  });
});

import { SEED_EXERCISES } from './seed-exercises';
import type { Exec } from './migrate';

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

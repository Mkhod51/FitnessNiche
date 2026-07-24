import { SEED_EXERCISES } from './seed-exercises';
import type { Exec } from './migrate';

export async function seedExercises(exec: Exec): Promise<number> {
  const rows = await exec('select count(*) from exercises', [], 'all');
  if (Number(rows[0]?.[0] ?? 0) > 0) return 0;

  for (const e of SEED_EXERCISES) {
    await exec(
      'insert into exercises (id, name, modality, is_compound, contributions) values (?, ?, ?, ?, ?)',
      [e.id, e.name, e.modality, e.isCompound ? 1 : 0, JSON.stringify(e.contributions)],
      'run',
    );
  }
  return SEED_EXERCISES.length;
}

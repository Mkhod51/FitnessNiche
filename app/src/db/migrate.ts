import initSql from './migrations/0001_init.sql?raw';

type Exec = (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]>;

const MIGRATIONS: { name: string; sql: string }[] = [{ name: '0001_init', sql: initSql }];

// Execution order is array order — a migration appended out of sequence, or
// a duplicated name, must fail loudly at load time rather than surface as a
// production UNIQUE constraint crash on the second insert.
export function assertMigrationOrder(migrations: { name: string }[]): void {
  for (let i = 1; i < migrations.length; i++) {
    if (migrations[i].name <= migrations[i - 1].name) {
      throw new Error(
        `migrations must be unique and in ascending order: "${migrations[i].name}" does not come after "${migrations[i - 1].name}"`,
      );
    }
  }
}
assertMigrationOrder(MIGRATIONS);

export async function runMigrations(exec: Exec): Promise<string[]> {
  await exec('create table if not exists _migrations (name text primary key, applied_at text not null)', [], 'run');
  const rows = await exec('select name from _migrations', [], 'all');
  const already = new Set(rows.map((r) => String(r[0])));
  const applied: string[] = [];

  for (const m of MIGRATIONS) {
    if (already.has(m.name)) continue;
    await exec('begin', [], 'run');
    try {
      await exec(m.sql, [], 'run');
      await exec('insert into _migrations (name, applied_at) values (?, ?)', [m.name, new Date().toISOString()], 'run');
      await exec('commit', [], 'run');
    } catch (err) {
      await exec('rollback', [], 'run');
      throw err;
    }
    applied.push(m.name);
  }
  return applied;
}

import initSql from './migrations/0001_init.sql?raw';

type Exec = (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]>;

const MIGRATIONS: { name: string; sql: string }[] = [{ name: '0001_init', sql: initSql }];

export async function runMigrations(exec: Exec): Promise<string[]> {
  await exec('create table if not exists _migrations (name text primary key, applied_at text not null)', [], 'run');
  const rows = await exec('select name from _migrations', [], 'all');
  const already = new Set(rows.map((r) => String(r[0])));
  const applied: string[] = [];

  for (const m of MIGRATIONS) {
    if (already.has(m.name)) continue;
    for (const stmt of m.sql.split(';').map((s) => s.trim()).filter(Boolean)) {
      await exec(stmt, [], 'run');
    }
    await exec('insert into _migrations (name, applied_at) values (?, ?)', [m.name, new Date().toISOString()], 'run');
    applied.push(m.name);
  }
  return applied;
}

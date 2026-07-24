import { describe, it, expect } from 'vitest';
import { runMigrations } from './migrate';

function fakeExec() {
  const applied: string[] = [];
  const statements: string[] = [];
  const exec = async (sql: string, params: unknown[] = [], _m?: string) => {
    statements.push(sql);
    if (sql.includes('select name from _migrations')) return applied.map((n) => [n]);
    if (sql.startsWith('insert into _migrations')) { applied.push(String(params[0])); return []; }
    return [];
  };
  return { exec, statements, applied };
}

describe('runMigrations', () => {
  it('applies pending migrations and records them', async () => {
    const f = fakeExec();
    const done = await runMigrations(f.exec);
    expect(done).toContain('0001_init');
    expect(f.applied).toContain('0001_init');
    expect(f.statements.some((s) => s.includes('create table if not exists sets'))).toBe(true);
  });

  it('is idempotent — a second run applies nothing', async () => {
    const f = fakeExec();
    await runMigrations(f.exec);
    const second = await runMigrations(f.exec);
    expect(second).toEqual([]);
  });
});

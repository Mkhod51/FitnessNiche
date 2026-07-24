import { describe, it, expect } from 'vitest';
import { runMigrations, assertMigrationOrder } from './migrate';

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

  it('rolls back and does not record a migration that fails mid-way', async () => {
    const applied: string[] = [];
    const statements: string[] = [];
    const exec = async (sql: string, params: unknown[] = []) => {
      statements.push(sql);
      if (sql.includes('select name from _migrations')) return applied.map((n) => [n]);
      if (sql.startsWith('insert into _migrations')) { applied.push(String(params[0])); return []; }
      if (sql.includes('create table if not exists users')) throw new Error('boom');
      return [];
    };

    await expect(runMigrations(exec)).rejects.toThrow('boom');
    expect(applied).toEqual([]);
    expect(statements).toContain('begin');
    expect(statements).toContain('rollback');
    expect(statements.some((s) => s.startsWith('insert into _migrations'))).toBe(false);
  });

  it('surfaces the original migration error even when the rollback itself throws', async () => {
    // Mirrors sqlite auto-rolling-back on SQLITE_FULL/IOERR/BUSY: by the time
    // our catch block calls `rollback`, there's no transaction left, so
    // `rollback` itself throws "cannot rollback - no transaction is active".
    const applied: string[] = [];
    const exec = async (sql: string, params: unknown[] = []) => {
      if (sql.includes('select name from _migrations')) return applied.map((n) => [n]);
      if (sql.startsWith('insert into _migrations')) { applied.push(String(params[0])); return []; }
      if (sql.includes('create table if not exists users')) throw new Error('database or disk is full');
      if (sql === 'rollback') throw new Error('cannot rollback - no transaction is active');
      return [];
    };

    await expect(runMigrations(exec)).rejects.toThrow('database or disk is full');
  });
});

describe('assertMigrationOrder', () => {
  it('accepts unique, ascending names', () => {
    expect(() => assertMigrationOrder([{ name: '0001_init' }, { name: '0002_add_thing' }])).not.toThrow();
  });

  it('rejects a duplicated name', () => {
    expect(() => assertMigrationOrder([{ name: '0001_init' }, { name: '0001_init' }])).toThrow(/ascending/);
  });

  it('rejects an out-of-order name', () => {
    expect(() => assertMigrationOrder([{ name: '0002_add_thing' }, { name: '0001_init' }])).toThrow(/ascending/);
  });
});

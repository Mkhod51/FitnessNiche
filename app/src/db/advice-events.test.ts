import { beforeEach, describe, expect, it, vi } from 'vitest';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { BindingSpec, Database } from '@sqlite.org/sqlite-wasm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { makeProxyCallback, type ExecWithChanges } from './client';
import { runMigrations, type Exec } from './migrate';
import * as schema from './schema';
import adviceSurfaceSql from './migrations/0006_advice_surface.sql?raw';

let testDz: ReturnType<typeof drizzle>;

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, getDrizzle: () => testDz };
});

vi.mock('../sync/queue', () => ({ markPending: vi.fn() }));

async function makeTestDb() {
  const sqlite3 = await sqlite3InitModule();
  const db: Database = new sqlite3.oo1.DB(':memory:');
  const exec: ExecWithChanges = async (sql, params = []) => {
    const rows = (db.exec({
      sql,
      bind: params as BindingSpec,
      rowMode: 'array',
      returnValue: 'resultRows',
    }) ?? []) as unknown[][];
    return { rows, changes: db.changes() as number };
  };
  const execRows: Exec = async (sql, params, method) => (
    await exec(sql, params ?? [], method ?? 'all')
  ).rows;
  await runMigrations(execRows);
  return drizzle(makeProxyCallback(exec), { schema });
}

import { recordAdviceShown } from './advice-events';

const NOW = new Date('2026-08-02T10:00:00.000Z');

describe('advice event surface audit', () => {
  beforeEach(async () => {
    testDz = await makeTestDb();
  });

  it('round-trips an explicit surface and the general-evidence trigger', async () => {
    const event = await recordAdviceShown(
      'c-exercise-context',
      'surface-context',
      'workout-1',
      'exercise-selection',
      NOW,
    );

    expect(event).toMatchObject({
      claimId: 'c-exercise-context',
      trigger: 'surface-context',
      workoutId: 'workout-1',
      surface: 'exercise-selection',
    });
  });

  it('records the existing workout-opening lane as workout-start', async () => {
    const event = await recordAdviceShown(
      'c-session-claim',
      'rule',
      'workout-1',
      'workout-start',
      NOW,
    );

    expect(event.surface).toBe('workout-start');
  });

  it('rejects unknown as a surface for a new event', async () => {
    await expect(recordAdviceShown(
      'c-session-claim',
      'rule',
      null,
      'unknown' as never,
      NOW,
    )).rejects.toThrow(/surface/i);
  });

  it('rejects a surface outside the closed database set', async () => {
    await expect(testDz.insert(schema.adviceEvents).values({
      id: 'invalid-surface',
      userId: 'local-user',
      claimId: 'c-session-claim',
      trigger: 'rule',
      workoutId: null,
      surface: 'workout-finish' as never,
      shownAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    }).run()).rejects.toThrow();
  });

  it('backfills historical events to migration-only unknown', async () => {
    const sqlite3 = await sqlite3InitModule();
    const db: Database = new sqlite3.oo1.DB(':memory:');
    db.exec(`
      create table advice_events (
        id text primary key,
        user_id text not null,
        claim_id text not null,
        trigger text not null,
        workout_id text,
        shown_at text not null,
        dismissed_at text,
        suppressed_at text,
        updated_at text not null,
        deleted_at text
      );
      insert into advice_events (
        id, user_id, claim_id, trigger, shown_at, updated_at
      ) values (
        'historical', 'local-user', 'c-old', 'rule',
        '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z'
      );
    `);

    db.exec(adviceSurfaceSql);
    const rows = db.exec({
      sql: 'select surface from advice_events where id = ?',
      bind: ['historical'],
      rowMode: 'array',
      returnValue: 'resultRows',
    }) as unknown[][];

    expect(rows).toEqual([['unknown']]);
  });
});

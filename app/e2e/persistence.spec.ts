import { test, expect } from '@playwright/test';
import { SEED_EXERCISES } from '../src/db/seed-exercises';

// exercise-count isn't rendered anywhere on the advice feed — it carried no product
// meaning there — so this reads the same count through the window.__db e2e hatch
// client.ts installs when built with `--mode e2e` (see playwright.config.ts).
async function countExercises(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: { execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]> } }).__db;
    const rows = await execSql('select count(*) from exercises', [], 'all');
    return Number(rows[0]?.[0] ?? 0);
  });
}

test('database survives a hard reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  expect(await countExercises(page)).toBe(SEED_EXERCISES.length);

  await page.reload();
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  // Same count (not doubled) proves the data persisted AND seeding is idempotent.
  expect(await countExercises(page)).toBe(SEED_EXERCISES.length);
});

test('migrations create the expected tables', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  const tables = await page.evaluate(async () => {
    // Importing /src/db/client.ts directly from page.evaluate() doesn't work
    // against the built + previewed bundle (nothing serves raw /src
    // modules), so this reads through the e2e-only window.__db escape hatch
    // client.ts installs when built with `--mode e2e` (see playwright.config.ts).
    const { execSql } = (window as unknown as { __db: { execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]> } }).__db;
    const rows = await execSql("select name from sqlite_master where type='table' order by name", [], 'all');
    return rows.map((r: unknown[]) => String(r[0]));
  });
  expect(tables).toEqual(expect.arrayContaining(['_migrations', 'advice_events', 'exercises', 'sets', 'users', 'weights', 'workouts', 'sync_meta']));
});

test('migrations add the expected columns to workouts and sets', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  const { workoutCols, setCols } = await page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: { execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]> } }).__db;
    const workoutRows = await execSql('pragma table_info(workouts)', [], 'all');
    const setRows = await execSql('pragma table_info(sets)', [], 'all');
    // pragma table_info columns: cid, name, type, notnull, dflt_value, pk
    return {
      workoutCols: workoutRows.map((r: unknown[]) => String(r[1])),
      setCols: setRows.map((r: unknown[]) => String(r[1])),
    };
  });
  expect(workoutCols).toEqual(expect.arrayContaining(['name', 'finished_at']));
  expect(setCols).toEqual(expect.arrayContaining(['set_type']));
});

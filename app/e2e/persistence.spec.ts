import { test, expect } from '@playwright/test';

test('database survives a hard reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  await expect(page.getByTestId('boot-count')).toHaveText('1');

  await page.reload();
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  // If persistence works the count is 2; if the DB was memory-only it resets to 1.
  await expect(page.getByTestId('boot-count')).toHaveText('2');
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
  expect(tables).toEqual(expect.arrayContaining(['_migrations', 'exercises', 'sets', 'users', 'weights', 'workouts', 'sync_meta']));
});

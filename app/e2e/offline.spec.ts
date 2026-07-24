import { test, expect } from '@playwright/test';

test('the app boots and reads data with the network off', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  // wait for the service worker to take control, or the offline reload has nothing to serve.
  // truthy, not `!== null`: on a non-secure origin serviceWorker is undefined, which would
  // satisfy `!== null` and quietly turn this whole test into a no-op.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: /evidence/i })).toBeVisible();
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  await expect(page.getByTestId('exercise-count')).not.toHaveText('-');

  // M0's check is "reads/writes SQLite" with the network down, so prove the write half
  // too. No user-facing write path exists until M2, so this goes through the same
  // e2e-only window.__db hatch persistence.spec.ts uses.
  const written = await page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: { execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]> } }).__db;
    await execSql('insert or replace into sync_meta (table_name, row_id, pending_since) values (?, ?, ?)', ['offline-write-probe', '1', 'ok'], 'run');
    const rows = await execSql('select pending_since from sync_meta where table_name = ?', ['offline-write-probe'], 'all');
    return rows.map((r: unknown[]) => String(r[0]));
  });
  expect(written).toEqual(['ok']);

  await context.setOffline(false);
});

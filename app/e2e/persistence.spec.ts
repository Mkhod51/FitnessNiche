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

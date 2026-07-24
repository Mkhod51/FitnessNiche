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

  await context.setOffline(false);
});

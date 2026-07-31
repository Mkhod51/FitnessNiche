import { test, expect } from '@playwright/test';

/**
 * Deep-links straight to the logging route on a cold start, so the consent gate
 * is the first thing to touch the database.
 *
 * This exists because of a real bug: the gate called getUser() on mount, which
 * throws until the worker has booted, and the failure was caught into a
 * permanent "storage isn't reachable" screen. Failing closed was right; failing
 * closed forever on a startup race was not, and it was invisible to every test
 * we had — the unit tests stub the boot, and the other e2e specs reach /log by
 * loading / first, where App has already initialised the store.
 *
 * Only a cold navigation directly to /log reproduces it.
 */
test('the consent gate survives a cold start straight to the logging route', async ({ page }) => {
  await page.goto('/log');

  // The gate must ask for consent, not report the store as unreachable.
  await expect(page.getByTestId('consent-gate')).toBeVisible();
  await expect(page.getByTestId('consent-unavailable')).toHaveCount(0);

  // And it has to be usable, not merely visible — accepting opens the form.
  await page.getByTestId('consent-accept').click();
  await expect(page.getByTestId('log-set-button')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('the evidence base renders on the real built app, not a placeholder', async ({ page }) => {
  await page.goto('/');

  const claimEls = page.locator('[data-claim-id]');
  await expect(claimEls.first()).toBeVisible();
  const count = await claimEls.count();
  expect(count).toBeGreaterThanOrEqual(15);
  for (let i = 0; i < count; i++) {
    expect(await claimEls.nth(i).getAttribute('data-claim-id')).toBeTruthy();
  }

  await expect(page.getByTestId('no-user-data')).toBeVisible();

  // The D3 guard, end to end: confidence is part of the default state, not
  // something a tap has to reveal.
  const firstCard = page.getByTestId('claim-card').first();
  await expect(firstCard.getByTestId('confidence-ticks')).toBeVisible();
});

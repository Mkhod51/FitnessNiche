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

test('asking the evidence base a real question surfaces a real, cited claim', async ({ page }) => {
  await page.goto('/');

  const input = page.getByLabel(/what does the evidence say/i);
  await expect(input).toBeVisible();

  await input.fill('deloads');
  const searchSection = page.getByRole('region', { name: 'ask the evidence' });
  const resultCard = searchSection.getByTestId('claim-card');
  await expect(resultCard).toHaveCount(1);
  await expect(resultCard).toHaveAttribute('data-claim-id', 'c-deloads-not-evidence-backed');
  await expect(resultCard.getByTestId('confidence-ticks')).toBeVisible();

  // A query that matches nothing must never fabricate an answer.
  await input.fill('quantum flux capacitor recovery protocol');
  await expect(searchSection.getByTestId('no-match')).toBeVisible();
  await expect(searchSection.getByTestId('claim-card')).toHaveCount(0);
});

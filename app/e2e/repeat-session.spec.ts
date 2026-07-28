import { test, expect } from '@playwright/test';

/**
 * The full "pick up a previous session" loop, in a real browser against real
 * sqlite: log a session, finish it, then repeat it and get the same exercises
 * and the same sets back, pre-filled and unticked.
 *
 * This exists because the unit tests could not have caught the developer's
 * report that repeating "just doesn't" work. Those tests mock the data layer,
 * so a fault anywhere between the click and the database — a mis-wired id, a
 * state reset landing after the seed, a query returning nothing — passes them
 * happily. Only driving the real thing end to end proves it.
 */
test('repeating a session brings back its exercises and its sets, ready to work through', async ({ page }) => {
  await page.goto('/train');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');

  await page.getByTestId('consent-accept').click();

  // ---- session one: two sets on one exercise -------------------------------
  await page.getByTestId('start-workout-button').click();
  await page.getByTestId('add-exercise-button').click();
  await page.getByTestId('add-exercise-select').selectOption('barbell-bench-press');

  await page.getByTestId('weight-input').first().fill('100');
  await page.getByTestId('reps-input').first().fill('5');
  await page.getByTestId('tick-button').first().click();
  await expect(page.getByTestId('set-number')).toHaveCount(1);

  await page.getByTestId('weight-input').first().fill('102.5');
  await page.getByTestId('reps-input').first().fill('3');
  await page.getByTestId('tick-button').first().click();
  await expect(page.getByTestId('set-number')).toHaveCount(2);

  // ---- finish it, with a name so it is findable -----------------------------
  await page.getByTestId('finish-button').click();
  await page.getByTestId('workout-name-input').fill('Bench day');
  await page.getByTestId('confirm-finish-button').click();

  // ---- repeat it -----------------------------------------------------------
  const recent = page.getByTestId('recent-workout-row');
  await expect(recent).toHaveCount(1);
  await expect(recent).toContainText('Bench day');
  await recent.click();

  // The exercise came back...
  await expect(page.getByText('Barbell Bench Press')).toBeVisible();

  // ...and so did both sets, carrying what was actually lifted.
  const weights = page.getByTestId('weight-input');
  await expect(weights).toHaveCount(2);
  await expect(weights.nth(0)).toHaveValue('100');
  await expect(weights.nth(1)).toHaveValue('102.5');
  await expect(page.getByTestId('reps-input').nth(0)).toHaveValue('5');
  await expect(page.getByTestId('reps-input').nth(1)).toHaveValue('3');

  // Repeating logs nothing. You are about to do the workout, not copy the
  // record of it — the rows are open until you tick them.
  await expect(page.getByTestId('set-number')).toHaveCount(0);
});

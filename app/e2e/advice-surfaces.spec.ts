import { test, expect, type Page } from '@playwright/test';

type Db = {
  execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]>;
};

async function adviceRows(page: Page): Promise<unknown[][]> {
  return page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: Db }).__db;
    return execSql(
      'select claim_id, surface from advice_events where deleted_at is null order by shown_at',
      [],
      'all',
    );
  });
}

test('an empty Hub shows cited general evidence and persists its permanent suppression', async ({ page }) => {
  await page.goto('/');

  const lane = page.getByRole('region', { name: 'General evidence' });
  await expect(lane).toBeVisible();
  const card = lane.getByTestId('claim-card');
  await expect(card).toHaveAttribute('data-claim-id', 'c-mechanism-tension-motor-units');
  await expect(card.getByTestId('claim-source')).toBeVisible();
  await expect(lane).not.toContainText(/for you/i);

  await lane.getByRole('button', { name: /don.t show this again/i }).click();
  await expect(lane).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  await expect(page.getByRole('region', { name: 'General evidence' })).toHaveCount(0);
  expect(await adviceRows(page)).toEqual([
    ['c-mechanism-tension-motor-units', 'hub-empty'],
  ]);
});

test('only the first selected exercise can use the workout general-evidence budget', async ({ page }) => {
  await page.goto('/train');
  await page.getByTestId('consent-accept').click();
  await page.getByTestId('start-workout-button').click();
  await page.getByTestId('add-exercise-button').click();
  await page.getByTestId('exercise-row').filter({ hasText: 'Barbell Bench Press' }).first().click();

  const peek = page.getByTestId('advice-peek');
  await expect(peek).toContainText('General evidence');
  await expect(peek).not.toContainText(/for you/i);
  await page.getByTestId('advice-expand').click();
  await expect(peek.getByTestId('claim-card')).toHaveAttribute(
    'data-claim-id',
    'c-mechanism-tension-motor-units',
  );

  await page.getByTestId('advice-dismiss').click();
  await page.getByTestId('add-exercise-button').click();
  await page.getByTestId('exercise-row').filter({ hasText: 'Deadlift' }).first().click();

  await expect.poll(() => adviceRows(page)).toEqual([
    ['c-mechanism-tension-motor-units', 'exercise-selection'],
  ]);
});

test('a bulk draft can show cited general context before save and honor permanent suppression', async ({ page }) => {
  await page.goto('/goal');
  await page.getByTestId('consent-accept').click();
  await page.getByTestId('goal-bulk').click();

  const lane = page.getByRole('region', { name: 'General evidence' });
  await expect(lane).toBeVisible();
  await expect(lane.getByTestId('claim-card')).toHaveAttribute(
    'data-claim-id',
    'c-bulk-rate-surplus-unknown',
  );
  await expect(lane.getByTestId('claim-source')).toBeVisible();
  await expect(lane).not.toContainText(/for you/i);

  await lane.getByRole('button', { name: /don.t show this again/i }).click();
  await expect(lane).toHaveCount(0);
  await page.reload();
  await page.getByTestId('goal-bulk').click();
  await expect(page.getByRole('region', { name: 'General evidence' })).toHaveCount(0);
});

test('numbers-hidden remains an explicit, persisted preference while general evidence stays non-personal', async ({ page }) => {
  await page.goto('/settings');
  const toggle = page.getByTestId('numbers-hidden-toggle');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('link', { name: 'Hub' }).click();
  const lane = page.getByRole('region', { name: 'General evidence' });
  await expect(lane).toBeVisible();
  await expect(lane).not.toContainText(/for you/i);
});

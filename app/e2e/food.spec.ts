import { test, expect, type Locator, type Page } from '@playwright/test';

type E2eDb = {
  execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]>;
};

const COMMON_FOOD_NAME = 'Almonds';

async function openBreakfastPickerOffline(page: Page, context: import('@playwright/test').BrowserContext): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  await page.getByRole('link', { name: 'Eat' }).click();
  await page.getByTestId('consent-accept').click();
  await page.getByTestId('add-food-breakfast').click();
}

function commonFoodsSection(page: Page): Locator {
  return page.getByText('Common foods', { exact: true }).locator('xpath=../..');
}

async function logCommonFood(page: Page): Promise<void> {
  const commonFoods = commonFoodsSection(page);
  await expect(commonFoods.getByRole('button', { name: COMMON_FOOD_NAME })).toBeVisible();
  await commonFoods.getByRole('button', { name: COMMON_FOOD_NAME }).click();
  await page.getByRole('button', { name: 'Add to Breakfast' }).click();
}

async function logOatsFromLocalSearch(page: Page): Promise<void> {
  await page.getByRole('searchbox').fill('oats');
  await page.getByRole('button', { name: 'Oats, rolled' }).click();
  await page.getByRole('button', { name: 'Add to Breakfast' }).click();
}

async function oatsEntries(page: Page): Promise<unknown[][]> {
  return page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: E2eDb }).__db;
    return execSql(
      'select name, food_item_id, quantity_grams from food_log_entries where name = ?',
      ['Oats, rolled'],
      'all',
    );
  });
}

test('offline search shows the notice and logs a common CoFID food', async ({ page, context }) => {
  await openBreakfastPickerOffline(page, context);
  await expect(commonFoodsSection(page).getByRole('button', { name: COMMON_FOOD_NAME })).toBeVisible();

  await page.getByRole('searchbox').fill('oats');
  await expect(page.getByTestId('food-offline-notice')).toBeVisible();

  await page.getByRole('searchbox').fill('');
  await logCommonFood(page);

  await expect(page.getByTestId('meal-breakfast')).toContainText(COMMON_FOOD_NAME);

  await context.setOffline(false);
});

test('a curated food logged offline survives a reload', async ({ page, context }) => {
  await openBreakfastPickerOffline(page, context);
  await logOatsFromLocalSearch(page);

  await expect(page.getByTestId('meal-breakfast')).toContainText('Oats, rolled');
  expect(await oatsEntries(page)).toEqual([['Oats, rolled', 'oats-rolled', 100]]);

  // Root is precached; client-side navigation returns to /eat after the offline reload.
  await page.getByRole('link', { name: /hub/i }).click();
  await page.reload();
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');

  await page.getByRole('link', { name: 'Eat' }).click();
  await expect(page.getByTestId('meal-breakfast')).toContainText('Oats, rolled');
  expect(await oatsEntries(page)).toEqual([['Oats, rolled', 'oats-rolled', 100]]);

  await context.setOffline(false);
});

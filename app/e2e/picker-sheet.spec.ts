import { test, expect } from '@playwright/test';

/**
 * The exercise sheet has to be measured in a real engine, which is the whole
 * reason this is an e2e test and not a unit one: jsdom computes no layout, so
 * the fault it guards against — the sheet rendering at a fraction of its
 * intended height with its list clipped to a single row — is invisible there.
 * Every row was in the DOM and "visible" by every assertion a unit test can
 * make; only the geometry was wrong.
 *
 * The cause was `.pane-enter`'s `animation-fill-mode: both` leaving a computed
 * transform on the route wrapper for the life of the pane, which makes that
 * wrapper the containing block for `position: fixed` descendants. The picker's
 * `fixed inset-0` overlay then sized to the pane rather than the viewport.
 */
test('the picker sheet fills the viewport, not its route pane', async ({ page }) => {
  await page.goto('/train');
  await page.getByTestId('consent-accept').click();
  await page.getByTestId('start-workout-button').click();
  await page.getByTestId('add-exercise-button').click();
  await expect(page.getByTestId('exercise-sheet')).toBeVisible();

  const viewport = page.viewportSize()!;

  // The overlay is the direct check: `fixed inset-0` means the viewport, and
  // anything less means an ancestor has captured it as the containing block.
  const overlay = await page.getByRole('dialog').boundingBox();
  expect(overlay!.height).toBeCloseTo(viewport.height, 0);

  // No ancestor of the overlay may carry a computed transform/filter/etc, since
  // any of those silently re-parent a fixed descendant. Asserting the cause as
  // well as the symptom, so a reintroduction is named rather than just measured.
  const capturing = await page.evaluate(() => {
    const overlay = document.querySelector('[role="dialog"]')!;
    const found: string[] = [];
    for (let el = overlay.parentElement; el && el !== document.documentElement; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' || cs.willChange !== 'auto') {
        found.push(`${el.tagName}.${el.className} → transform:${cs.transform} filter:${cs.filter}`);
      }
    }
    return found;
  });
  expect(capturing).toEqual([]);

  // And the symptom itself: a search with several hits shows several rows, not
  // the one that fitted in a collapsed 81px list.
  await page.getByTestId('exercise-search').fill('press');
  const rows = page.getByTestId('exercise-row');
  await expect(rows).toHaveCount(10);

  const listBox = (await page.getByTestId('exercise-list').boundingBox())!;
  const lastBox = (await rows.last().boundingBox())!;
  expect(rows.first()).toBeVisible();
  // At least five rows fit above the fold of the list; before the fix exactly
  // one did.
  expect(listBox.height).toBeGreaterThan(lastBox.height * 5);
});

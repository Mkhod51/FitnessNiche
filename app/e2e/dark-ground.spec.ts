import { test, expect } from '@playwright/test';

/**
 * DESIGN.md ships a dark ground that is *derived*, not inverted: a warm
 * near-black in the paper's own hue family, with the confidence ramp
 * re-computed against it. The rule this file guards is that the ground
 * actually follows the OS and that a manual override beats the OS in both
 * directions — that is D-G1.6, "follow prefers-color-scheme with a manual
 * override", and none of it is provable by reading the stylesheet.
 *
 * Colours are asserted as rgb() because getComputedStyle resolves them.
 *   paper light #FBFAF7 -> rgb(251, 250, 247)
 *   paper dark  #1A1816 -> rgb(26, 24, 22)
 *   ink   dark  #F2EFE7 -> rgb(242, 239, 231)
 */

const PAPER_LIGHT = 'rgb(251, 250, 247)';
const PAPER_DARK = 'rgb(26, 24, 22)';
const INK_DARK = 'rgb(242, 239, 231)';

function groundOf(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    // Read the element that actually paints the ground, by an explicit hook —
    // an earlier version read <main>, which silently returned transparent once
    // the shell moved the background one level out.
    const el = document.querySelector('[data-testid="app-ground"]');
    if (!el) throw new Error('no [data-testid="app-ground"] to read a ground from');
    return getComputedStyle(el).backgroundColor;
  });
}

test.describe('light ground', () => {
  test.use({ colorScheme: 'light' });

  test('an OS set to light gets the paper ground', async ({ page }) => {
    await page.goto('/');
    expect(await groundOf(page)).toBe(PAPER_LIGHT);
  });

  test('a manual dark override beats an OS set to light', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    expect(await groundOf(page)).toBe(PAPER_DARK);
  });
});

test.describe('dark ground', () => {
  test.use({ colorScheme: 'dark' });

  test('an OS set to dark gets the derived warm near-black, not an inversion', async ({ page }) => {
    await page.goto('/');
    // Not #000 and not a blue-black: the red channel must lead, as it does in
    // the paper it is derived from.
    expect(await groundOf(page)).toBe(PAPER_DARK);
  });

  test('ink inverts to the warm off-white, so text stays readable', async ({ page }) => {
    await page.goto('/');
    const ink = await page.evaluate(() => {
      // Must be an element that actually carries `text-ink`. The first <p> in
      // <main> is the sr-only storage-mode line, which carries no colour class
      // and inherits black — reading that would pass or fail for reasons
      // unrelated to the ramp.
      const el = document.querySelector('main h1');
      if (!el) throw new Error('no <h1> to read ink from');
      return getComputedStyle(el).color;
    });
    expect(ink).toBe(INK_DARK);
  });

  test('a manual light override beats an OS set to dark', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    expect(await groundOf(page)).toBe(PAPER_LIGHT);
  });
});

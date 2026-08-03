import { test, expect } from '@playwright/test';

/**
 * DESIGN.md §Motion makes direction load-bearing: "Direction tells you where you
 * went. Three tabs in a fixed order means left/right is real spatial
 * information." A transition that plays the same way in both directions is
 * therefore not a cosmetic miss — it is the motion asserting something false.
 *
 * This shipped broken and invisible. The direction was settled in an effect that
 * ran after paint, and because the keyframe reads `--pane-from` live, a backward
 * move started at -12px and was rewritten to +12px while still in flight. It
 * looked animated, so nothing flagged it.
 *
 * Reading the custom property mid-animation is the assertion that would have
 * caught it; a screenshot after settling never could, since both directions end
 * in the same place.
 */
test('pane and step transitions carry the direction of travel', async ({ page }) => {
  await page.goto('/train');
  await page.getByTestId('consent-accept').click();

  // The property is an inline style, not animation state, so it persists on the
  // element after the animation ends — polling for it is safe, and is what makes
  // this independent of React's commit timing rather than of a fixed wait.
  const paneFrom = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.pane-enter')!).getPropertyValue('--pane-from').trim());
  const stepFrom = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.step-in')!).getPropertyValue('--step-from').trim());

  // Every assertion below is ordered so the expected value DIFFERS from the one
  // already on the element. Asserting a value the previous state also held would
  // pass on a stale read and prove nothing — which is close to how the original
  // bug hid.

  // ---- tabs. Opening on /train means index 1, so Hub(0) is a step back -------
  await page.getByRole('link', { name: 'Hub' }).click();
  await page.waitForURL(/\/$/);
  await expect.poll(paneFrom).toBe('-12px');

  await page.getByRole('link', { name: 'Eat' }).click();
  await page.waitForURL(/\/eat$/);
  await expect.poll(paneFrom).toBe('12px');

  // ---- steps: start → session → finish, back out, then forward again ---------
  await page.getByRole('link', { name: 'Train' }).click();
  await page.waitForURL(/\/train$/);
  await page.getByTestId('start-workout-button').click();
  await page.getByTestId('finish-button').click();
  await expect(page.getByTestId('confirm-finish-button')).toBeVisible();

  // Leaving the finish screen is a return, and must read as one.
  await page.getByTestId('cancel-finish-button').click();
  await expect(page.getByTestId('add-exercise-button')).toBeVisible();
  await expect.poll(stepFrom).toBe('-12px');

  // And going back in is forward again — proving the direction tracks travel
  // rather than latching on the first backward move.
  await page.getByTestId('finish-button').click();
  await expect(page.getByTestId('confirm-finish-button')).toBeVisible();
  await expect.poll(stepFrom).toBe('12px');
});

/**
 * §Motion: "`prefers-reduced-motion: reduce` disables all of it, and the
 * interface stays completely usable — because nothing is lost but the movement.
 * This is an accessibility requirement, not a courtesy."
 *
 * The failure mode this guards is specific: an animation whose fill-mode leaves
 * its first keyframe applied resolves, at a zeroed duration, to an element stuck
 * at `opacity: 0` or a zero-height grid track — invisible content rather than
 * absent motion. Asserting the resting values is the only way to tell the two
 * apart, since both look like "no animation".
 */
test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every animated element rests fully legible', async ({ page }) => {
    await page.goto('/train');
    await page.getByTestId('consent-accept').click();
    await page.getByTestId('start-workout-button').click();
    await page.getByTestId('add-exercise-button').click();
    await page.getByTestId('exercise-row').filter({ hasText: 'Barbell Bench Press' }).first().click();
    await page.getByTestId('weight-input').first().fill('100');
    await page.getByTestId('reps-input').first().fill('5');
    await page.getByTestId('tick-button').first().click();
    await expect(page.getByTestId('set-number')).toHaveCount(1);

    // `backwards` fill deliberately applies the FIRST keyframe before an
    // animation starts, so a synchronous read here would see the pre-start frame
    // (a zero-width clip) and report invisible content that is merely one frame
    // early. Wait for the queue to drain so what is measured is the true resting
    // state.
    await page.waitForFunction(() => document.getAnimations().length === 0);

    const resting = await page.evaluate(() => {
      const cs = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el) : null;
      };
      const step = cs('.step-in');
      const fill = cs('.tick-fill');
      const draw = cs('.tick-draw');
      const disclose = cs('.disclose');
      return {
        stepOpacity: step?.opacity,
        // Also the containing-block guard: a transform left applied here would
        // silently re-parent any `position: fixed` descendant.
        stepTransform: step?.transform,
        tickClip: fill?.clipPath,
        tickOffset: draw?.getPropertyValue('stroke-dashoffset'),
        discloseOpacity: disclose?.opacity,
      };
    });

    expect(resting.stepOpacity).toBe('1');
    expect(resting.stepTransform).toBe('none');
    expect(resting.tickClip).toBe('none');
    expect(resting.tickOffset).toBe('0px');
    if (resting.discloseOpacity !== undefined) expect(resting.discloseOpacity).toBe('1');

    // The receipt itself must be readable, not merely un-animated.
    await expect(page.getByTestId('set-number')).toHaveText('1');
  });
});

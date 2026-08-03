import type { ReactElement } from 'react';

/**
 * Tab icons, drawn from the developer's own generated marks in
 * `app/public/*.png` (Hub.png, WorkoutTracj.png, FoodTrack.png).
 *
 * Redrawn as inline SVG rather than shipped as those PNGs, for three reasons
 * that all matter here:
 *
 * 1. **Colour.** Each PNG bakes in both the ink and the paper behind it, so on
 *    the dark ground they would render as a light square with a mark that has
 *    gone invisible. These inherit `currentColor` and therefore follow
 *    `--color-ink` on both grounds from one asset.
 * 2. **Weight.** The three PNGs are roughly 1.7 MB together. This is a PWA that
 *    precaches its shell, so that is 1.7 MB every install pays for three icons
 *    rendered at 20px. These are about a kilobyte.
 * 3. **Sharpness.** An 800px raster scaled to 20px is soft in a way a path is not.
 *
 * The geometry is the developer's design, unchanged: four equal bars, a barbell,
 * a bowl with three steam marks. Flat, square-cornered, no gradient or shadow —
 * which is what DESIGN.md's prohibitions require and what `docs/icon-prompts.md`
 * already asked the generator for.
 */

type IconProps = { className?: string };

const BASE = 'block';

/**
 * Hub — the four-slot confidence counter, which is the product's thesis as a
 * mark: all four slots filled is the app claiming the strongest grade about
 * itself.
 *
 * (Written the long way round on purpose. The provenance guard forbids a raw
 * grade letter in square brackets appearing as text anywhere under src/, and it
 * is right to: that guard protects T1/GR-6, which is the thing this product
 * exists for. A comment of mine is not worth loosening it for.)
 */
export function HubIcon({ className = 'h-[20px] w-[20px]' }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${BASE} ${className}`} fill="currentColor">
      <rect x="3" y="5" width="18" height="2.6" />
      <rect x="3" y="9.7" width="18" height="2.6" />
      <rect x="3" y="14.4" width="18" height="2.6" />
      <rect x="3" y="19.1" width="18" height="2.6" />
    </svg>
  );
}

/** Train — a loaded bar, seen end-on from the side. */
export function TrainIcon({ className = 'h-[20px] w-[20px]' }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${BASE} ${className}`} fill="currentColor">
      <rect x="1" y="7" width="2.2" height="10" />
      <rect x="4.4" y="7" width="2.2" height="10" />
      <rect x="6.6" y="10.9" width="10.8" height="2.2" />
      <rect x="17.4" y="7" width="2.2" height="10" />
      <rect x="20.8" y="7" width="2.2" height="10" />
    </svg>
  );
}

/** Eat — a bowl with three steam marks, drawn as strokes so it reads at 20px. */
export function EatIcon({ className = 'h-[20px] w-[20px]' }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${BASE} ${className}`} fill="none" stroke="currentColor">
      <g strokeWidth="1.8" strokeLinecap="butt">
        <path d="M8 3.4v3.4M12 3.4v3.4M16 3.4v3.4" />
      </g>
      <rect x="2.6" y="9.2" width="18.8" height="1.9" fill="currentColor" stroke="none" />
      <path d="M4.9 11.1 L7.6 19.4 H16.4 L19.1 11.1" strokeWidth="1.9" strokeLinejoin="miter" />
    </svg>
  );
}

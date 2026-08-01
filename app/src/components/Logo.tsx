import type { ReactElement } from 'react';

/**
 * The ONLY place a brand mark may appear.
 *
 * PRODUCT.md is explicit that MyoStat is settled **as a word, not as a visual
 * identity** — no logo, wordmark, palette or typographic lockup has been
 * decided, and none may be invented in code. So this renders the name as text
 * and nothing else.
 *
 * There is deliberately no placeholder glyph, no dumbbell icon, no lettermark.
 * An invented placeholder is worse than an empty slot, because whatever ships
 * becomes the brand by being the thing everyone sees.
 *
 * ── Dropping in real artwork later ────────────────────────────────────────
 * 1. Save it as `src/assets/logo.svg` (full lockup) and/or
 *    `src/assets/logo-mark.svg` (standalone glyph).
 * 2. Uncomment the import and the branch below.
 * 3. Change nothing else — every surface renders through this component.
 *
 * The SVG must use `fill="currentColor"` (no baked-in hex) so it inherits
 * `--color-ink` and works on both the light and dark grounds from one asset.
 */

// import logoUrl from '../assets/logo.svg';

export type LogoSize = 'header' | 'hero';

const TEXT_SIZE: Record<LogoSize, string> = {
  header: 'text-[19px]',
  hero: 'text-[26px]',
};

export function Logo({ size = 'header' }: { size?: LogoSize }): ReactElement {
  // When artwork exists, return an inline <svg> here (imported via `?react` or
  // pasted as JSX) so the mark inherits currentColor and needs only one asset
  // for both grounds.
  //
  // Deliberately NOT an image element: the provenance guard in
  // src/provenance.test.ts forbids image tags anywhere under src/components/,
  // because GR-3 bans embedding a publisher's figure image and the cheapest
  // way to enforce that is to allow no raster embeds in this directory at all.
  // Inline SVG keeps the brand mark on the right side of that line.
  return (
    <span
      data-testid="logo"
      className={`font-serif ${TEXT_SIZE[size]} leading-none tracking-[-0.005em] text-ink`}
    >
      MyoStat
    </span>
  );
}

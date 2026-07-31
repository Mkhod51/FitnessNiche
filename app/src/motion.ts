/**
 * Reduced-motion detection for JS-gated unmount timing.
 *
 * The visual half is handled in CSS: index.css zeros the motion tokens and
 * force-clamps every animation/transition duration under
 * `prefers-reduced-motion: reduce`, so animations authored against the tokens
 * are accessible without JS. This function exists for the timing decision a
 * stylesheet cannot make — skipping a setTimeout-deferred unmount so a closing
 * sheet disappears immediately instead of waiting the full motion duration.
 */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

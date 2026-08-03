/**
 * The manual half of DESIGN.md's ground selection.
 *
 * The automatic half lives in CSS: `prefers-color-scheme` picks the ground with
 * no JavaScript at all, which is why "auto" here REMOVES the attribute rather
 * than writing one. Storing "auto" as a value would freeze whatever the OS
 * happened to say at the moment it was chosen.
 */
export type Theme = 'light' | 'dark' | 'auto';

export const THEME_KEY = 'myostat.theme';

export function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    // Private browsing can refuse localStorage outright. Losing a preference
    // must degrade to "follow the OS", never crash the boot.
    return 'auto';
  }
}

export function applyTheme(t: Theme): void {
  try {
    if (t === 'auto') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(THEME_KEY);
    } else {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(THEME_KEY, t);
    }
  } catch {
    // Same reasoning: the attribute still applies for this session even if the
    // preference cannot be persisted.
    if (t !== 'auto') document.documentElement.setAttribute('data-theme', t);
  }
}

export function applyStoredTheme(): void {
  const t = readStoredTheme();
  if (t !== 'auto') document.documentElement.setAttribute('data-theme', t);
}

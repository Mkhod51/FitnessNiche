import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * GR-5 / FR-ONB-1: no logging surface may render without explicit consent.
 *
 * This test is deliberately dormant. `src/features/log/` does not exist yet —
 * it arrives with the set-logging screen later in M2 — so today this asserts
 * almost nothing. It exists now because the consent gate was built before its
 * first caller, and a gate with no caller is trivially forgotten: the consent
 * task itself was already skipped once in this milestone and only caught by
 * hand. When the logging screens land, this fires without anyone remembering
 * to wire it up.
 *
 * It checks a structural proxy, not behaviour: that every screen component
 * under a logging feature directory routes through ConsentGate somewhere in
 * its own file or its feature's entry point. That is weaker than proving the
 * gate works — ConsentGate.test.tsx does that — but it is the half that rots,
 * because behaviour tests only cover the screens someone remembered to write
 * them for.
 */

const here = dirname(fileURLToPath(import.meta.url));

/** Feature directories whose screens handle user health data. */
const LOGGING_FEATURE_DIRS = ['features/log', 'features/import'];

function screenFilesIn(dir: string): string[] {
  const abs = join(here, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => join(abs, f));
}

describe('consent enforcement', () => {
  it('keeps the gate importable from the logging features that will need it', () => {
    // Guards the path, so a later move of ConsentGate breaks here loudly rather
    // than silently orphaning the check below.
    expect(existsSync(join(here, 'features/onboarding/ConsentGate.tsx'))).toBe(true);
  });

  it.each(LOGGING_FEATURE_DIRS)('routes every screen in %s through the consent gate', (dir) => {
    const files = screenFilesIn(dir);
    // Dormant until the directory exists. Not a failure — the logging screens
    // are a later task — but once they land, each one has to answer for itself.
    if (files.length === 0) return;

    const unguarded = files.filter((file) => {
      const src = readFileSync(file, 'utf8');
      return !src.includes('ConsentGate');
    });

    expect(
      unguarded,
      `these logging screens render user health data without routing through ConsentGate (GR-5): ${unguarded.join(', ')}`,
    ).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * GR-1 / D-G3.5: `src/domain/guards.ts` is the ONLY place a calorie target is
 * produced. `app/CLAUDE.md` states it outright — "All target setting flows
 * through src/domain/guards.ts; there is no second path."
 *
 * This is deliberately dormant, exactly as `consent-enforcement.test.ts` was
 * before the logging screens landed. The nutrition UI does not exist yet, so
 * today this asserts almost nothing. It exists NOW because the guard was
 * written before its first caller, and a guard with no caller is trivially
 * forgotten — the consent gate was skipped once in this repo and only caught
 * by hand. When a screen that sets a target lands, this fires without anyone
 * remembering to wire it up.
 *
 * It checks a structural proxy, not behaviour: that no file outside the domain
 * layer does calorie-target arithmetic of its own. `guards.test.ts` proves the
 * limits actually hold; this proves nobody quietly computed around them.
 */

const here = dirname(fileURLToPath(import.meta.url));

/** Numbers that may only ever appear inside guards.ts. */
const GUARD_MAGIC = [
  /\b1400\b/,
  /\b1800\b/,
  /\b1200\b/,
  /\bMAX_DAILY_DEFICIT\b/,
  /\bABSOLUTE_FLOOR\b/,
  /\bSEX_FLOOR\b/,
];

/** Doing this to a maintenance figure anywhere but the guard is a second path. */
const TARGET_ARITHMETIC = /maintenance\w*\s*[-+]\s*\w+|deficit\w*\s*[-+*]\s*\w+/i;

function sourceFilesUnder(dir: string): string[] {
  const abs = join(here, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(p);
    }
  };
  walk(abs);
  return out;
}

describe('calorie-target enforcement', () => {
  it('keeps the choke point importable where a screen will need it', () => {
    // Guards the path, so moving guards.ts breaks here loudly rather than
    // silently orphaning the checks below.
    expect(existsSync(join(here, 'domain/guards.ts'))).toBe(true);
  });

  it('exports the limits, so a screen renders them rather than restating them', async () => {
    const g = await import('./domain/guards');
    expect(g.MAX_DAILY_DEFICIT_KCAL).toBe(500);
    expect(g.ABSOLUTE_FLOOR_KCAL).toBeGreaterThanOrEqual(1200);
    expect(typeof g.clampCalorieTarget).toBe('function');
  });

  it('finds no calorie floor or cap hard-coded outside the guard', () => {
    const offenders = sourceFilesUnder('features')
      .concat(sourceFilesUnder('components'))
      .filter((file) => {
        const src = readFileSync(file, 'utf8');
        return GUARD_MAGIC.some((re) => re.test(src));
      })
      .map((f) => relative(here, f));

    expect(
      offenders,
      `these files restate a GR-1 limit instead of asking src/domain/guards.ts for it, ` +
        `which is the second path CLAUDE.md forbids: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('finds nobody computing a target from maintenance outside the domain layer', () => {
    const offenders = sourceFilesUnder('features')
      .filter((file) => TARGET_ARITHMETIC.test(readFileSync(file, 'utf8')))
      .map((f) => relative(here, f));

    expect(
      offenders,
      `these files do calorie-target arithmetic themselves rather than calling ` +
        `clampCalorieTarget: ${offenders.join(', ')}`,
    ).toEqual([]);
  });
});

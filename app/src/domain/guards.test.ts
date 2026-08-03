import { describe, it, expect } from 'vitest';
import {
  clampCalorieTarget,
  MAX_DAILY_DEFICIT_KCAL,
  ABSOLUTE_FLOOR_KCAL,
  SEX_FLOOR_KCAL,
  targetForDeficit,
  maxAllowedDeficit,
} from './guards';

/**
 * GR-1 is enforced here or it is not enforced at all: `guards.ts` is the single
 * choke point every calorie target passes through, and `app/CLAUDE.md` calls it
 * "the ONLY place targets are set/changed".
 *
 * These are adversarial rather than happy-path, per the standing rule that
 * guard code gets tested by someone trying to break it. A guard that has only
 * ever been shown working is decoration.
 */

const male = { sex: 'male' as const, maintenanceKcal: 2800 };
const female = { sex: 'female' as const, maintenanceKcal: 2100 };

describe('clampCalorieTarget — the deficit cap', () => {
  it('leaves a target inside the cap alone, and says it did not clamp', () => {
    const out = clampCalorieTarget(male, 2400); // 400 deficit
    expect(out).toEqual({ value: 2400, clamped: false, reason: 'none' });
  });

  it('allows exactly the cap — the limit is inclusive, not one short of it', () => {
    const out = clampCalorieTarget(male, 2800 - MAX_DAILY_DEFICIT_KCAL);
    expect(out.clamped).toBe(false);
    expect(out.value).toBe(2300);
  });

  it('pulls an aggressive cut back to the cap', () => {
    const out = clampCalorieTarget(male, 1900); // asked for a 900 deficit
    expect(out).toEqual({ value: 2300, clamped: true, reason: 'deficit-cap' });
  });

  it('cannot be talked past the cap by an absurdly low but valid request', () => {
    const out = clampCalorieTarget(male, 400);
    expect(out.value).toBe(2300);
    expect(out.clamped).toBe(true);
    expect(out.reason).toBe('deficit-cap');
  });

  // A negative target is not "an extremely aggressive cut", it is garbage, and
  // the guard refuses to read intent into it. What matters either way is the
  // invariant: nothing gets out below the cap.
  it.each([-5000, -1, 0])('never emits a target below the cap for %p', (bad) => {
    const out = clampCalorieTarget(male, bad);
    expect(out.clamped).toBe(true);
    expect(out.value).toBeGreaterThanOrEqual(2800 - MAX_DAILY_DEFICIT_KCAL);
  });

  it('does not cap a surplus — GR-1 guards under-eating, not bulking', () => {
    const out = clampCalorieTarget(male, 3600);
    expect(out).toEqual({ value: 3600, clamped: false, reason: 'none' });
  });
});

describe('clampCalorieTarget — the floors', () => {
  it('holds a small woman above the female floor even inside the deficit cap', () => {
    // 1700 maintenance, asks for 1250. That is only a 450 deficit, so the cap
    // never fires — the floor is the only thing standing between her and it.
    const out = clampCalorieTarget({ sex: 'female', maintenanceKcal: 1700 }, 1250);
    expect(out.value).toBe(SEX_FLOOR_KCAL.female);
    expect(out.clamped).toBe(true);
    expect(out.reason).toBe('sex-floor');
  });

  it('holds a man above the higher male floor', () => {
    const out = clampCalorieTarget({ sex: 'male', maintenanceKcal: 2100 }, 1700);
    expect(out.value).toBe(SEX_FLOOR_KCAL.male);
    expect(out.reason).toBe('sex-floor');
  });

  it('treats an unstated sex as the lower floor, not the higher one', () => {
    // Applying the male floor to someone who never said would force a small
    // woman to eat above her own needs. The absolute floor still catches her.
    expect(SEX_FLOOR_KCAL.unspecified).toBe(SEX_FLOOR_KCAL.female);
  });

  // The floor/cap collision named at design time: when the sex floor sits ABOVE
  // this person's maintenance, honouring it literally would prescribe a surplus
  // to someone who asked to cut.
  it('never uses the sex floor to push a target above maintenance', () => {
    const out = clampCalorieTarget({ sex: 'female', maintenanceKcal: 1300 }, 900);
    expect(out.value).toBe(1300); // maintenance, i.e. no deficit at all
    expect(out.value).toBeLessThanOrEqual(1300);
    expect(out.clamped).toBe(true);
  });

  // ...but the absolute floor is absolute. GR-1 says never below 1200 net, and
  // that one outranks even maintenance.
  it('applies the absolute floor even when it exceeds maintenance', () => {
    const out = clampCalorieTarget({ sex: 'female', maintenanceKcal: 1100 }, 1000);
    expect(out.value).toBe(ABSOLUTE_FLOOR_KCAL);
    expect(out.reason).toBe('absolute-floor');
  });

  it('has an absolute floor no lower than 1200, whatever else changes', () => {
    expect(ABSOLUTE_FLOOR_KCAL).toBeGreaterThanOrEqual(1200);
    expect(SEX_FLOOR_KCAL.female).toBeGreaterThanOrEqual(ABSOLUTE_FLOOR_KCAL);
    expect(SEX_FLOOR_KCAL.male).toBeGreaterThanOrEqual(SEX_FLOOR_KCAL.female);
  });
});

describe('clampCalorieTarget — hostile input', () => {
  it.each([NaN, Infinity, -Infinity])('falls back to maintenance for %p rather than throwing', (bad) => {
    const out = clampCalorieTarget(female, bad);
    expect(out.value).toBe(female.maintenanceKcal);
    expect(out.clamped).toBe(true);
    expect(out.reason).toBe('invalid');
  });

  it('falls back to maintenance when maintenance itself is nonsense', () => {
    const out = clampCalorieTarget({ sex: 'female', maintenanceKcal: NaN }, 1800);
    // Nothing can be computed from a broken maintenance, so the guard refuses
    // to invent a target rather than emitting a confidently wrong one.
    expect(out.clamped).toBe(true);
    expect(out.reason).toBe('invalid');
    expect(Number.isFinite(out.value)).toBe(true);
    expect(out.value).toBeGreaterThanOrEqual(ABSOLUTE_FLOOR_KCAL);
  });

  it('returns whole kilocalories — a target of 2316.6667 is invented precision', () => {
    const out = clampCalorieTarget({ sex: 'male', maintenanceKcal: 2816.6667 }, 1000);
    expect(Number.isInteger(out.value)).toBe(true);
  });

  it('is pure — the same input twice gives the same answer', () => {
    const a = clampCalorieTarget(female, 1200);
    const b = clampCalorieTarget(female, 1200);
    expect(a).toEqual(b);
  });
});

describe('targetForDeficit — so no screen does the arithmetic itself', () => {
  it('turns a deficit into a target', () => {
    expect(targetForDeficit(male, 400)).toEqual({ value: 2400, clamped: false, reason: 'none' });
  });

  it('clamps an over-cap deficit exactly as a direct request would', () => {
    expect(targetForDeficit(male, 900)).toEqual(clampCalorieTarget(male, 1900));
  });

  it('lets a surplus through — GR-1 guards under-eating, not bulking', () => {
    expect(targetForDeficit(male, -600).value).toBe(3400);
  });

  it('refuses a nonsense deficit rather than producing a nonsense target', () => {
    expect(targetForDeficit(male, NaN).reason).toBe('invalid');
  });
});

describe('maxAllowedDeficit — what a slider is allowed to offer', () => {
  it('is the cap for someone the floors do not bind', () => {
    expect(maxAllowedDeficit(male)).toBe(MAX_DAILY_DEFICIT_KCAL);
  });

  // The control must STOP at what is achievable. Letting someone drag to 500
  // and silently clamping back to 300 is a warning wearing a guard's clothes.
  it('is smaller than the cap when the floor bites first', () => {
    const small = { sex: 'female' as const, maintenanceKcal: 1700 };
    expect(maxAllowedDeficit(small)).toBe(300); // 1700 -> floor 1400
    expect(maxAllowedDeficit(small)).toBeLessThan(MAX_DAILY_DEFICIT_KCAL);
  });

  it('is zero for someone who cannot safely cut at all', () => {
    expect(maxAllowedDeficit({ sex: 'female', maintenanceKcal: 1300 })).toBe(0);
  });

  it('never returns a negative allowance', () => {
    expect(maxAllowedDeficit({ sex: 'female', maintenanceKcal: 900 })).toBeGreaterThanOrEqual(0);
  });
});

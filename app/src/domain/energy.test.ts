import { describe, it, expect } from 'vitest';
import {
  estimateMaintenance,
  proteinTargetG,
  ageFromBirthYear,
  ACTIVITY_MULTIPLIER,
  PROTEIN_PLATEAU_G_PER_KG,
  ESTIMATE_ERROR_FRACTION,
} from './energy';

const base = {
  sex: 'male' as const,
  heightCm: 178,
  weightKg: 78,
  ageYears: 27,
  activity: 'light' as const,
};

describe('estimateMaintenance', () => {
  it('computes Mifflin–St Jeor times the activity multiplier', () => {
    // BMR = 10*78 + 6.25*178 - 5*27 + 5 = 780 + 1112.5 - 135 + 5 = 1762.5
    // 1762.5 * 1.375 = 2423.4375
    const out = estimateMaintenance(base)!;
    expect(out.maintenanceKcal).toBe(2423);
  });

  it('never returns a bare point — the band is part of the answer', () => {
    const out = estimateMaintenance(base)!;
    expect(out.lowKcal).toBeLessThan(out.maintenanceKcal);
    expect(out.highKcal).toBeGreaterThan(out.maintenanceKcal);
    expect(out.lowKcal).toBe(Math.round(2423.4375 * (1 - ESTIMATE_ERROR_FRACTION)));
  });

  it('separates the sexes, because the equation genuinely does', () => {
    const male = estimateMaintenance({ ...base, sex: 'male' })!;
    const female = estimateMaintenance({ ...base, sex: 'female' })!;
    expect(male.maintenanceKcal).toBeGreaterThan(female.maintenanceKcal);
  });

  // Assuming male for someone who never said would overestimate most women's
  // maintenance, and that overestimate becomes a real under-eat once a deficit
  // is applied to it.
  it('puts an unstated sex between the two rather than assuming male', () => {
    const male = estimateMaintenance({ ...base, sex: 'male' })!;
    const female = estimateMaintenance({ ...base, sex: 'female' })!;
    const unknown = estimateMaintenance({ ...base, sex: 'unspecified' })!;
    expect(unknown.maintenanceKcal).toBeLessThan(male.maintenanceKcal);
    expect(unknown.maintenanceKcal).toBeGreaterThan(female.maintenanceKcal);
  });

  it('rises with activity, in the documented order', () => {
    const levels = (['desk', 'light', 'active', 'heavy'] as const).map(
      (activity) => estimateMaintenance({ ...base, activity })!.maintenanceKcal,
    );
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(ACTIVITY_MULTIPLIER.desk).toBeLessThan(ACTIVITY_MULTIPLIER.heavy);
  });

  // Nonsense in must not become a confident number out.
  it.each([
    ['zero weight', { weightKg: 0 }],
    ['negative height', { heightCm: -178 }],
    ['NaN age', { ageYears: NaN }],
    ['a height no adult has', { heightCm: 40 }],
    ['a weight no adult has', { weightKg: 500 }],
    ['an age outside the equation', { ageYears: 4 }],
  ])('returns null for %s rather than a fabricated maintenance', (_label, patch) => {
    expect(estimateMaintenance({ ...base, ...patch })).toBeNull();
  });

  it('is pure — same input, same answer', () => {
    expect(estimateMaintenance(base)).toEqual(estimateMaintenance(base));
  });
});

describe('proteinTargetG', () => {
  it('uses the plateau the curated claim actually puts it at', () => {
    expect(PROTEIN_PLATEAU_G_PER_KG).toBe(1.6);
    expect(proteinTargetG(78)).toBe(125); // 78 * 1.6 = 124.8
  });

  it('refuses a nonsense bodyweight', () => {
    expect(proteinTargetG(0)).toBeNull();
    expect(proteinTargetG(NaN)).toBeNull();
  });
});

describe('ageFromBirthYear', () => {
  it('derives whole years from the year stored', () => {
    expect(ageFromBirthYear(1999, new Date(2026, 0, 1))).toBe(27);
  });

  it('rejects a year that cannot produce a living age', () => {
    expect(ageFromBirthYear(2030, new Date(2026, 0, 1))).toBeNull();
    expect(ageFromBirthYear(1800, new Date(2026, 0, 1))).toBeNull();
    expect(ageFromBirthYear(1999.5)).toBeNull();
  });
});

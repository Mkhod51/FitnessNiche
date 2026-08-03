/**
 * energy.ts — the starting estimate, told honestly.
 *
 * Every mainstream tracker computes a TDEE and then treats it as fact forever.
 * This project's own research says that is the wrong shape: expenditure
 * estimates are unreliable, and the only consumer signals it trusts are the
 * bodyweight trend and the e1RM trend. So this returns a RANGE, and the UI says
 * the figure is a starting point that observed maintenance replaces.
 *
 * A note on what this is NOT, because the line matters (D-G6.5): a maintenance
 * estimate is a **measurement statement**, governed by T3 — "your estimated
 * maintenance is 2,500, plausibly 2,180–2,820". It is not advice, so T1/GR-6
 * does not require a stored claim behind it. "You should eat 2,500" WOULD be
 * advice and would need one. Nothing here tells anyone what to do.
 *
 * Pure: no I/O, no clock, no randomness.
 */

export type Sex = 'male' | 'female' | 'unspecified';

/** Everyday movement excluding training, which is counted by the log itself. */
export type ActivityLevel = 'desk' | 'light' | 'active' | 'heavy';

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  desk: 1.2,
  light: 1.375,
  active: 1.55,
  heavy: 1.725,
};

export interface EnergyInput {
  sex: Sex;
  heightCm: number;
  weightKg: number;
  ageYears: number;
  activity: ActivityLevel;
}

export interface EnergyEstimate {
  /** The point estimate, rounded — never shown without the range beside it. */
  maintenanceKcal: number;
  /** The band the point sits in. Shown, not hidden: a bare point is pseudo-precision. */
  lowKcal: number;
  highKcal: number;
}

/**
 * Mifflin–St Jeor. Chosen over Harris–Benedict because it validates better in
 * non-obese adults, which is this audience.
 *
 * `unspecified` takes the midpoint of the two sex constants rather than picking
 * one: the equation genuinely differs by sex, and silently assuming male would
 * overestimate most women's maintenance by around 160 kcal — which, run through
 * a deficit, becomes a real under-eat.
 */
const SEX_CONSTANT: Record<Sex, number> = {
  male: 5,
  female: -161,
  unspecified: (5 + -161) / 2,
};

/**
 * These equations land within roughly 10% of measured expenditure for most
 * people and further out for some. The band is that error stated plainly — not
 * a rounding, and not a confidence interval in the statistical sense, which is
 * why the UI calls it "plausibly" rather than dressing it as a CI.
 */
export const ESTIMATE_ERROR_FRACTION = 0.1;

export function estimateMaintenance(input: EnergyInput): EnergyEstimate | null {
  const { sex, heightCm, weightKg, ageYears, activity } = input;

  // A guard, not a calculation: nonsense in must not become a confident number
  // out. The caller shows its own prompt rather than a fabricated maintenance.
  if (![heightCm, weightKg, ageYears].every((n) => Number.isFinite(n) && n > 0)) return null;
  if (heightCm < 100 || heightCm > 250) return null;
  if (weightKg < 30 || weightKg > 350) return null;
  if (ageYears < 13 || ageYears > 100) return null;

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + SEX_CONSTANT[sex];
  const maintenance = bmr * ACTIVITY_MULTIPLIER[activity];

  return {
    maintenanceKcal: Math.round(maintenance),
    lowKcal: Math.round(maintenance * (1 - ESTIMATE_ERROR_FRACTION)),
    highKcal: Math.round(maintenance * (1 + ESTIMATE_ERROR_FRACTION)),
  };
}

/**
 * Protein target from bodyweight.
 *
 * 1.6 g/kg is where `c-protein-dose-plateau` [B] (Morton 2018, n=1,863) puts the
 * plateau — past it, more protein stops adding measurable lean mass. It is a
 * population dose-response rather than a personal prescription (GR-4), so the
 * UI must present it as where the evidence sits, not as what this person needs.
 */
export const PROTEIN_PLATEAU_G_PER_KG = 1.6;

export function proteinTargetG(weightKg: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  return Math.round(weightKg * PROTEIN_PLATEAU_G_PER_KG);
}

/** Whole years, from a birth year. A year in, not an age, so it cannot rot. */
export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number | null {
  if (!Number.isInteger(birthYear)) return null;
  const age = now.getFullYear() - birthYear;
  return age > 0 && age < 130 ? age : null;
}

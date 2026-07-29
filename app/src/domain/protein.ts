/**
 * protein.ts — protein per kg of bodyweight, on training days.
 *
 * The "on training days" qualifier is the whole point, and it comes from the
 * milestone spec rather than from taste: rest-day intake is a different
 * question, and an average across both answers neither. A lifter hitting 2.2
 * g/kg when they train and 1.0 on rest days is not a 1.6 g/kg lifter.
 *
 * Days are bucketed by LOCAL calendar date, matching how `localDayBounds` in
 * db/nutrition.ts groups a day everywhere else — a session at 21:00 and the meal
 * after it belong to the same day as the lifter experienced it, not to whatever
 * UTC says.
 *
 * Pure: no I/O, no clock, no randomness.
 */

/** Only the fields this needs, so callers can pass rows from either table. */
export interface FoodLike {
  loggedAt: string;
  proteinG: number;
}
export interface SetLike {
  performedAt: string;
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Mean protein per kg across the days that had training AND food logged.
 *
 * Null rather than zero whenever there is nothing to measure — no bodyweight,
 * no training days, or no food logged on any of them. Zero would assert that
 * the lifter ate no protein, which is a claim about their intake; null is the
 * absence of a measurement, which is the truth. GR-4.
 */
export function proteinPerKgOnTrainingDays(
  food: FoodLike[],
  sets: SetLike[],
  bodyweightKg: number | null,
): number | null {
  if (bodyweightKg === null || !(bodyweightKg > 0)) return null;

  const trainingDays = new Set(sets.map((s) => localDayKey(s.performedAt)));
  if (trainingDays.size === 0) return null;

  const proteinByDay = new Map<string, number>();
  for (const entry of food) {
    const day = localDayKey(entry.loggedAt);
    if (!trainingDays.has(day)) continue;
    proteinByDay.set(day, (proteinByDay.get(day) ?? 0) + entry.proteinG);
  }
  if (proteinByDay.size === 0) return null;

  // Averaged per day, not pooled: total-over-total would let one huge day carry
  // a week of low ones and report a number describing nobody's actual day.
  const perKgValues = [...proteinByDay.values()].map((g) => g / bodyweightKg);
  return perKgValues.reduce((a, b) => a + b, 0) / perKgValues.length;
}

/**
 * guards.ts — GR-1 enforced in code, which is the only place it counts.
 *
 * `app/CLAUDE.md` calls this "the ONLY place targets are set/changed", and that
 * is load-bearing rather than tidy: the research this rule comes from
 * (`01-research/constraints/ethics.md`) found that soft warnings around calorie
 * targets are read as motivating rather than cautionary, and that **only removed
 * affordances change behaviour**. A limit a screen can decline to apply is a
 * warning wearing a function's clothes.
 *
 * So no component computes a target. A component asks this, renders what comes
 * back, and renders `reason` when `clamped` is true — never its own limit.
 *
 * Pure: no I/O, no clock, no randomness. Same input, same answer, always.
 */

export type Sex = 'male' | 'female' | 'unspecified';

export interface UserProfile {
  sex: Sex;
  /** The person's own maintenance, however it was arrived at. */
  maintenanceKcal: number;
}

export type ClampReason =
  | 'none'
  | 'deficit-cap'
  | 'sex-floor'
  | 'absolute-floor'
  /** The request or the maintenance figure was not a usable number. */
  | 'invalid';

export interface ClampedTarget {
  value: number;
  clamped: boolean;
  reason: ClampReason;
}

/**
 * GR-1's cap. There is a real claim behind this one — `c-deficit-beyond-500-
 * blocks-lean-mass` [B] (Murphy & Koehler 2022), whose stored quote reads
 * "individuals performing RT to preserve LM during weight loss should avoid
 * energy deficits >500 kcal day-1" — so the UI can render the evidence for the
 * limit rather than merely asserting it.
 *
 * GR-4 still binds how that is worded: the claim's own record calls it a
 * population-level threshold, not a personal one.
 */
export const MAX_DAILY_DEFICIT_KCAL = 500;

/**
 * GR-1's sex floors. `unspecified` deliberately takes the LOWER of the two:
 * applying the male floor to someone who never stated a sex would force a small
 * woman to eat above her own maintenance, and the absolute floor below still
 * catches everybody.
 */
export const SEX_FLOOR_KCAL: Record<Sex, number> = {
  female: 1400,
  unspecified: 1400,
  male: 1800,
};

/** GR-1's hard floor: "no override sub-1200 net". Outranks everything, including maintenance. */
export const ABSOLUTE_FLOOR_KCAL = 1200;

const usable = (n: number): boolean => Number.isFinite(n) && n > 0;

/**
 * The only way a calorie target is produced.
 *
 * Order matters and is not arbitrary: the deficit cap runs first because it is
 * relative to this person, then the sex floor, then the absolute floor — each
 * one able to override the last, ending at the limit GR-1 says can never be
 * crossed.
 */
export function clampCalorieTarget(user: UserProfile, requested: number): ClampedTarget {
  const maintenance = user.maintenanceKcal;

  // A guard at a trust boundary must not throw: a screen handing it a NaN is a
  // bug, but crashing turns that bug into a lost session. Refuse to invent a
  // target and fall back to the safest one there is — no deficit at all.
  if (!usable(requested) || !usable(maintenance)) {
    const safe = usable(maintenance) ? maintenance : ABSOLUTE_FLOOR_KCAL;
    return { value: Math.round(Math.max(safe, ABSOLUTE_FLOOR_KCAL)), clamped: true, reason: 'invalid' };
  }

  let value = requested;
  let reason: ClampReason = 'none';

  const cappedFloor = maintenance - MAX_DAILY_DEFICIT_KCAL;
  if (value < cappedFloor) {
    value = cappedFloor;
    reason = 'deficit-cap';
  }

  // The sex floor never pushes anyone ABOVE their own maintenance. Someone whose
  // maintenance sits under the floor cannot safely cut at all, and the honest
  // answer there is "no deficit" rather than "eat a surplus" — this was the
  // floor/cap collision identified at design time.
  const sexFloor = Math.min(SEX_FLOOR_KCAL[user.sex], maintenance);
  if (value < sexFloor) {
    value = sexFloor;
    reason = 'sex-floor';
  }

  // The absolute floor has no such deference. GR-1 admits no override below it,
  // so it applies even when it lands above this person's maintenance.
  if (value < ABSOLUTE_FLOOR_KCAL) {
    value = ABSOLUTE_FLOOR_KCAL;
    reason = 'absolute-floor';
  }

  // Whole kilocalories. A target of 2316.6667 claims a precision that neither
  // the maintenance estimate nor the food data can support (T3).
  const rounded = Math.round(value);
  return { value: rounded, clamped: reason !== 'none', reason };
}

/**
 * The target for a chosen daily deficit.
 *
 * This exists so no screen ever writes `maintenance - deficit` itself. That
 * arithmetic IS target-setting, and `guards-enforcement.test.ts` fails the build
 * when it appears outside this layer — a slider that computed its own value
 * would be the second path GR-1 forbids, even if it politely called the clamp
 * afterwards.
 *
 * A negative deficit is a surplus and passes through: GR-1 guards under-eating.
 */
export function targetForDeficit(user: UserProfile, deficitKcal: number): ClampedTarget {
  if (!Number.isFinite(deficitKcal) || !usable(user.maintenanceKcal)) {
    return clampCalorieTarget(user, Number.NaN);
  }
  return clampCalorieTarget(user, user.maintenanceKcal - deficitKcal);
}

/**
 * The largest deficit this person can actually be given, once the floors are
 * taken into account. A slider uses this as its maximum so the control STOPS
 * rather than letting someone drag into a value that is silently clamped back —
 * a limit you can cross and have quietly undone is a warning, not a guard.
 */
export function maxAllowedDeficit(user: UserProfile): number {
  if (!usable(user.maintenanceKcal)) return 0;
  const atCap = targetForDeficit(user, MAX_DAILY_DEFICIT_KCAL);
  return Math.max(0, Math.round(user.maintenanceKcal - atCap.value));
}

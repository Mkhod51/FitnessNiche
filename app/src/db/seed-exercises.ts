/**
 * Hand-authored exercise seed data. No third-party exercise database was used —
 * every entry and every fractional contribution below was written from domain
 * (lifting/anatomy) knowledge for this app.
 *
 * Fractional-counting convention (weekly hard sets per muscle group):
 *   1.0  — primary mover, the muscle doing the main work of the lift
 *   0.5  — meaningful secondary involvement (a muscle that's clearly loaded
 *          but isn't the main target, e.g. triceps on a bench press)
 *   0.25 — minor/stabiliser involvement (assists or stabilises but isn't
 *          meaningfully fatigued as a target muscle)
 * Muscles with negligible involvement are omitted entirely rather than
 * assigned a token fraction. When in doubt we credit LESS, not more —
 * over-crediting secondaries would inflate a user's apparent weekly volume,
 * which defeats the point of an honesty-focused set counter.
 */

export type MuscleGroup =
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts' | 'lats' | 'upper_back'
  | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'abs' | 'lower_back';

export type Modality = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'smith';

export interface SeedExercise {
  id: string;                                   // stable slug, e.g. 'barbell-bench-press'
  name: string;                                 // display, e.g. 'Barbell Bench Press'
  modality: Modality;
  /** Fractional set credit per muscle. Primary movers 1.0; meaningful secondaries 0.5;
   *  minor/stabiliser involvement 0.25. Omit muscles with negligible involvement.
   *  Convention: a set of this exercise adds these fractions to each muscle's weekly set count. */
  contributions: Partial<Record<MuscleGroup, number>>;
  /** true if it's a big multi-joint lift — used to prefer these for e1RM trend tracking */
  isCompound: boolean;
}

export const SEED_EXERCISES: SeedExercise[] = [
  // --- chest ---
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    modality: 'barbell',
    contributions: { chest: 1.0, front_delts: 0.5, triceps: 0.5 },
    isCompound: true,
  },
  {
    id: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    modality: 'cable',
    contributions: { chest: 1.0, front_delts: 0.25 },
    isCompound: false,
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    modality: 'dumbbell',
    contributions: { chest: 1.0, front_delts: 0.5, triceps: 0.5 },
    isCompound: true,
  },
  {
    id: 'incline-barbell-bench-press',
    name: 'Incline Barbell Bench Press',
    modality: 'barbell',
    contributions: { chest: 1.0, front_delts: 0.5, triceps: 0.25 },
    isCompound: true,
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    modality: 'dumbbell',
    contributions: { chest: 1.0, front_delts: 0.5, triceps: 0.25 },
    isCompound: true,
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    modality: 'machine',
    contributions: { chest: 1.0, front_delts: 0.5, triceps: 0.25 },
    isCompound: true,
  },

  // --- front_delts ---
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    modality: 'dumbbell',
    contributions: { front_delts: 1.0, side_delts: 0.5, triceps: 0.25 },
    isCompound: true,
  },
  {
    id: 'barbell-overhead-press',
    name: 'Barbell Overhead Press',
    modality: 'barbell',
    contributions: { front_delts: 1.0, side_delts: 0.5, triceps: 0.5 },
    isCompound: true,
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    modality: 'dumbbell',
    contributions: { front_delts: 1.0, side_delts: 0.5, triceps: 0.5 },
    isCompound: true,
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    modality: 'machine',
    contributions: { front_delts: 1.0, side_delts: 0.5, triceps: 0.25 },
    isCompound: true,
  },

  // --- side_delts ---
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    modality: 'cable',
    contributions: { side_delts: 1.0 },
    isCompound: false,
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    modality: 'dumbbell',
    contributions: { side_delts: 1.0 },
    isCompound: false,
  },
  {
    id: 'machine-lateral-raise',
    name: 'Machine Lateral Raise',
    modality: 'machine',
    contributions: { side_delts: 1.0 },
    isCompound: false,
  },

  // --- rear_delts ---
  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    modality: 'cable',
    contributions: { rear_delts: 1.0, upper_back: 0.5, side_delts: 0.25 },
    isCompound: false,
  },
  {
    id: 'cable-rear-delt-fly',
    name: 'Cable Rear Delt Fly',
    modality: 'cable',
    contributions: { rear_delts: 1.0, upper_back: 0.25 },
    isCompound: false,
  },
  {
    id: 'dumbbell-rear-delt-fly',
    name: 'Dumbbell Rear Delt Fly',
    modality: 'dumbbell',
    contributions: { rear_delts: 1.0, upper_back: 0.25 },
    isCompound: false,
  },

  // --- lats ---
  {
    id: 'chin-up',
    name: 'Chin-Up',
    modality: 'bodyweight',
    contributions: { lats: 1.0, biceps: 0.5, upper_back: 0.25 },
    isCompound: true,
  },
  {
    id: 'close-grip-lat-pulldown',
    name: 'Close-Grip Lat Pulldown',
    modality: 'cable',
    contributions: { lats: 1.0, biceps: 0.5, upper_back: 0.25 },
    isCompound: true,
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    modality: 'cable',
    contributions: { lats: 1.0, biceps: 0.5, upper_back: 0.5 },
    isCompound: true,
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    modality: 'bodyweight',
    contributions: { lats: 1.0, biceps: 0.5, upper_back: 0.5 },
    isCompound: true,
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight-Arm Pulldown',
    modality: 'cable',
    contributions: { lats: 1.0, upper_back: 0.25 },
    isCompound: false,
  },

  // --- upper_back ---
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    modality: 'barbell',
    contributions: { upper_back: 1.0, lats: 0.5, biceps: 0.5, rear_delts: 0.25, lower_back: 0.25 },
    isCompound: true,
  },
  {
    id: 'barbell-shrug',
    name: 'Barbell Shrug',
    modality: 'barbell',
    contributions: { upper_back: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Row',
    modality: 'dumbbell',
    contributions: { upper_back: 1.0, lats: 0.5, biceps: 0.25, rear_delts: 0.25 },
    isCompound: true,
  },
  {
    id: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    modality: 'dumbbell',
    contributions: { upper_back: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'one-arm-dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    modality: 'dumbbell',
    contributions: { upper_back: 1.0, lats: 0.5, biceps: 0.5 },
    isCompound: true,
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    modality: 'cable',
    contributions: { upper_back: 1.0, lats: 0.5, biceps: 0.25 },
    isCompound: true,
  },

  // --- biceps ---
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    modality: 'barbell',
    contributions: { biceps: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    modality: 'cable',
    contributions: { biceps: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    modality: 'dumbbell',
    contributions: { biceps: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    modality: 'dumbbell',
    contributions: { biceps: 1.0, forearms: 0.5 },
    isCompound: false,
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    modality: 'barbell',
    contributions: { biceps: 1.0 },
    isCompound: false,
  },

  // --- triceps ---
  {
    id: 'cable-triceps-pushdown',
    name: 'Cable Triceps Pushdown',
    modality: 'cable',
    contributions: { triceps: 1.0 },
    isCompound: false,
  },
  {
    id: 'overhead-triceps-extension',
    name: 'Overhead Triceps Extension',
    modality: 'dumbbell',
    contributions: { triceps: 1.0 },
    isCompound: false,
  },
  {
    id: 'skullcrusher',
    name: 'Skullcrusher',
    modality: 'barbell',
    contributions: { triceps: 1.0 },
    isCompound: false,
  },
  {
    id: 'triceps-dip',
    name: 'Triceps Dip',
    modality: 'bodyweight',
    contributions: { triceps: 1.0, chest: 0.5, front_delts: 0.25 },
    isCompound: true,
  },

  // --- forearms ---
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    modality: 'dumbbell',
    contributions: { forearms: 1.0, upper_back: 0.25, abs: 0.25 },
    isCompound: true,
  },
  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    modality: 'dumbbell',
    contributions: { forearms: 1.0 },
    isCompound: false,
  },

  // --- quads ---
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    modality: 'barbell',
    contributions: { quads: 1.0, glutes: 0.5, lower_back: 0.25 },
    isCompound: true,
  },
  {
    id: 'barbell-front-squat',
    name: 'Barbell Front Squat',
    modality: 'barbell',
    contributions: { quads: 1.0, glutes: 0.25, lower_back: 0.25 },
    isCompound: true,
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    modality: 'machine',
    contributions: { quads: 1.0, glutes: 0.25 },
    isCompound: true,
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    modality: 'machine',
    contributions: { quads: 1.0 },
    isCompound: false,
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    modality: 'machine',
    contributions: { quads: 1.0, glutes: 0.5 },
    isCompound: true,
  },

  // --- hamstrings ---
  {
    id: 'barbell-good-morning',
    name: 'Barbell Good Morning',
    modality: 'barbell',
    contributions: { hamstrings: 1.0, glutes: 0.5, lower_back: 0.5 },
    isCompound: true,
  },
  {
    id: 'conventional-deadlift',
    name: 'Conventional Deadlift',
    modality: 'barbell',
    contributions: {
      hamstrings: 1.0, glutes: 1.0, lower_back: 1.0, upper_back: 0.5, quads: 0.25, forearms: 0.25,
    },
    isCompound: true,
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    modality: 'machine',
    contributions: { hamstrings: 1.0 },
    isCompound: false,
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    modality: 'barbell',
    contributions: { hamstrings: 1.0, glutes: 0.5, lower_back: 0.5 },
    isCompound: true,
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    modality: 'barbell',
    contributions: {
      hamstrings: 1.0, glutes: 1.0, quads: 0.5, lower_back: 0.5, upper_back: 0.25, forearms: 0.25,
    },
    isCompound: true,
  },

  // --- glutes ---
  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    modality: 'barbell',
    contributions: { glutes: 1.0, hamstrings: 0.25 },
    isCompound: true,
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    modality: 'cable',
    contributions: { glutes: 1.0, hamstrings: 0.5, lower_back: 0.25 },
    isCompound: true,
  },

  // --- calves ---
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    modality: 'machine',
    contributions: { calves: 1.0 },
    isCompound: false,
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    modality: 'machine',
    contributions: { calves: 1.0 },
    isCompound: false,
  },

  // --- abs ---
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    modality: 'cable',
    contributions: { abs: 1.0 },
    isCompound: false,
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    modality: 'bodyweight',
    contributions: { abs: 1.0, forearms: 0.25 },
    isCompound: false,
  },
  {
    id: 'plank',
    name: 'Plank',
    modality: 'bodyweight',
    contributions: { abs: 1.0 },
    isCompound: false,
  },

  // --- lower_back ---
  {
    id: 'back-extension',
    name: 'Back Extension',
    modality: 'bodyweight',
    contributions: { lower_back: 1.0, glutes: 0.5, hamstrings: 0.25 },
    isCompound: false,
  },
];

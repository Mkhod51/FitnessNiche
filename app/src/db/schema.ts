import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  goal: text('goal', { enum: ['cut', 'bulk', 'maintain'] }).notNull().default('maintain'), // GR-1: maintenance default
  sex: text('sex', { enum: ['male', 'female', 'unspecified'] }).notNull().default('unspecified'),
  heightCm: real('height_cm'),
  numbersHidden: integer('numbers_hidden', { mode: 'boolean' }).notNull().default(false),
  // Nutrition targets. Nullable means "not set yet" — never zero, which would be
  // a target rather than an absence. Every value here is produced by
  // src/domain/guards.ts and by nothing else (GR-1).
  calorieTargetKcal: integer('calorie_target_kcal'),
  proteinTargetG: integer('protein_target_g'),
  // GR-1: maintenance is the default goal, expressed in the schema rather than
  // in a component that could forget it.
  deficitKcal: integer('deficit_kcal').notNull().default(0),
  // A year, not an age: an age column is wrong within twelve months and nothing
  // would ever correct it. Mifflin-St Jeor needs it.
  birthYear: integer('birth_year'),
  // When the current goal was set. Null means unknown — see 0004_goal_clock.sql
  // for why that is not backfilled to "now".
  goalStartedAt: text('goal_started_at'),
  // Optional and explicit: absence means the person skipped the question. It is
  // never inferred from their first workout or used as an access gate.
  trainingExperience: text('training_experience', {
    enum: ['new', 'returning', 'experienced'],
  }),
  consentedAt: text('consented_at'), // GR-5: no logging before this is set
  updatedAt: text('updated_at').notNull(),
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  modality: text('modality').notNull(),
  isCompound: integer('is_compound', { mode: 'boolean' }).notNull(),
  contributions: text('contributions', { mode: 'json' }).$type<Record<string, number>>().notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  startedAt: text('started_at').notNull(),
  name: text('name'), // nullable: a session in progress hasn't been named yet
  finishedAt: text('finished_at'), // nullable: finishedAt IS NULL is what defines an open session
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  rir: integer('rir'), // nullable: imported data may lack it (OQ-2)
  // defaults to 'working' so every already-logged set is correctly classified
  // by the migration itself; warm-up sets are excluded from weekly volume
  // and from e1RM input
  setType: text('set_type', { enum: ['working', 'warmup'] }).notNull().default('working'),
  performedAt: text('performed_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const weights = sqliteTable('weights', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  valueKg: real('value_kg').notNull(),
  measuredAt: text('measured_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const adviceEvents = sqliteTable('advice_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  claimId: text('claim_id').notNull(),
  trigger: text('trigger').notNull(),
  workoutId: text('workout_id'), // nullable: not every claim fires from within a workout
  shownAt: text('shown_at').notNull(),
  dismissedAt: text('dismissed_at'),
  suppressedAt: text('suppressed_at'),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const foodItems = sqliteTable('food_items', {
  id: text('id').primaryKey(),
  // 'off' | 'cofid' | 'fdc' | 'user' — named so a figure can always be traced
  // to the database it came from, which this audience will ask about, and which
  // ODbL/OGL attribution requires anyway.
  source: text('source').notNull(),
  name: text('name').notNull(),
  brand: text('brand'),
  barcode: text('barcode'),
  kcalPer100g: real('kcal_per_100g').notNull(),
  proteinGPer100g: real('protein_g_per_100g').notNull(),
  carbsGPer100g: real('carbs_g_per_100g').notNull(),
  fatGPer100g: real('fat_g_per_100g').notNull(),
  fibreGPer100g: real('fibre_g_per_100g'),
  servingGrams: real('serving_grams'),
  servingLabel: text('serving_label'),
  updatedAt: text('updated_at').notNull(),
});

export const foodLogEntries = sqliteTable('food_log_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  // Nullable: a quick-add has no food item behind it, and FR-LOG-3 makes the
  // approximate path first-class rather than a degraded one.
  foodItemId: text('food_item_id'),
  name: text('name').notNull(),
  mealSlot: text('meal_slot', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
  quantityGrams: real('quantity_grams'),
  // The quantity AS ENTERED, so a row can show "2 palms" when a tier was tapped
  // and grams when grams were typed, rather than back-converting and implying a
  // precision the user never gave.
  quantityLabel: text('quantity_label'),
  // Denormalised on purpose: the numbers as logged must survive the food item
  // being corrected or removed later. A past day is a record of what was
  // recorded, not a live query.
  kcal: real('kcal').notNull(),
  proteinG: real('protein_g').notNull(),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  loggedAt: text('logged_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const syncMeta = sqliteTable('sync_meta', {
  tableName: text('table_name').notNull(),
  rowId: text('row_id').notNull(),
  pendingSince: text('pending_since'),
  lastPushedAt: text('last_pushed_at'),
}, (t) => ({ pk: primaryKey({ columns: [t.tableName, t.rowId] }) }));

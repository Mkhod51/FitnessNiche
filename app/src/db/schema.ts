import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  goal: text('goal', { enum: ['cut', 'bulk', 'maintain'] }).notNull().default('maintain'), // GR-1: maintenance default
  sex: text('sex', { enum: ['male', 'female', 'unspecified'] }).notNull().default('unspecified'),
  heightCm: real('height_cm'),
  numbersHidden: integer('numbers_hidden', { mode: 'boolean' }).notNull().default(false),
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

export const syncMeta = sqliteTable('sync_meta', {
  tableName: text('table_name').notNull(),
  rowId: text('row_id').notNull(),
  pendingSince: text('pending_since'),
  lastPushedAt: text('last_pushed_at'),
}, (t) => ({ pk: primaryKey({ columns: [t.tableName, t.rowId] }) }));

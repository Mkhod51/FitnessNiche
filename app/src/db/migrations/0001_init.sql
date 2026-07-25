create table if not exists users (
  id text primary key,
  goal text not null default 'maintain',
  sex text not null default 'unspecified',
  height_cm real,
  numbers_hidden integer not null default 0,
  consented_at text,
  updated_at text not null
);
create table if not exists exercises (
  id text primary key,
  name text not null,
  modality text not null,
  is_compound integer not null,
  contributions text not null
);
create table if not exists workouts (
  id text primary key,
  user_id text not null,
  started_at text not null,
  updated_at text not null,
  deleted_at text
);
create table if not exists sets (
  id text primary key,
  workout_id text not null,
  exercise_id text not null,
  weight_kg real not null,
  reps integer not null,
  rir integer,
  performed_at text not null,
  updated_at text not null,
  deleted_at text
);
create table if not exists weights (
  id text primary key,
  user_id text not null,
  value_kg real not null,
  measured_at text not null,
  updated_at text not null,
  deleted_at text
);
create table if not exists sync_meta (
  table_name text not null,
  row_id text not null,
  pending_since text,
  last_pushed_at text,
  primary key (table_name, row_id)
);
create index if not exists idx_sets_performed_at on sets (performed_at);
create index if not exists idx_weights_measured_at on weights (measured_at);

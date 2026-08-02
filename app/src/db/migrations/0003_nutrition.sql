create table if not exists food_items (
  id text primary key,
  source text not null,
  name text not null,
  brand text,
  barcode text,
  kcal_per_100g real not null,
  protein_g_per_100g real not null,
  carbs_g_per_100g real not null,
  fat_g_per_100g real not null,
  fibre_g_per_100g real,
  serving_grams real,
  serving_label text,
  updated_at text not null
);
create index if not exists food_items_barcode on food_items (barcode);
create index if not exists food_items_name on food_items (name);

create table if not exists food_log_entries (
  id text primary key,
  user_id text not null,
  food_item_id text,
  name text not null,
  meal_slot text not null,
  quantity_grams real,
  quantity_label text,
  kcal real not null,
  protein_g real not null,
  carbs_g real,
  fat_g real,
  logged_at text not null,
  updated_at text not null,
  deleted_at text
);
create index if not exists food_log_entries_logged_at on food_log_entries (logged_at);

alter table users add column calorie_target_kcal integer;
alter table users add column protein_target_g integer;
alter table users add column deficit_kcal integer not null default 0;
alter table users add column birth_year integer;

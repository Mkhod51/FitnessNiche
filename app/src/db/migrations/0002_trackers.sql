alter table workouts add column name text;
alter table workouts add column finished_at text;
alter table sets add column set_type text not null default 'working';

create table if not exists advice_events (
  id text primary key,
  user_id text not null,
  claim_id text not null,
  trigger text not null,
  workout_id text,
  shown_at text not null,
  dismissed_at text,
  suppressed_at text,
  updated_at text not null,
  deleted_at text
);
create index if not exists advice_events_claim_shown on advice_events (claim_id, shown_at);

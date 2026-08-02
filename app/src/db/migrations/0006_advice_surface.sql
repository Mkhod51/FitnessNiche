-- Historical rows cannot truthfully identify the UI that showed them. Keep
-- that uncertainty explicit while requiring every new helper call to name its
-- real surface.
alter table advice_events add column surface text not null default 'unknown'
  check (surface in (
    'hub-empty',
    'exercise-selection',
    'goal-draft',
    'hub',
    'weekly-review',
    'search',
    'workout-start',
    'unknown'
  ));

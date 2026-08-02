-- Optional profile context only. Existing users remain unknown rather than
-- being classified from their logs, and SQLite enforces the same closed set as
-- the TypeScript model.
alter table users add column training_experience text
  check (training_experience is null or training_experience in ('new', 'returning', 'experienced'));

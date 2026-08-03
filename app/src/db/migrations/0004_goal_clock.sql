-- FR-SIG-5 / FR-ADV-4. The deficit claims predicate on `deficitWeeks`, and
-- nothing in the schema could answer "how long has this cut been running?" —
-- the goal was stored without a clock.
--
-- Nullable on purpose. A default of "now" would date every existing user's cut
-- to the moment they upgraded, which reads as a brand-new cut and would silence
-- the >= 3 and >= 4 week claims for a month. Null means "we do not know when
-- this started", and the reconciler reports zero weeks rather than guessing.
alter table users add column goal_started_at text;

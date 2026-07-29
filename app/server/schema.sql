-- D1 schema for the sync target.
--
-- Mirrors SYNC_TABLES in app/src/sync/protocol.ts. Every table has the same
-- four columns and nothing else: id, updated_at, deleted_at, data. The full
-- row travels as JSON in `data` rather than as mirrored columns on purpose --
-- this server is a replication target, not a query surface, so a new local
-- column (e.g. a field added to `sets`) never needs a migration here. The
-- cost is that this server cannot filter or aggregate on row content; it only
-- ever compares on updated_at and content, which is all last-write-wins needs.
--
-- `server_seq` is what a client's pull is filtered by, and it is assigned HERE,
-- by the server, from the counter in sync_state. It is deliberately not
-- `updated_at`: that column is written by whichever device made the change, so
-- filtering a pull by it compares two clocks that were never synchronised. A
-- phone running slow stamps its rows in the past, the other device's watermark
-- has already passed them, and those rows are never pulled at all.

CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  seq INTEGER NOT NULL
);
INSERT OR IGNORE INTO sync_state (id, seq) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS users_server_seq_idx ON users (server_seq);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS workouts_server_seq_idx ON workouts (server_seq);

CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sets_server_seq_idx ON sets (server_seq);

CREATE TABLE IF NOT EXISTS weights (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS weights_server_seq_idx ON weights (server_seq);

CREATE TABLE IF NOT EXISTS advice_events (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS advice_events_server_seq_idx ON advice_events (server_seq);

CREATE TABLE IF NOT EXISTS food_log_entries (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  data TEXT NOT NULL,
  server_seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS food_log_entries_server_seq_idx ON food_log_entries (server_seq);

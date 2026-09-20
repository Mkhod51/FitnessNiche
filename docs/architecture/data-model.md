# Data model

**Status:** current scope page; the complete schema comparison and ER diagram are owned by documentation Task 5.

This page will document the local SQLite tables, relationships, nullable fields, tombstones, and intentionally non-replicated data. Bundled claims are versioned application data, not a local SQLite table.

Schema and migrations under `app/src/db/` are the implementation authority. Read this alongside [local-first storage](local-first-storage.md), [sync](sync.md), and [feature status](../reference/feature-status.md).

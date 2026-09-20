# Local-first storage

**Status:** current scope page; detailed boot, OPFS, fallback, and persistence behaviour are owned by documentation Task 5.

The application opens SQLite in a worker, prefers OPFS, and falls back when that storage mode is unavailable. Local storage remains the primary write path even when optional sync is configured.

This page will distinguish durable guarantees from browser-dependent fallback behaviour. See [system overview](system-overview.md), [data model](data-model.md), and [testing](../guides/testing.md).

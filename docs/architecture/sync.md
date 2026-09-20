# Sync

**Status:** current scope page; the full sequence, merge rules, tombstones, and failure behaviour are owned by documentation Task 7.

Sync is an optional replication layer between the local SQLite source and a Cloudflare Worker/D1 service. The protocol uses queued local changes, server sequence watermarks, soft-delete tombstones, and deterministic last-write-wins conflict resolution.

Contract and merge tests exist, but a real browser-to-Worker/D1 round trip is not currently covered. See [feature status](../reference/feature-status.md) for the verification boundary and [deployment](../guides/deployment.md) for operations.

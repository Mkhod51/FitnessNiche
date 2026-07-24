# Architecture Patterns: Offline-First, Sync, On-Device

> **Status:** Phase 1 baseline. Wave 1 Stream F extends this — everything below is retained, not replaced.
> Verbatim Phase 1 source archived at `04-sources/raw-notes/phase1/constraints.md`.

## Phase 1 baseline — offline-first sync

Offline-first is a **hard requirement**: gyms have no signal.

- **The real problem is narrow:** this is a *single-user, multi-device* app (phone, maybe watch), not multi-user collaboration. True concurrent conflicts are rare — usually the same person on two devices, one of them offline.
- **Reach for:** local-first SQLite + per-record last-write-wins on a server `updated_at` timestamp, with a sync queue. Food and lift entries are **append-mostly** (you add a log; you rarely co-edit one row) — model them as an append log and ~90% of "conflicts" never arise. LWW only bites on edits to the *same* record, which is an edge case here.
- **Avoid as over-engineering:** hand-rolled CRDTs, operational transform, or a bespoke sync engine. CRDTs solve *concurrent multi-user text/structure merge* — a problem this app does not have. Weeks of work for edge cases the append-log already dissolves, and an interviewer will see through résumé-driven distributed-systems theatre.
- **If sync should be handled for you:** use an existing offline-first layer (WatermelonDB, PowerSync, or Realm/Atlas Device Sync) rather than writing the reconciliation loop. Do not add one until on-device SQLite plus a manual push/pull demonstrably falls short.
- **GDPR alignment:** keeping data on-device is simultaneously the cheapest compliance path (see `../constraints/regulatory.md`), so local-first is not only a gym-signal decision.

## Open questions for Wave 1 Stream F

- Detailed comparison of CRDT vs LWW vs OT **for this specific domain**, with the honest case for each rather than Phase 1's summary dismissal.
- Local-first storage options and their trade-offs for a solo cross-platform dev.
- **On-device ML feasibility** — never examined in Phase 1, and directly relevant to any candidate involving photo estimation or passive inference.
- Cross-platform framework options for a solo developer (React Native / Flutter / native / KMP), assessed on offline-first support and health-API access.
- What happens on device migration when there is no server (raised by the Phase 1 "Vault" candidate but never answered).

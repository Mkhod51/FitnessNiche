# Product overview

**Status:** current product narrative. Mutable implementation claims belong in the [feature status matrix](../reference/feature-status.md).

MyoStat is a local-first strength, nutrition, and bodyweight tracker for an intermediate lifter running a structured programme during a cut, maintenance phase, or bulk. That lifter commonly uses one app for training, another for food, and memory or a spreadsheet to decide whether the two stories agree. MyoStat puts those records in one place and performs the reconciliation without pretending noisy measurements are exact.

The differentiator is not generic coaching copy. Advice is selected deterministically from a curated claim corpus. Each displayed recommendation is bound to a stored claim identifier; its grade, certainty language, citations, and dissent come from that record. Search returns relevant claims rather than a generated answer. Personal advice appears only when the logged snapshot satisfies the claim's predicates. The runtime advice path does not use an LLM. See the [claim schema](../../app/claims/schema.md), [advice engine](../../app/src/advice/engine.ts), and [claim-card provenance tests](../../app/src/components/ClaimCard.test.tsx).

## The product promise

In MyoStat, “honest” has concrete meanings:

- A grade is visible with the advice, and wording is calibrated to that grade rather than improvised.
- Contested claims expose both sides; citations and extracted evidence are available as depth on demand.
- User trends distinguish signal from noise. The e1RM trend needs enough qualifying observations and carries a confidence band; the weight trend is smoothed instead of treating each weigh-in as truth.
- Population volume ranges are labelled as population context, not personalised MEV or MRV.
- Missing or insufficient data produces an unresolved or empty state, not invented precision.
- Safety constraints are in code: maintenance is the default goal, the daily deficit is capped, and calorie floors constrain saved targets.
- The interface avoids restriction streaks, “days under budget,” and eat-back-to-zero framing.

The durable commitments, target user, principles, and non-goals remain in the [product contract](../../PRODUCT.md). The [safety and privacy guide](safety-privacy.md) explains the exact guardrails and current limitations.

## Local-first by default

The on-device SQLite database is the primary write path. The app prefers OPFS SAH-pool storage and can fall back to a memory database backed by an IndexedDB snapshot; a visible warning appears when durable OPFS storage is unavailable. The installable PWA precaches its shell and core assets, and the tested core logging flows continue offline once the shell has loaded. An offline hard refresh on a deep route is still limited; the root route is the verified reload entry. See [database initialisation](../../app/src/db/client.ts), [application boot](../../app/src/App.tsx), and the [offline browser tests](../../app/e2e/log-offline.spec.ts).

Sync is optional. When configured, it replicates selected log tables to the supplied server and stores the bearer token locally; it does not replace local writes. A browser-to-deployed-Worker/D1 replication path is not yet covered end to end. Export and device-only erasure are available in Settings. Server-side or cross-device erasure is not.

## What exists today

The eight implemented routes cover a Hub, training log, nutrition day, goal setup, bodyweight log, settings, trends, and weekly review. Hub, Train, and Eat form the persistent bottom tab bar. The [complete feature tour](feature-tour.md) traces every visible workflow, data read/write, state, and next action. The [feature status matrix](../reference/feature-status.md) separates implementation from verification and records known gaps rather than treating a plan or screenshot as proof.

The evidence bundle currently contains 32 authored claim YAML files, below the roughly 50-claim v1 target, and its review ledger is mixed rather than complete. A Hevy CSV parser exists and is unit-tested, but no route, file picker, or import-to-database workflow exposes it to users. Those boundaries are deliberate documentation, not footnotes.

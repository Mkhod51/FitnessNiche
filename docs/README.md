# MyoStat documentation

This is the router for the product, engineering, evidence, and historical material in this repository. Start with the path that matches the question you are trying to answer; use [feature status](reference/feature-status.md) for mutable completion claims.

## Document labels

- **Current** — describes the implementation or an actively maintained operational guide.
- **Normative** — defines intended product or engineering behaviour; it is not proof that every item is implemented.
- **Generated** — produced from source data or a repeatable tool and should not be hand-edited.
- **Historical** — preserves research, decisions, plans, or status from a point in time; it is context, not current truth.

## 1. App and recruiter tour

Read this path for the product story, the implemented user loop, and the safety posture:

1. [Product overview](product/overview.md) — **Current** product promise, audience, and non-goals.
2. [Feature tour](product/feature-tour.md) — **Current** route and workflow guide.
3. [Safety and privacy](product/safety-privacy.md) — **Current** guardrails, consent, local storage, export, and erasure boundaries.
4. [Feature status](reference/feature-status.md) — **Current** implementation states, verification states, and known gaps.
5. [Product contract](../PRODUCT.md) — **Normative** durable product thesis and principles.
6. [Visual design contract](../DESIGN.md) — **Normative** interaction and visual language.

The screenshot inventory is intentionally empty until reproducible synthetic-data captures exist; its ownership rules are recorded in the [visual asset guide](assets/screenshots/README.md).

## 2. Developer setup and architecture

Read this path to run the app, understand its boundaries, and find the relevant source:

1. [Development guide](guides/development.md) — **Current** setup, commands, and contributor conventions.
2. [System overview](architecture/system-overview.md) — **Current** high-level components and online/offline boundaries.
3. [Local-first storage](architecture/local-first-storage.md) and [data model](architecture/data-model.md) — **Current** persistence and schema responsibilities.
4. [Advice engine](architecture/advice-engine.md), [JSON Logic](architecture/json-logic.md), and [domain algorithms](architecture/domain-algorithms.md) — **Current** deterministic trust path and calculations.
5. [Sync](architecture/sync.md) — **Current** optional replication design and its verification boundary.
6. [Testing](guides/testing.md) and [deployment](guides/deployment.md) — **Current** verification and operation guides.
7. [Repository map](reference/repository-map.md) and [terminology](reference/terminology.md) — **Current** lookup references.

The [requirements](REQUIREMENTS.md) are **Normative**. The [requirements traceability matrix](reference/requirements-traceability.md) connects those targets to current code and tests without treating a target as shipped merely because it is specified.

## 3. Evidence and claim curation

Read this path to understand what advice is allowed to say and how a claim enters the app:

1. [Evidence curation guide](guides/evidence-curation.md) — **Current** map of the authoring and review workflow.
2. [Advice engine](architecture/advice-engine.md) — **Current** runtime selection and provenance chain.
3. [JSON Logic subset](architecture/json-logic.md) — **Current** supported predicate grammar and fail-closed behaviour.
4. [Evidence standards](00-meta/evidence-standards.md) — **Normative** grading rubric.
5. [Adding a claim](../app/claims/ADDING-A-CLAIM.md) and [claim schema](../app/claims/schema.md) — **Normative** authoring contract.
6. [`claims.ts`](../app/src/generated/claims.ts) — **Generated** runtime claim bundle; regenerate it from YAML rather than editing it.
7. [Claim review queue](00-meta/claim-review-queue.md) and [`review-ledger.json`](../app/claims/review-ledger.json) — **Current** review operations and machine-readable ledger.

## 4. Historical research and decisions

Read this path for the reasoning that led to MyoStat and for dated records:

- [Thesis review](03-thesis-review/review.md) — **Historical research** that selected the evidence-graded product direction.
- Supporting research on the [target audience](01-research/users/segments/science-based-lifters.md), [training evidence](01-research/domain/science-based-training-evidence.md), and [architecture patterns](01-research/technical/architecture-patterns.md) — **Historical research**; useful context, not runtime authority.
- Original [landscape notes](04-sources/raw-notes/phase3-a-landscape.md) and [literature notes](04-sources/raw-notes/phase3-b-literature.md) — **Historical source notes** retained for auditability.
- [Decision log](00-meta/decision-log.md) — **Historical decisions** with their original rationale.
- [Current project state](PROJECT-STATE.md), [build compatibility/roadmap](BUILD-PLAN.md), and [open questions](OPEN-QUESTIONS.md) — maintained project ledgers; each entry carries its own current or historical framing.
- [Pre-overhaul documentation manifest](archive/documentation-pre-overhaul-2026-09-19/MANIFEST.md) — **Historical** snapshot map and audit notes.
- [Build-history archive index](archive/build-history/README.md) — **Historical** superseded prompts and migration notes; the dated manifest above links the pre-overhaul canonical documents.

When prose disagrees, current runtime source, tests, claim YAML, and migrations outrank historical documents. Requirements still define the intended contract; [feature status](reference/feature-status.md) records how much of that contract is implemented and verified.

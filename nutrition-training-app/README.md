# Project Zero: Ideation Sprint — Combined Nutrition + Training App

One-round research sprint to land a differentiated, buildable concept for a solo 2–3 month v1. Orchestrated by an architect model; four parallel research streams (two Sonnet 5, two Opus 4.8); every consequential call logged in [decisions.md](decisions.md).

## What was researched

| Stream | File | Question |
|---|---|---|
| A | [research/landscape.md](research/landscape.md) | Which incumbent weaknesses are structural (irreversible) vs surface (copyable fixes)? Why has MFP's database problem survived a decade? |
| B | [research/integration-thesis.md](research/integration-thesis.md) | The premise test: what can a combined app compute that two separate apps fundamentally cannot? |
| C | [research/data-and-segments.md](research/data-and-segments.md) | Is the food-database moat surmountable solo (UK-based)? Which segments are underserved by hard constraint? |
| D | [research/constraints.md](research/constraints.md) | ED harm-reduction baseline (veto power), MHRA/MDR/GDPR lines, retention reality, offline-first sync |

## Headline findings

- **The combined-app premise fails as a computational moat and survives as something better-grounded:** there is no unique calculation, but there is one honest cross-domain read — bodyweight trend vs strength trend — built on the only two low-noise signals consumer logging produces [A/B]. Everything else (RED-S detection, protein timing, phase periodization) died on evidence, data quality, or regulation.
- **Approximate logging sustained beats precise logging abandoned** (5 RCTs [A/B]) — the entire logging layer should default to tiers/quick-add, which incumbents' business models prevent them from leading with.
- **The food-database moat is surmountable solo:** Open Food Facts (UK barcodes) + CoFID (UK-government-verified generics) + USDA FDC (CC0 fallback) — all free; commercial APIs are US-gated or ToS-hostile.
- **Hard fences:** disease detection of any kind = regulated medical device; ED-safe design means removed affordances (hard calorie floor, deficit cap, maintenance default, numbers-hidden mode), not warnings; health data stays on-device (GDPR + offline-first align).

## Recommended project

**Verdict** ([ideation/recommended.md](ideation/recommended.md)) — a combined lift-and-food logger whose identity is one honest, evidence-bounded read: *is your plan working?* Recomp/cut/bulk verdicts from weight-trend × e1RM-trend reconciliation, training-day protein compliance [A], a weekly one-page Coach Read, tier-based logging by default, Hevy/Strong CSV import for a day-one verdict. Chosen over 11 alternatives ([ideation/candidates.md](ideation/candidates.md), [ideation/ranking.md](ideation/ranking.md)); runner-up **Leucine Ledger** (plant-based protein-quality tracker) wins instead if the developer is plant-based — flip condition recorded.

## Strongest objection

**Payoff latency vs churn:** the verdict needs 4–6 weeks of data; median tracker churn is under 2. CSV import mitigates for two-app switchers, does nothing for newcomers. This is the failure mode to bet on, and it's stated, not hedged, in [recommended.md](ideation/recommended.md). (Second: MacroFactor is one team decision away from shipping the same read.)

## What planning should tackle first

1. **CSV import + verdict engine as the first vertical slice** — the survival requirement, not a nice-to-have (decisions.md §5.6).
2. **e1RM estimation + trend smoothing spec** — which formula (Epley/Brzycki), what smoothing window, how the rules engine expresses uncertainty honestly.
3. **The open-data pipeline** — OFF UK dump filtering, CoFID ingestion, dedup/matching, the contribute-back loop.
4. **Offline-first schema** — append-log entry model, LWW sync, on-device-by-default (also the GDPR strategy).

See [ideation/what-not-to-build.md](ideation/what-not-to-build.md) before adding any feature.

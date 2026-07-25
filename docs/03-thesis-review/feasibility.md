# Feasibility — Building the Citation-Graded Advice Product (solo, 2–3 months)

Consolidates and extends the feasibility scattered across Phase 3 ([review §5](review.md), [citation-infrastructure.md](../01-research/technical/citation-infrastructure.md)) into a build-oriented assessment now that the idea is chosen. Verdict up front: **feasible for a portfolio v1 if scoped hard; the long pole is human curation, not code.**

Evidence/confidence tags as elsewhere: [A]–[D]; engineering-effort figures are (inference) from the component analysis unless cited.

## What the product actually is (build scope)
A combined training + nutrition tracker (the Phase 2 base) **plus** an advice layer that surfaces evidence-graded, cited claims — deterministically selected, contextualised to logged data, rendered with confidence-calibrated language and citations-on-demand. Two halves:
1. **The tracker** — lift logging, weight/intake logging, e1RM regression trend, per-muscle volume, the Phase 2 cut/bulk reconciliation. Mostly conventional app engineering.
2. **The advice engine** — the differentiator; see [advice-strategies.md](advice-strategies.md). Deterministic rules + retrieval over a curated claim DB, no LLM in the trust path.

## Component-by-component feasibility

| Component | Feasibility | Notes |
|---|---|---|
| **Citation infrastructure** | **Solved** | OpenAlex (CC0 metadata + abstracts + citation graph) as backbone, Europe PMC for OA full text, CrossRef for DOI resolution. No API cost, no licensing wall on metadata. [Stream C] |
| **Copyright-safe figures** | **Solved, with a design rule** | Extracted numbers (effect size, n, CI, p) are **not copyrightable** — re-plot them in the app's own style; never embed the publisher's figure image; don't bulk-ingest a whole proprietary table (UK database right). "Show me the figures" = re-plotted data. [Stream C] |
| **Claim DB (curation)** | **Feasible but it's the long pole** | ~50 claims × (read full text + extract numbers + grade + write predicates + calibrated phrasing) ≈ 50–75 hrs (inference). This is the moat *and* the permanent maintenance cost. Scope to ~50 high-leverage claims for v1. |
| **Advice engine (S1 rules + S2 retrieval + S5 data-earned)** | **Standard app dev** | Predicate evaluator + embedding search over 50 claims is trivial scale; the design work (structural claim-provenance) matters more than the code. No LLM needed for v1. |
| **Tracker + reconciliation engine** | **Feasible (Phase 2 established)** | e1RM as a many-point regression from RIR≤3/≤10-rep sets; weight/intake trend; the reconciliation verdict. Honesty constraints already specified in [decision-log](../00-meta/decision-log.md). |
| **Food/nutrition data** | **Solved (Phase 1/2)** | Open Food Facts (UK barcodes) + CoFID (UK-gov generics) + USDA FDC (CC0). Free, self-hostable. [data-sources.md](../01-research/technical/data-sources.md) |
| **Offline-first + storage** | **Feasible, don't over-build** | Local SQLite + append-log + last-write-wins on timestamp; no CRDTs. Aligns with GDPR (data on-device). [architecture-patterns.md](../01-research/technical/architecture-patterns.md) |
| **Cross-platform for a solo dev** | **Feasible** | A single cross-platform stack (e.g. React Native / Flutter) covers iOS+Android; offline-first SQLite libraries exist for both. On-device embedding for S2 is optional (can start with a tiny in-memory search over 50 claims — no ML infra needed). |

## The honest cost breakdown
The infrastructure is *not* the hard part — Stream C removed that worry. The real costs, ranked:
1. **Claim curation (~50–75 hrs, ongoing).** Reading, extracting, grading, and writing predicates + calibrated phrasing for each claim. This is irreducible human labour and the permanent maintenance burden (new meta-analyses supersede; retractions). It is *why* citation-rich competitors keep evidence in a slow content layer and haven't shipped it in-app.
2. **The A+C interaction design.** Making confidence-graded-but-decisive advice feel honest *and* pleasant (not a lecture) is a genuine UX problem — the thesis's real risk, above the technical (review §4).
3. **Standard app build** — logging, trends, sync, food DB integration. Real but well-trodden.

## A rough 12-week shape (sketch, not a plan)
- **Wks 1–2:** data model (incl. the `claim` schema with structural provenance), offline SQLite + logging skeleton.
- **Wks 3–4:** curate the first ~15–20 claims end-to-end; build the deterministic advice engine (S1) against them; prove the **A+C interaction** on a real claim. *This is the risk-retiring milestone — do it early.*
- **Wks 5–7:** the tracker + Phase 2 reconciliation; wire S5 data-earned triggers.
- **Wks 8–9:** finish curation to ~50 claims; retrieval (S2) question surface; contested-cluster + steelman rendering.
- **Wks 10–11:** food DB integration, polish, calibrated-language pass.
- **Wk 12:** the demo — the A+C interaction plus one data-earned advice moment. Buffer.
- Explicitly **not** in v1: LLM phrasing (S3/S4 later, behind the validator), supersession automation (ship the date field), wearables, social.

## Risks that affect feasibility (not just desirability)
- **Curation sustainability** — a solo dev may not keep ~50 graded claims current; stale-citation-with-authority is worse than no citation (review concern #3). Mitigation: small scope + a manual review-queue with `last_reviewed` dates.
- **Demand-side (the top risk, but not a *build* risk)** — whether de-mythologising is a product people sustain using (review concern #1). Doesn't block the build; does determine whether it's worth more than a portfolio piece.
- **MacroFactor could occupy the slot** — researcher-built, trusted, already a tracker (review concern #4). Defensibility is "they haven't," not "they can't."
- **Copyright at scale** — fine for re-plotted extracted numbers + short attributed quotes; get real legal review before any commercial launch, especially before ingesting figures or whole tables (Stream C).

## Verdict
**Buildable as a portfolio v1 in the window, if scoped to ~50 curated claims and a deterministic advice engine, proving the A+C interaction in the first month.** Nothing here is a hidden research project — the infrastructure is solved and the engine is standard once the structural-provenance decision is made. The project's difficulty is honest human curation and one hard UX interaction, not unknown technology — which is exactly the profile you want for a solo build you can actually finish and defend. The thing to validate *before* betting beyond a portfolio piece is demand (concern #1), and that validation is cheap: put graded sacred-cow claims in front of the real audience and watch whether they lean in.

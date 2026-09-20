# Evidence curation guide

**Status:** current navigation page; the complete workflow map is owned by documentation Task 6.

Claims are researched and reviewed as individual YAML records, validated at build time, and compiled into a committed typed bundle. The runtime consumes that bundle; the review ledger is operational evidence, not runtime input.

Use these authoritative resources:

- [Evidence standards](../00-meta/evidence-standards.md) — grading rubric.
- [Adding a claim](../../app/claims/ADDING-A-CLAIM.md) — authoring workflow.
- [Claim schema](../../app/claims/schema.md) — field contract.
- [`review-ledger.json`](../../app/claims/review-ledger.json) — review state.
- [Claim review queue](../00-meta/claim-review-queue.md) — curation operations.

Run `npm run claims` from `app/` after editing claim YAML and audit DOI metadata with `npm run claims:audit-dois` when network access is appropriate.

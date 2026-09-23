# Evidence curation guide

This is a navigation page, not a second authoring manual. The workflow is:

**discover → resolve DOI → read direct source → extract only what was read →
record ledger evidence → two hostile reviews → author one claim YAML → build and
test**

Use the authoritative resource at each step:

1. Grade the claim—not merely the paper—against the
   [evidence standards](../00-meta/evidence-standards.md).
2. Follow [Adding or amending a claim](../../app/claims/ADDING-A-CLAIM.md) for
   discovery, direct reading, extraction, hostile review, authoring, and
   amendment.
3. Use the [claim schema](../../app/claims/schema.md) for every field, allowed
   value, and null meaning. Predicate authors should also check the exact
   [restricted JSON Logic grammar](../architecture/json-logic.md).
4. Write field-level curation evidence to
   [`review-ledger.json`](../../app/claims/review-ledger.json) and use the
   [claim review queue](../00-meta/claim-review-queue.md) for merge gates and
   pending work. The ledger is not runtime input.
5. For a DOI batch, run `npm run claims:audit-dois` from `app/`; the
   [DOI audit](../../app/scripts/audit-claim-dois.ts) queries Crossref and emits
   review data. A resolving DOI establishes identity, not truth, scope, or
   review completion.
6. Run `npm run claims` from `app/`. The
   [claim build](../../app/scripts/build-claims.ts) validates YAML, checks
   corpus-wide relationships, and regenerates the committed typed bundle.
7. Run `npm test -- --run`. The
   [generated-file drift test](../../app/scripts/build-claims.test.ts) rebuilds
   in memory and requires `src/generated/claims.ts` to match exactly.

Do not hand-edit the generated bundle or fill unreadable fields from summaries,
memory, or plausible defaults. A successful build proves structural consistency
only; it does not prove a direct-source read or two reviewer sign-offs.

The current ledger is intentionally mixed. It contains reviewed direct-source
records alongside historical `pending-M6-review` records and candidate intake
entries. Preserve pending states until the work happens; never backfill a
location, rationale, reviewer, or date.

For the runtime boundary, selection routes, and UI provenance, see
[Advice engine and evidence trust path](../architecture/advice-engine.md).

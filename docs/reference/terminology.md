# Terminology

**Status:** current product and implementation glossary.

- **Advice event** — a local record that a claim was selected, shown, or suppressed on a particular surface. It supports cooldown and permanent suppression.
- **Automatic advice** — a claim selected from deterministic predicates and the user's local snapshot, without the user first searching the corpus.
- **Claim** — a curated, graded statement with a stable identifier, one or more citations, allowed surfaces, and optional predicates, dissent, or extracted figure data.
- **Claim identifier (`claim_id`)** — the stable key connecting rendered advice to its stored statement, grade, and citations. Advice substance is not authored freehand in a feature component.
- **Confidence band** — the interval drawn around an estimated trend. It communicates uncertainty in the fitted relationship, not certainty about future performance.
- **Consent gate** — the route boundary that requires separate acceptance before personal logging or analysis and fails closed when consent cannot be read or saved.
- **Cooldown** — a time window during which a previously surfaced claim is ineligible to appear automatically again.
- **CoFID** — the UK Composition of Foods Integrated Dataset. MyoStat currently ships a small curated CoFID-derived common-food seed, not the full catalogue.
- **Data-earned advice** — advice that becomes eligible because the user's logged snapshot satisfies the stored claim predicates.
- **Device erasure** — irreversible hard deletion of local user records on the current device. It is not server-side or cross-device erasure.
- **Dissent** — a stored counter-position presented for a contested claim so a citation is not mistaken for consensus.
- **e1RM** — estimated one-repetition maximum. MyoStat uses qualifying weight/reps/RIR observations and a many-point trend rather than presenting one set as ground truth.
- **Eat-back framing** — treating exercise as calories that must be eaten or burned back to reach zero. MyoStat intentionally avoids this framing.
- **Evidence grade** — the A–D support classification defined by the [evidence rubric](../00-meta/evidence-standards.md). A grade belongs to the general claim, not to a diagnosis or personal prediction.
- **Evidence panel** — the expanded claim view containing citations, review metadata, dissent, attributed excerpts, and any MyoStat-rendered figure.
- **EWMA** — exponentially weighted moving average. MyoStat uses a seven-day-half-life EWMA to smooth bodyweight noise.
- **Hard delete** — removal of a local row rather than setting a deletion timestamp. Device erasure uses hard deletion.
- **Hevy parser** — the tested CSV parser in the repository. It is not a user-facing import workflow because no route, file picker, or persistence flow calls it.
- **Last-write-wins (LWW)** — the deterministic sync merge rule that resolves versions by timestamp and a canonical-content tie-breaker. It is not a CRDT.
- **Local-first** — the on-device database is the primary write path; optional network sync replicates selected records rather than becoming the primary store.
- **Numbers-hidden mode** — the harm-reduction preference that suppresses selected bodyweight/nutrition figures. Current coverage is partial; Hub and Weight still leak bodyweight figures, while Goal intentionally reveals editable targets.
- **Open Food Facts (OFF)** — the online food provider used for explicit text search and barcode lookup. Provider results missing required macro fields are rejected.
- **OPFS SAH pool** — the preferred browser storage mode for the SQLite database, using Origin Private File System synchronous access handles.
- **Population range** — study/population context, such as the 10–20 weekly-set band. It is not a personalised MEV or MRV target.
- **Previous-set fallback** — workout behaviour that fills a blank weight or reps value from the most recent completed set; an explicit zero remains zero.
- **RIR** — repetitions in reserve, an effort estimate stored on qualifying working sets. Warm-ups do not accept RIR in the logger.
- **Snapshot** — deterministic user-state input evaluated against claim predicates. It can include recent training, nutrition, weight, goal, and advice history.
- **Surface** — a product context in which a claim may be shown, such as empty Hub, workout, goal setup, or weekly review.
- **Suppression** — a user's durable choice not to see a particular claim automatically again; it does not delete the claim from browse/search.
- **Tombstone** — a soft-delete marker used for individual replicated records so optional sync can carry a deletion to another replica.
- **Unresolved** — a review/trend outcome where required data or signal strength is insufficient. It is an honest result, not an application error.
- **Warm-up set** — a non-working set marked separately in the workout log. It is excluded from finish-summary e1RM qualification, but a known aggregation defect currently includes it in weekly muscle volume.
- **Wellness-only** — the boundary that excludes disease diagnosis, detection, screening, monitoring, or management and requires signposting rather than clinical advice.

For normative claim fields see the [claim schema](../../app/claims/schema.md); for mutable implementation status see the [feature status matrix](feature-status.md); for end-user workflows see the [feature tour](../product/feature-tour.md).

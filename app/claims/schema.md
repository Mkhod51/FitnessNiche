# Authoring a claim by hand

> **Looking for the workflow rather than the field list?** See
> [ADDING-A-CLAIM.md](ADDING-A-CLAIM.md) — how to find a paper, verify its DOI,
> extract figures, grade it, and amend a claim later. This file is the
> reference for what each field *means*; that one is the procedure.

This is the doc you read before writing a claim file. A claim is a YAML
document that mirrors the `Claim` type in `src/advice/types.ts` 1:1 and is
validated against `claimSchema` (`src/advice/claim-schema.ts`) by
`scripts/build-claims.ts` before it ever reaches the app. If a field here
doesn't map to something you can point at in the source paper, leave it
null — do not fill the blank with a plausible-sounding guess.

> **`n`, `effectSize`, `ci`, `quote` may be null.** Much of this literature is
> paywalled. An abstract usually gives you n and the direction of effect but
> rarely the confidence interval. If you could not read the number in the
> source document itself, the field stays null and the UI renders the
> absence honestly. **Never fill a field from a secondary source's
> description of a paper, from a search-engine summary, or from memory of
> "typical values". A missing CI is honest; an invented one is fraud.**

## `Claim` fields

- **`id`** — `c-<domain>-<slug>`, e.g. `c-volume-mev-hypertrophy`. Lowercase,
  hyphenated, matches `^c-[a-z0-9-]+$`. `<domain>` should match the
  `domain` field below so ids sort and group predictably. Once shipped, an
  id is permanent — superseding a claim means adding a new id and pointing
  `supersededBy` at it, not renaming this one.
- **`statement`** — the claim in plain English, one sentence, no hedging
  baked into the wording (grade and citations carry the confidence; the
  statement just says what's claimed).
- **`peekStatement`** — required curated short form for the advice peek. It
  must be a complete sentence (maximum 100 characters), not a UI truncation,
  and must retain the qualification that stops the full statement being
  overstated.
- **`grade`** — `A` | `B` | `C` | `D`. The evidence-quality grade. This is
  what the UI's calibrated-language layer (`language.ts`, a later task)
  uses to pick a verb — a `C` claim can never render as "proven". Grade the
  evidence, not your enthusiasm for the finding.
- **`status`** — `settled` | `contested`. `contested` means credible
  evidence disagrees with this claim's direction or magnitude, not merely
  that someone online disputes it.
- **`domain`** — a short topic tag (`volume`, `protein-timing`,
  `deloads`, …). Used for grouping and for building the id prefix.
- **`predicates`** — a json-logic rule object, or `null`. `null` means this
  claim is never rule-triggered — it only ever surfaces when a user
  searches for it via the "ask the evidence" surface. Most claims will
  start as `null`; only add predicates once you know the exact
  `UserStateSnapshot` condition that should surface this claim
  unprompted.
- **`trigger`** — `rule` | `data-earned` | `null`. It must be `null` exactly
  when `predicates` is `null`. `data-earned` is reserved for conclusions whose
  context is established by reliable logged data; configured targets and
  general facts are not data-earned.
- **`surfaceContexts`** — an array of explicit general-evidence selection
  contexts, or `null` (the default). This metadata is separate from JSON Logic:
  it says where a non-personal claim may be considered, not what the user's
  snapshot proves. Supported entries are:

  - `{ surface: hub-empty }`
  - `{ surface: exercise-selection, exerciseIds?: [...], populations?: [...] }`
  - `{ surface: goal-draft, goals: [cut | bulk | maintain, ...] }`

  Omitting `exerciseIds` makes an exercise-selection entry general. Exercise
  ids must exist in `src/db/seed-exercises.ts`; populations use the same four
  values as citations. Goal lists must contain at least one known, non-duplicate
  goal. A `data-earned` claim may not carry surface contexts because a general
  surface must never masquerade as a conclusion earned from the user's data.
- **`clusterId`** — a shared string for claims that argue opposite sides of
  the same question (e.g. two `protein-timing` claims might both carry
  `clusterId: "protein-timing-window"`). **Mandatory whenever `status` is
  `contested`** — the schema rejects a contested claim with no
  `clusterId`, because without it the UI has no way to find the opposing
  claim and would render only one side as if it were the whole picture
  (FR-ADV-6). Leave it `null` for `settled` claims with no opposing side to
  show.
- **`phrasingKey`** — a stable slug the calibrated-language layer keys off
  to pick a headline template. Changing this changes which rendered
  sentence a user sees, independent of the `id`.
- **`supersededBy`** — `null`, or the `id` of the claim that replaces this
  one once newer evidence changes the picture. Keep the old claim in the
  file (for audit trail / citation history) rather than deleting it.
- **`lastReviewed`** — ISO date, `YYYY-MM-DD`. **FR-CLAIM-4.** This is the
  date a human last checked this claim's wording and grade against the
  current literature — not the date the YAML file happened to be edited
  for a typo or reformat. Bump it only when you've actually re-reviewed the
  evidence.
- **`citations`** — array of `Citation`, **minimum one**. A claim with zero
  citations fails validation outright: **FR-ADV-1, a claim with no citation
  is not a claim.**

## Curation ledger and review state

The claim YAML is the app bundle; [`review-ledger.json`](review-ledger.json) is
the curation record and is never read at runtime. It has one entry per claim /
citation pair and records DOI resolution, source-read mode, exact evidence
locations, null rationales, population and grade rationale, two hostile reviews,
and the next review date.

Run `npm run claims:audit-dois` manually for a Crossref DOI-resolution batch.
It emits JSON for the ledger and is deliberately excluded from normal claim
generation, tests, builds, and runtime. A resolved DOI proves only that the DOI
resolves; it does not prove the stored claim facts.

Before a new claim merges, two independent readers review the direct source and
record their checks in the ledger. They must challenge statement scope, grade,
population applicability, every stored value and quote, `peekStatement`, and
any predicate. Historical M1 entries without a recorded source location or
review must stay `pending-M6-review`; never fabricate a locator or sign-off.

## `Citation` fields

- **`id`** — a short stable id for this citation, e.g. `cit-<domain>-1`.
- **`claimId`** — must exactly equal the parent claim's `id`. The schema
  enforces this so a citation can never drift onto a different claim's
  record than the one that shipped with it.
- **`doi`** — the bare DOI, e.g. `10.1080/02640414.2016.1210197` — no
  `https://doi.org/` prefix, no "see paper" placeholders. This is the one
  field standing between a claim and being unverifiable, so it's validated
  against a DOI-shaped regex, not just "any string".
- **`authors`**, **`year`**, **`journal`** — bibliographic fields, taken
  directly from the paper. **`year` is the journal issue year — the version
  of record, as PubMed indexes it — not CrossRef's registered date.** The
  two disagree often, because CrossRef registers the online-first date: the
  protein-dose meta-analysis is registered 2017 but is universally cited as
  Morton 2018, and the volume/frequency meta-regression is registered 2025
  against a February 2026 issue. Use the year a reader will see when they
  look the paper up, or the citation we render won't match the one they
  find. CrossRef remains the authority for whether the DOI *resolves* — it
  is just not the authority for how the paper is cited.
- **`n`** — sample size, as a positive integer, or `null` if the source
  didn't state one you could read. Never estimate n from a description
  like "a large cohort".
- **`population`** — `trained` | `untrained` | `mixed` | `unstated`.
  Whichever the study population actually was — this is a first-class field
  in the evidence panel precisely because population changes what a finding
  generalizes to. **Use `unstated` when the source you could actually read
  never said.** That is common: much of this literature is paywalled and
  plenty of abstracts describe the intervention without describing the
  subjects. `unstated` is the honest value and the UI renders it as such —
  guessing `mixed` to fill the slot is the same inference the null rule
  above forbids, and it quietly defeats FR-CLAIM-5, which can only drop a
  grade for a population mismatch you can actually see. If a claim is
  *about* trained lifters and every citation behind it is `unstated`, that
  is a signal to grade down, not a detail to wave through.
- **`effectSize`** — free-text description of the effect (e.g. "+1.2 kg
  lean mass, d=0.4"), or `null` if the paper doesn't give you one you can
  read directly.
- **`ci`** — the confidence interval as reported, or `null`. See the
  blockquote above — this is the field most often null, and that's fine.
- **`figures`** — an array of `{ label, value, unit? }`. These are
  **individual extracted numbers**, not images. **GR-3: publisher figure
  images may never be embedded** — anywhere a paper's figure matters, pull
  the underlying numbers here and the app re-plots them in its own chart
  style. An empty array is fine if there's nothing worth re-plotting.
- **`quote`** — a short, attributed quote from the source, or `null`. Keep
  it brief (a sentence, not a paragraph) — this is for a pull-quote in the
  evidence panel, not a reproduction of the paper's text.

## What "null" means here, one more time

For evidence fields (`n`, `effectSize`, `ci`, `quote`), `null` means **"not
established from a source I actually read."** For selection fields,
`predicates: null`, `trigger: null`, and `surfaceContexts: null` mean the claim
has no authored automatic route of that kind. `clusterId` and `supersededBy`
remain null when those relationships do not exist. None of these nulls is a
placeholder to paper over with a default, inferred number, or guessed context.

Record the source-specific reason for each null or `unstated` population value
in the review ledger. The field remains null when no direct-source fact exists;
the rationale makes that absence auditable rather than silently ambiguous.

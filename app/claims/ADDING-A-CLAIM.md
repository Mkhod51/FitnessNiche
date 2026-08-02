# Adding or amending a claim

`schema.md` is the field reference — what every field means and what may be null.
This is the **procedure**: how to get from "I think the app should say something
about X" to a committed, validated claim.

Budget about 20–40 minutes per claim. Most of that is reading, not typing. If a
claim takes five minutes you have almost certainly skipped a step below.

---

## The chain, and why it has six links

**discover → resolve the DOI → read the source → extract → ledger → two hostile reviews**

Skipping the middle two is how a product whose entire premise is "structurally
incapable of fabricating a citation" ships a fabricated citation. No test in this
repo can catch it: the schema checks that a DOI is *shaped* like a DOI, not that
the number next to it appears anywhere in the paper. You are the only check on
that, so the process below is the safeguard.

**Search engines and chat assistants are discovery tools, never evidence tools.**
They will find you papers you would not have found. They will also mis-attribute
a finding, merge two studies, and state a sample size that appears in neither.
Use them to learn *which papers exist*, then throw their prose away and read the
source. If a summary and the paper disagree, the paper wins and the summary was
noise.

---

## 1. Discover — find the synthesis first

Lead with PubMed's publication-type filters. They are hand-assigned by MEDLINE
indexers and are the only reliable way to filter by study *design* — which
matters because the top grade is defined by design. Find the meta-analysis before
you find the primary trials; grading upward from whatever you happened to read
first is how grade inflation happens.

```bash
Q='("resistance training"[tiab] AND deload[tiab]) AND ("Meta-Analysis"[pt] OR "Systematic Review"[pt])'
curl -s -G "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi" \
  --data-urlencode db=pubmed --data-urlencode "term=$Q" \
  --data-urlencode retmax=20 --data-urlencode retmode=json --data-urlencode sort=relevance
```

Swap in `"Randomized Controlled Trial"[pt]` only after you have established that
no synthesis exists. **Record that absence** — "searched for a meta-analysis on
deloads, found none" is itself a finding, and it belongs in the claim's
`effectSize` prose where a reader can see it.

Turn PMIDs into titles with `esummary.fcgi`, and read abstracts with
`efetch.fcgi` (`rettype=abstract&retmode=text`), same URL shape as above.

## 2. Resolve the DOI — independently

```bash
./scripts/verify-doi.sh 10.1136/bjsports-2017-097608
```

This resolves against CrossRef and tells you whether Europe PMC has open-access
full text, printing the exact command to fetch it. **If it does not resolve, the
citation does not go in the file.** No exceptions, however confident you are that
the paper exists.

## 3. Read the source

With full text, extract from the results section. Without it — and much of this
literature is paywalled — you get the abstract and no further. An abstract
usually gives you n and the direction of effect, and rarely gives you a
confidence interval.

## 4. Extract, and leave the gaps as gaps

Every number in a claim file must be one you read in the source document.
Never infer, never round from memory, never use "typical values", and never take
a figure from another paper's description of this one.

`n`, `effectSize`, `ci` and `quote` are nullable, and `population` accepts
`unstated`, precisely so you can tell the truth about a paywalled paper. **A
missing confidence interval is honest; an invented one is fraud.** The UI renders
absence explicitly — it does not show a blank.

## 5. Record the curation evidence before drafting

Add one entry per citation to [`review-ledger.json`](review-ledger.json) before
the claim can merge. Run `npm run claims:audit-dois` manually when checking a
batch of DOIs; it queries Crossref only and prints JSON for review. It is never
part of `npm run claims`, tests, builds, or the app runtime.

For each entry record the exact source location for every stored fact (for
example, abstract, Results paragraph, table, or supplement page), the way the
source was read, and a rationale for every `null` or `unstated` value. Record
why the source population applies (or does not apply) and why the claim's grade
matches the evidence. Do not invent a page number, source-reading mode, or
review date for historical records: leave it visibly pending until it is read.

Two independent readers must each perform a hostile review against the direct
source. They check statement scope, grade, population, extracted values,
`peekStatement`, predicates, and any surface contexts. Record both reviews and
a next-review date in the ledger. A successful DOI resolution is not a source
review.

## 6. Grade it

Against `../../docs/00-meta/evidence-standards.md`, not against how convincing
the paper felt.

| | |
|---|---|
| **A** | Meta-analysis, systematic review with quantitative synthesis, or replicated RCT |
| **B** | One good study, or consistent observational evidence across studies |
| **C** | Mechanism, small-n, or expert consensus with no trial evidence |
| **D** | Industry material, marketing, single anecdote |

Three rules that actually bite:

- **Grade the claim, not the source.** A meta-analysis quoted for something it
  did not measure is [C]. A meta-regression whose authors call it exploratory and
  write "caution is warranted" does not confer [A] on the claim built from it.
- **A non-significant result is not evidence of equivalence.** "No significant
  difference (p = 0.28)" means the study failed to detect a difference, which is
  compatible with a real one it was underpowered to see. Do not write that up as
  "X does not affect Y" at [A].
- **Population mismatch drops a grade** (FR-CLAIM-5). A claim about trained
  lifters resting on untrained subjects loses a grade. If every citation behind a
  trained-lifter claim is `population: unstated`, that is a reason to grade down.

Then read the finished claim back as a hostile, evidence-literate lifter who
wants to catch you out. **If a grade looks generous, it is.**

---

## Writing the file

One claim per file, named exactly `<id>.yaml` — the build fails if the filename
and the `id` disagree. Copy this and fill it in:

```yaml
id: c-<domain>-<slug>
statement: >-
  One sentence, plain English, no hedging words. The grade supplies the hedging —
  never write "may possibly" into a statement, or the app hedges twice.
peekStatement: >-
  A complete, curated short sentence that preserves the statement's qualification.
grade: A            # A | B | C | D
status: settled     # settled | contested
domain: volume
predicates: null    # null = search-only. See below.
trigger: null       # rule | data-earned when predicates is non-null
surfaceContexts: null # null = no general-evidence surface selection
clusterId: null     # required (and shared) when status is contested
phrasingKey: <domain>-<slug>
supersededBy: null  # a claim id, when a newer claim replaces this one
lastReviewed: 2026-07-25
citations:
  - id: cit-<slug>-<author>
    claimId: c-<domain>-<slug>     # must equal the parent id
    doi: 10.xxxx/xxxxx             # bare, no https://doi.org/ prefix
    authors: Surname A, Surname B
    year: 2024                     # JOURNAL ISSUE year, not CrossRef's
    journal: Sports Medicine
    n: null                        # integer, or null if not stated
    population: unstated           # trained | untrained | mixed | unstated
    effectSize: null               # prose, or null
    ci: null                       # as reported, or null
    figures: []                    # extracted numbers, re-plotted by the app
    quote: null                    # short and attributed, or null
```

**Predicates** are [json-logic](https://jsonlogic.com) evaluated against the
user's state. `null` means the claim is search-only: it is only reachable by
search, which is a perfectly good answer for a claim that does not depend on
what someone logged. A non-null predicate is a generic `rule` unless reliable
logged data itself establishes the claim's context; only that latter, explicitly
declared case may be `data-earned`. Never use `data-earned` for configured
targets, incomplete protein logs, or personalised MEV/MRV claims.

```yaml
predicates:                    # fires when any muscle is under 10 weekly sets
  some:
    - var: muscleSets
    - "<": [{ var: sets }, 10]
```

Available fields: `goal`, `deficitWeeks`, `weightTrend`, `e1rmTrend`,
`proteinPerKg7d`, `numbersHidden`, and the derived `muscleSets` array of
`{ muscle, sets }`. Quote the operator keys (`"<"`, `">="`, `"=="`, `"!="`) —
YAML will not accept them bare.

Guard nullable fields explicitly, or the comparison silently misbehaves:

```yaml
predicates:
  and:
    - "!=": [{ var: proteinPerKg7d }, null]
    - "<":  [{ var: proteinPerKg7d }, 1.6]
```

**Surface contexts** are a separate, non-personal selection route. They are
metadata, never JSON Logic predicates, and do not claim that an empty history or
a selected exercise proves anything about the user. A claim can opt into one or
more supported surfaces:

```yaml
surfaceContexts:
  - surface: hub-empty
  - surface: exercise-selection        # general; no experience is required
    exerciseIds: [barbell-bench-press] # optional, known seed ids only
    populations: [trained]             # optional citation-population values
  - surface: goal-draft
    goals: [bulk, maintain]             # one or more distinct known goals
```

Use `surfaceContexts: null` when the claim has no reviewed general-evidence
placement. The build rejects unknown surfaces, unknown exercise ids, empty or
duplicate goal lists, and any populated surface context on a `data-earned`
claim. Training experience is runtime ranking context, not authored claim
metadata; do not encode it as a predicate or infer it from an empty history.

## Build and check

```bash
npm run claims && npm test -- --run
```

`npm run claims` validates every file with Zod and regenerates
`src/generated/claims.ts`. **Commit that generated file** — a test fails if it
drifts from the YAML.

The build rejects, with the offending filename: an unknown grade, zero citations,
a malformed or missing DOI, a citation whose `claimId` does not match its parent,
a `lastReviewed` that is not a real calendar date, a duplicate id, a filename that
disagrees with the id, a `supersededBy` pointing at nothing, and a contested claim
sitting alone in its cluster. It also rejects malformed surface contexts,
unknown exercise ids, impossible goal lists, and general contexts attached to a
data-earned claim.

## Amending an existing claim

Edit the YAML, **bump `lastReviewed` to the date you re-checked it against the
literature** — not the date you edited the file (FR-CLAIM-4) — then re-run the
two commands above.

When newer work supersedes a claim rather than refining it, write the new claim
as its own file and set `supersededBy: <new-claim-id>` on the old one. Keep the
old claim; the supersession trail is part of being honest about a field that
moves.

## Contested claims

`status: contested` needs at least two claims sharing a `clusterId`, and the
build enforces it — a contested claim alone in its cluster renders one side and
calls it nuance, which is the exact failure this product exists to refuse.

Steelman both sides. The weaker side gets a real citation and its honest grade,
not a strawman: in the protein-timing cluster the majority side is [A] and the
minority side is [C], and the [C] side is built from what the ISSN position stand
actually recommends. Different grades on the two sides is the *point* — it is the
grade doing visible work inside a live disagreement.

## Two traps

- **Never hand-edit `src/generated/claims.ts`.** It is rebuilt from this
  directory and a drift test will fail.
- **Never leave a stray `.yaml` in this directory.** Every `*.yaml` here is
  loaded as a claim, so a scratch file or a half-finished template breaks the
  build. Drafts belong outside `claims/`, or with a non-`.yaml` extension.

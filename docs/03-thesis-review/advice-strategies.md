# Advice-Suggestion Strategies

How the app actually turns *logged data + a curated evidence base* into surfaced advice — carrying a citation, an evidence grade, and honest nuance — without reproducing the failure it exists to solve. Architecture analysis (not code). Grounds every option in the Phase 3 findings.

The inputs the engine works with:
- **Claim DB** (curated, ~50 claims): each claim = `{ statement, grade [A]–[D], status (settled|contested), domain, applicability predicates, citations[{doi, authors, year, journal, n, population, effect_size, CI}], calibrated_phrasing, superseded_by, last_reviewed }`.
- **User state** (logged): training (sets/reps/load/RIR, per-muscle weekly volume, e1RM regression trend), nutrition (weight trend, intake, macros), goal (cut/bulk/maintain), and the Phase 2 reconciliation outputs.

---

## The non-negotiable architectural principle (decide this first)

**Claim provenance must be structural, not stylistic.** Every piece of advice the app emits is *bound to a `claim_id`*; the UI renders the citation and grade **from the claim record**, never from free text. There is no code path that can display advice without a graded, cited claim behind it.

This one decision is what makes the honesty thesis real rather than aspirational, and it directly defuses the biggest risk on file: Stream A found LLM fitness coaches fabricate citations **20–47%** of the time ([04-sources/raw-notes/phase3-a-landscape.md](../04-sources/raw-notes/phase3-a-landscape.md)). For a product whose entire value is citation honesty, an advice engine that can invent a citation even 1% of the time is existential — it *is* the failure mode the product is positioned against. Structural provenance makes fabrication impossible by construction: the model (if any) never emits citations; it can only select from claims that already exist and are already graded. Everything below is evaluated against this principle.

---

## The five strategies

### S1 — Deterministic trigger/rules engine  ▸ the backbone
Each claim carries **applicability predicates** over user state (e.g. `goal == cut AND deficit_weeks ≥ 4 AND e1rm_trend == holding` → surface the "strength is robust to moderate deficits [A/B]" claim). A rule evaluator matches state against predicates and surfaces the matching claims.

| | |
|---|---|
| Honesty | **Perfect** — advice can only be a hand-authored, graded, cited claim. Zero fabrication surface. |
| Handles free-form questions | No — only anticipated situations. |
| Offline | Yes (no inference). |
| Build cost | Moderate — the evaluator is standard; the cost is authoring predicates per claim. |
| Feel | Can be robotic/templated if unmitigated. |
| Interview value | High — a real, auditable inference system with an evidence model behind it. |

**Verdict:** the mandatory backbone. It is the only strategy that satisfies the structural-provenance principle with no caveats, works offline (a standing constraint), and is fully auditable. Everything else is an optional layer on top.

### S2 — Semantic retrieval over the claim DB  ▸ the "ask a question" surface
User question or context → embed → retrieve top-k claims → surface with grade/citation. Powers a free-text "what does the evidence say about X?" entry point.

| | |
|---|---|
| Honesty | **Strong** — retrieves only real curated claims; still no fabrication. Risk is *relevance* (surfacing a tangential claim), not invention. |
| Handles free-form questions | Yes. |
| Offline | Possible with an on-device embedding model; simpler with an API. |
| Build cost | Low–moderate (embeddings + vector search over ~50 claims is trivial scale). |
| Feel | Flexible, but ranking quality matters; can surface near-misses. |

**Verdict:** strong complement to S1 for the question-answering surface. Keep the presentation (grade, citation) app-rendered; retrieval only chooses *which* claims, never authors text.

### S3 — LLM-generated advice, RAG-grounded  ▸ handle with tongs
An LLM writes the prose, grounded on retrieved claims. Tempting for fluency and nuance-phrasing.

| | |
|---|---|
| Honesty | **The danger zone.** Even RAG-grounded, LLMs misattribute, overstate confidence, drop the grade, or synthesise a claim not in the DB. This is exactly the 20–47% fabrication finding. |
| Handles free-form | Yes, fluently. |
| Offline | No (API) unless a capable on-device model — heavy. |
| Build cost | Low to wire up, **high to make safe.** |
| Feel | Best-in-class fluency and nuance. |

**Only acceptable under hard guardrails:** (a) the LLM may reference claims **only by `claim_id` from the retrieved set** — it never writes a citation string; the app renders citations/grades from the IDs. (b) **Post-generation validation:** parse the output, verify every referenced `claim_id` was in the retrieved set and that no ungrounded factual claim was added; **reject and regenerate or fall back to templated S1 text** on any violation. (c) The **grade and calibrated verb are always app-rendered**, never model-chosen. (d) Temperature low; the model rephrases fixed content, it does not decide substance.

**Verdict:** never the source of truth. Usable *only* as a dispensable phrasing layer (see S4), and omit it entirely for v1 — a templated S1 answer that is honest beats a fluent one that occasionally lies, in the one product where that lie is fatal.

### S4 — Hybrid: deterministic selection + optional LLM phrasing  ▸ recommended
Compose the above by responsibility, not by picking one:
1. **Selection** (S1 rules + S2 retrieval) decides *which* graded claims apply — deterministic, auditable, the trust root.
2. **Rendering** — the app deterministically renders the claim statement, the grade chip, the calibrated verb, and the citation from the claim record.
3. **Phrasing (optional, removable)** — an LLM layer only smooths the fixed content into context-aware prose, under the S3 guardrails and post-validated. Ship v1 **without** this; add it later if templated language proves too stiff, and keep it behind the validator forever.

The source of truth (claim, grade, citation) is always app-controlled; the LLM is a convenience that can be deleted without touching the honesty guarantees. This is the architecture that lets the product be both fluent-eventually and honest-always.

### S5 — "Advice earned by your data"  ▸ the differentiator, layered on S1
Not a separate engine but the highest-value *trigger pattern* for S1: fire a claim only when the user's own logged reality instantiates it, and say so. "Your e1RM trend is holding through 6 weeks of a deficit — consistent with strength being robust to moderate energy deficits [A/B, Murphy & Koehler 2022]." This is feature **K** from the brainstorm and the answer to "is this just a fact sheet bolted to a tracker?" — the evidence is contextual to logged data, which no content-layer competitor (all of them, per Stream A) can do. Mechanically: predicates evaluated against the Phase 2 reconciliation outputs; presentation unchanged.

---

## How nuance is produced (not a strategy — a rendering rule across all of them)
- **Grade-calibrated language** ([feature I](feature-brainstorm.md)): a fixed map grade→verb ([A] "well-supported" … [C] "suggested, limited evidence"). Generated from the grade, so the engine *cannot* say "proven" for a [C] claim.
- **Contested claims return a cluster, not a winner:** when `status == contested`, selection surfaces both sides with their studies (features B/H). Nuance becomes a data property of the claim, not prose the model has to remember to add.
- **Confidence vs applicability are separate axes:** evidence strength (grade, from the claim) and situational fit (predicate-match quality, from the engine) are shown separately — "strong evidence, loosely applies to you" is a distinct, honest state from "weak evidence, directly applies."

## Recommendation
- **v1:** S1 (rules) + S2 (retrieval for the question surface) + S5 (data-earned triggers), all rendering deterministically with grade-calibrated language and contested-cluster display. **No LLM in the trust path.**
- **Later:** S4's optional LLM phrasing layer, behind the S3 validator, purely for fluency.
- **The load-bearing decision is the structural one**, not the strategy menu: advice is `claim_id`-bound, citations and grades are app-rendered, and no path emits ungrounded text. Get that right and every strategy above is safe; get it wrong and even pure S1 can drift into the confident-but-wrong failure the product exists to refuse.

## Interview framing
"The obvious build is an LLM coach, but the research shows LLM fitness coaches fabricate citations 20–47% of the time — which is disqualifying for a product whose whole promise is citation honesty. So the trust root is a deterministic engine over a curated, graded claim base; the LLM, if present at all, only rephrases content it cannot author or cite. The honesty is a structural guarantee, not a prompt." That is a systems-design-under-a-real-constraint story, which is exactly the kind that carries a 30-minute technical interview.

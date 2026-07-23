# Evidence Standards

The grading rubric applied consistently across both phases. Every substantive claim in this repo carries a tag.

## Grades

| Tag | Means | Typical source | How it may be used |
|---|---|---|---|
| **[A]** | Meta-analysis, systematic review with quantitative synthesis, or replicated RCT | Cochrane review, Schoenfeld/Aragon meta-analyses, replicated trials | May be load-bearing for a core product claim without qualification |
| **[B]** | Single good study, or consistent observational evidence across studies | One well-powered RCT, a good cohort study, converging observational data | May be load-bearing, but the product must state the uncertainty where a user sees the output |
| **[C]** | Mechanistic reasoning, small-n studies, or expert consensus without trial evidence | Position stands, physiological plausibility, consistent practitioner consensus, widespread converging user reports | **May not be load-bearing for a differentiating claim.** Usable for design direction; any feature resting on it must say so plainly |
| **[D]** | Industry material, marketing, single anecdote, blog aggregation | Company blogs, app-store marketing, unsourced statistics, forum anecdote | Recorded for completeness. **Never load-bearing.** If a [D] figure is doing argumentative work, that is a research gap, not a finding |

## Rules

1. **Tag inline, at the claim.** A tag at the top of a document does not cover the claims inside it.
2. **Split grades are allowed** ([A/B], [C/D]) where the underlying evidence genuinely straddles — but not as a hedge to avoid deciding.
3. **Grade the claim, not the source.** A meta-analysis quoted for something it did not measure is [C] at best.
4. **Uncited claims are marked as inference.** Phase 2 standing rule: if it is not cited and not obviously derivable, it is labelled inference, not finding.
5. **Absence of evidence is a finding.** "Searched for X, found nothing" belongs in `methodology.md`, not in silence.
6. **Symmetry rule (added after Phase 1).** If one side of a comparison is held to a quantified-error standard, the other side must be too. Phase 1 quantified nutrition measurement error forensically and granted training measurement a free pass, then concluded training data was reliable. Do not repeat that. See `carryover.md` §2.1.
7. **Grade inflation check.** Before tagging [A] or [B], ask whether the study population, intervention, and outcome actually match the claim being made. Trained-population claims supported by untrained-population studies drop a grade.

## Applying grades to product decisions

- A **differentiating feature** — the thing that makes the product not-a-clone — needs [A] or [B] support, or it is a guess wearing a lab coat.
- A **safety-relevant constraint** may act on [C] evidence. Precaution does not require proof.
- A **[D] competitive claim** (what an incumbent will or will not do) is inference and must be labelled as such, however plausible.

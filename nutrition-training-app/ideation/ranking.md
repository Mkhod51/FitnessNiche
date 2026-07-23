# Ranking

## Criteria and weights

| Criterion | Weight | Why this weight |
|---|---|---|
| Differentiation defensibility | 0.25 | The sprint's stated goal is a *differentiated* concept; UI polish copies in a sprint, so this measures whether the moat is structural (data incumbents don't have, architecture they can't reverse) |
| Evidence strength | 0.20 | Standing rule: no feature justified by "users would like it." A candidate built on [C]/[D] physiology is a candidate built on sand |
| Solo feasibility (2–3 mo) | 0.20 | A concept that can't reach demonstrable v1 in the window is worth zero regardless of other scores |
| Interview narrative | 0.15 | The project must sustain 30 minutes of technical conversation; weighted below the survival criteria because a shipped mediocre story beats an unshipped great one |
| Real usefulness | 0.15 | "Actually useful, not a README GIF that dies" — but partially captured by differentiation + evidence already, so not double-weighted |
| Residual ethical/regulatory risk | 0.05 | Deliberately small: Stream D's veto was applied as a *gate* before scoring (dead candidates never entered the list), so this weight only prices the residual risk among survivors. 5 = low risk |

Scores 1–5. Weighted total out of 5.

## Scores

| # | Candidate | Diff (.25) | Evid (.20) | Feas (.20) | Narr (.15) | Use (.15) | Risk (.05) | **Total** |
|---|---|---|---|---|---|---|---|---|
| 1 | **Verdict** | 4 | 5 | 4 | 5 | 4 | 5 | **4.40** |
| 4 | **Leucine Ledger** | 5 | 4 | 3 | 5 | 4 | 5 | **4.25** |
| 10 | Coach Read | 4 | 4 | 4 | 4 | 4 | 5 | **4.05** |
| 8 | Tiers | 3 | 5 | 5 | 3 | 3 | 5 | **3.90** |
| 2 | Plateau Judge | 3 | 4 | 5 | 3 | 3 | 5 | **3.70** |
| 6 | Blind | 4 | 3 | 4 | 4 | 3 | 4 | **3.65** |
| 3 | Training-Day Protein | 2 | 5 | 5 | 2 | 3 | 5 | **3.50** |
| 5 | Descent | 3 | 3 | 4 | 3 | 4 | 4 | **3.40** |
| 7 | Preserve (GLP-1) | 2 | 4 | 4 | 3 | 4 | 3 | **3.30** |
| 12 | Vault | 3 | 3 | 4 | 4 | 2 | 5 | **3.30** |
| 9 | Kettle (UK-first) | 2 | 4 | 4 | 3 | 3 | 5 | **3.25** |
| 11 | Nudge | 2 | 2 | 4 | 2 | 2 | 5 | **2.55** |

## Scoring notes (where a number needs defending)

- **Verdict, Diff 4 not 5:** the computation is simple; the moat is that no incumbent holds both signals. That's real but has one named attacker — MacroFactor adding a lift logger. A 5 requires a moat with no plausible attacker (Leucine Ledger's missing *data layer* qualifies; a missing *feature* doesn't).
- **Leucine Ledger, Feas 3:** the AA data layer is tractable (USDA SR Legacy is CC0 and carries amino-acid profiles) but the segment's real diets lean on processed substitutes and powders with no published AA data — category-level inference is extra, fiddly work, and the total scope (dual logger + data layer + scoring) is the largest on the list.
- **Blind, Evid 3 / Use 3:** the harm-reduction design levers are [B/C], but there is *no evidence the target audience logs at all* — the one contradiction Phase 2 left unresolved. Highest variance score on the board.
- **Tiers, Feas 5 but Diff 3:** easiest build in the top half; but a logging *method* without a verdict layer is an identity bet a no-brand newcomer probably loses.
- **Preserve, Risk 3:** wellness framing one step from a drug is the thinnest regulatory margin among survivors.
- **Nudge scored last on purpose:** it violates decisions.md finding #3 (builds on the two noisiest signals). It's in the list to show the boundary, not to compete.

## Structural observation that outranks the arithmetic

Candidates #2 (Plateau Judge), #3 (Training-Day Protein), and #10 (Coach Read) are not really competitors of #1 — they are #1's verdict engine, protein layer, and presentation cadence respectively, each scored standalone. Three of the top seven candidates independently collapsing into the same product is stronger evidence for that product than its own 4.40: the evidence base keeps regenerating the same shape from different starting points.

The genuine decision is therefore **Verdict (4.40) vs. Leucine Ledger (4.25)** — within noise of each other on the arithmetic. Tiebreakers, in order of weight:

1. **Premise embodiment.** Verdict *is* the surviving integration thesis (Stream B's one survivor). Leucine Ledger barely needs the training half — its core value is a nutrition-data-layer play with a lift log attached. If the project's framing is "combined app," Verdict answers it; Leucine Ledger quietly abandons it.
2. **Builder-segment fit.** Build for a community you belong to. The developer presumably lifts; whether they're plant-based is unknown. **If they are, this tiebreaker flips and Leucine Ledger should win** — flagged explicitly in recommended.md.
3. **Demonstrable-users reach.** Verdict's audience is the broad core of every lifting community; Leucine Ledger's is tens of thousands nationally.

**Winner: Verdict**, absorbing Plateau Judge, Training-Day Protein, and Coach Read's weekly report as features.

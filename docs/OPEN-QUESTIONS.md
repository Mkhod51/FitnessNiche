# Open questions and decisions

This register contains choices that still need evidence or product judgment.
Implementation gaps with an obvious required outcome are tracked in
[PROJECT-STATE](PROJECT-STATE.md), not disguised as questions.

## Open

| ID | question | current default / decision needed |
| --- | --- | --- |
| OQ-1 | Will the target audience keep using a product that foregrounds uncertainty and challenges preferred protocols? | Keep the evidence-first stance; validate with real users rather than weakening grades or dissent. |
| OQ-3 | Is iOS installed-PWA storage reliable enough under real use? | Keep the PWA/OPFS design; repeat the [iOS gate](ios-gate.md) on current hardware before public reliance. |
| ENG-1 | Should the currently unread `exercises` SQLite table be hardened or removed? | Leave it until a runtime reader exists; then use a content-versioned seed or delete the duplicate store. |
| UX-1 | Should Log Weight replace `type="number"` with the workout screen's text/decimal-keypad pattern? | Cosmetic only; leave unchanged until that surface is revised for numbers-hidden. |
| DATA-1 | How broad should the local food catalogue become, and should cached foods/recents sync? | Keep the audited small CoFID seed and device-local cache; add breadth only from traceable licensed data. |

## Closed

| ID | resolution |
| --- | --- |
| OQ-2 | Hevy CSV carries RPE; the parser maps it to RIR as `10 - RPE`. The remaining gap is UI/persistence wiring, not file-format uncertainty. |
| OQ-4 | Developer review accepted that reconciliation earns its place by naming unresolved signals and withholding verdicts, not by overlaying two charts. |
| LOG-1 | A blank set tick falls back to the latest same-session set, then exercise history, then `0`; explicit zero remains valid. |
| NUTR-1 | Goal setup now computes Mifflin–St Jeor range and refuses partial input; maintenance remains the default. |
| FOOD-1 | v1 uses a small CoFID seed plus Open Food Facts search/barcode caching. USDA fallback remains unimplemented and is tracked as roadmap, not an open architectural choice. |

Named current gaps—claim target/review, Hevy UI, server erasure,
browser-to-D1 proof, numbers-hidden leaks, warm-up volume counting, offline deep
reload, and contested-session/Hub-cooldown recording—remain explicit in
[PROJECT-STATE](PROJECT-STATE.md) and [BUILD-PLAN](BUILD-PLAN.md).

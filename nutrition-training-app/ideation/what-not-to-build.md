# What Not To Build

Attractive-looking dead ends. One line each on why. Sources: decisions.md §4 kill list plus ideation-stage rejections.

| Dead end | Why it dies |
|---|---|
| RED-S / energy-availability detector | Killed twice independently: computed EA's error band is wider than the diagnostic thresholds [B/C], and disease detection = regulated medical device (MHRA/EU MDR Class IIa+) — the feature that most *looks* like the integration payoff is the worst possible build |
| Anabolic-window / protein-timing coach | [A] evidence says the effect doesn't exist once daily total is adequate; you'd be engineering a nag for a myth |
| AI photo-calorie estimation as the core product | Accuracy liability on the noisiest signal, per-inference compute costs a solo dev can't eat, and MFP just bought Cal AI — already copied before you start; acceptable later as an optional *logging convenience*, never as identity |
| "Better database than MyFitnessPal" | Curation debt economics work against whoever holds the biggest corpus, including you at scale; the open stack (OFF+CoFID+FDC) is table-stakes plumbing every competitor can also assemble — commodity, not moat |
| CKD / diabetes / renal micronutrient tracker | Medical device territory + a trust barrier no unreviewed solo student app crosses + segment unreachable through consumer channels |
| ED-recovery clinical app | Right architecture (numbers-hidden), wrong builder: clinically sensitive population requires clinical review a solo student can't provide; inherit the architecture, don't target the population |
| In-app ED screening questionnaire | The screening tool is itself a medical device; signpost to Beat/NHS instead |
| Acute water-cut / dehydration coach | Deaths on record in combat sports; no cap-compliant version exists; permanently out, not deferred |
| AI workout program generator | Fitbod's documented RDL-after-deadlifts failure shows the hard part; requires training-outcome data corpora a new entrant doesn't have; competes on the axis where incumbents have the data advantage |
| Streaks / deficit gamification / weight leaderboards | Stream D veto: textbook restriction-spiral drivers; soft warnings demonstrably fail [B], so the only safe version is absence |
| Volume-aware calorie nudging ("Nudge") | Builds pseudo-precision on the two noisiest signals (intake, expenditure) — violates the core design finding; a deload's energy delta is smaller than the logging error |
| Privacy-absolute as the product ("Vault") | Privacy is a soft preference in this vertical (fails Stream C's hard-constraint test) and every sane candidate inherits on-device-first anyway — a property, not a product |
| Coach–client marketplace / social layer | Two-sided cold start inside a 2–3 month solo window; Hevy's social value is networked and can't be manufactured for a new entrant's empty friend graph |
| LLM macro-coach chatbot | No moat (wrapper), hallucination liability in a health-adjacent domain, and the honest verdicts this project needs are rules on two trend lines — a chatbot adds surface area, not signal |
| CRDT / operational-transform sync engine | Single-user multi-device append-mostly data has no concurrent-merge problem; weeks of résumé-driven engineering the interview will see through |
| Masters-athlete (40+) app | Real need, soft constraint: a protein-target slider covers it; no incumbent architecture fights it, so no defensibility (Stream C rejection) |

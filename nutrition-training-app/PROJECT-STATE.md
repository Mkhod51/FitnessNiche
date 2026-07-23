# Project State

**Updated:** 2026-07-24 · **Phase:** 2 (Deep Ideation) · **Stage:** Wave 1 dispatched

## Where this stands

Phase 1 ran a lean four-stream research sprint and recommended **Verdict** — a combined lift-and-food logger whose identity is one honest read reconciling bodyweight trend against strength trend. Phase 2 re-opens that conclusion deliberately: the read-in found that Phase 1's recommendation rests on three claims it asserted but never established, and that all twelve of its candidates shared an unexamined frame.

**Verdict enters Phase 2 as a candidate, not as the incumbent.**

## Open decisions

| # | Decision | Blocked on | Status |
|---|---|---|---|
| 1 | Does the combined-tracker premise survive at all? | Wave 1 Streams A, C | Open — Phase 1 already killed the computational version; only the adherence version remains, and it is unevidenced |
| 2 | Is estimated-1RM trend a reliable signal? | Wave 1 Stream A | Open — **premise-critical**. Phase 1 assumed yes without quantifying error |
| 3 | Does one app beat two apps for adherence? | Wave 1 Stream C | Open — the project's last remaining premise |
| 4 | Which segment, if any, has a hard enough constraint to build around? | Wave 1 Stream E | Open — 6 segments examined, ~18 exist |
| 5 | Final concept | Waves 2–4 | Open |

## Known premise risks

1. **Asymmetric evidence standard (carryover §2.1)** — the training-data side was never held to the measurement-error standard the nutrition side was. If e1RM trend is noisy, Verdict degrades to "a chart of two noisy signals."
2. **Unevidenced adherence claim (carryover §2.2)** — no evidence that consolidating two apps into one improves logging adherence.
3. **Unverified cold-start mitigation (carryover §2.3)** — CSV import was promoted to a survival requirement without checking that Hevy/Strong free tiers export usable data.
4. **Frame lock (carryover §4)** — all twelve Phase 1 candidates were `log → compute → display → user decides`. Phase 2 must generate substantially outside that skeleton.

## Next actions

- [x] Read-in and carryover analysis
- [x] Repo restructure and migration
- [ ] Wave 1 — twelve parallel research agents across eight streams
- [ ] Wave 2 — synthesis, contradictions, conventional-wisdom gap register
- [ ] Wave 3 — 20–30 niche candidates
- [ ] Wave 4 — ranking, five deep dives, final recommendation

## Constraints in force (non-negotiable)

Inherited from Phase 1 Stream D, which holds veto power: hard calorie floor and ≤500 kcal/day deficit cap enforced in code · maintenance default · numbers-hidden mode as a first-class state · no restriction gamification, streaks, or weight leaderboards · no disease detection, management, or in-app screening (medical-device line) · health data is special-category under UK GDPR, keep on-device where possible · offline-first is a hard requirement.

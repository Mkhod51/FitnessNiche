# Advice Surface Coverage Design

## Goal

Make MyoStat's evidence visible at the decisions where it can be honestly useful,
including a first-ever workout and goal selection, while keeping every displayed
recommendation claim-bound, deterministic, local-first, and non-personal until
the logged data earns a personal conclusion.

## Problem

The current advice engine only evaluates multi-week snapshot predicates. It is
therefore correct to remain quiet for a new user, but it leaves two high-intent
moments uncovered:

- A first session has no historical volume, trend, protein, or reconciliation
  data, and advice is selected before the user chooses an exercise.
- Goal setup has a draft goal and an enforced deficit guard, but no general
  claim-selection path. Only the existing cut-cap claim is hard-wired there.

The solution must not pretend that an empty history identifies a beginner,
derive an individual rate or surplus from a study, or make a newly entered set
look like a multi-week personal signal.

## Surface map

| Surface | Current behaviour | Planned role |
| --- | --- | --- |
| Consent/onboarding | Privacy gate only | Remains advice-free. Consent is not a training context. |
| Hub, no data | Shows the evidence library but no personalised item | May show one rotating, clearly labelled general-evidence fact; never "for you" advice. |
| Hub, with data | Evaluates aggregate snapshot rules and data-earned claims | Remains the main longitudinal "For you" surface. |
| Workout opens | One aggregate-snapshot claim can be selected | Remains the historical-data lane. It must not consume a second card after an exercise-context card is selected. |
| First exercise selected | No advice | Primary zero-data lane: one relevant, claim-bound exercise or general training fact, shown after the first exercise selection only. |
| Set entry/RIR/warm-up | Measurement and logging only | No automatic claim re-evaluation after each set. Inline measurement explanations remain non-advice. |
| Workout finish | Summary only | No new automatic recommendation in this pass; evaluate later only with a session-specific evidence context. |
| Goal setup, draft cut/bulk/maintain | Cut displays one hard-wired deficit-cap claim | Draft-goal lane: show eligible goal-context claims before save, including cut, bulk, or maintenance facts only when their claim scope supports it. |
| Eat, food picker, single weigh-in | Capture and display only | Remain advice-free. One meal or one weigh-in is not a sound intervention signal. |
| Trends | Displays measurements and population volume range | Remains data display; no individual set target or rate prescription. |
| Weekly review | Claim cards only for two reconciliation verdicts | Remains the data-earned intervention surface; no filler claims for unresolved states. |
| Settings | Navigation | Remains advice-free; goal context belongs in Goal Setup. |

## Context model

Keep aggregate snapshot predicates for claims whose applicability is established
by logged history. Add a distinct, validated **surface context** route for
non-personal evidence:

```ts
type AdviceSurface = 'hub-empty' | 'workout-start' | 'exercise-selection' | 'goal-draft' | 'weekly-review';

type SurfaceContext =
  | { surface: 'hub-empty' }
  | { surface: 'exercise-selection'; exerciseId: string; experience: TrainingExperience | null }
  | { surface: 'goal-draft'; goal: Goal; hasEstimate: boolean; requestedDeficitKcal: number | null }
  | { surface: 'workout-start' | 'weekly-review' };

type TrainingExperience = 'new' | 'returning' | 'experienced';
```

Each claim remains a source of truth for its statement, grade, population, and
citation. A claim may additionally opt into one or more authored surface
contexts. Surface contexts select a general evidence card; they never turn it
into `data-earned` advice and never add a personal explanation.

Training experience is optional. It ranks a population match ahead of a
mismatch, but it does not hide a novice-population claim from an experienced
lifter. When shown outside its studied population, the existing citation
population and a concise applicability note remain visible, so the app does
not silently generalise the finding.

## Selection and interruption rules

- At most one automatic card may be visible in a workout. A history-selected
  card and an exercise-selection card share that budget.
- The first exercise selection may select a claim only once per workout. Adding
  later exercises, editing a set, or changing RIR cannot trigger another card.
- A general fact is marked as general evidence, not as a conclusion about the
  user. It has no invented `why now` data line.
- Existing seven-day cooldown and permanent dismissal continue to apply. Advice
  events also record their surface so the selection path is auditable.
- Goal-draft cards update as the draft goal changes, but saving a goal does not
  create a new unsolicited card elsewhere.
- Numbers-hidden continues to block automatic energy, bodyweight, and protein
  advice outside the explicit goal-setting screen. Goal Setup may show its
  required target values because the user is deliberately configuring them.

## Curation lanes

New automatic context claims require the same M6 chain as every other claim:
discovery, DOI resolution, direct-source reading, ledger locations and null
rationales, two hostile reviews, generation, and tests. Candidate leads are
not evidence until that work is complete.

1. **First-exercise/general knowledge.** Curate plain-language, population
   labelled claims about exercise selection and mechanisms such as mechanical
   tension and motor-unit recruitment. They must explain a concept without
   prescribing load, volume, or personal suitability.
2. **Cut draft.** Curate a narrow population-level weight-loss-rate or
   deficit-context claim only where direct evidence supports the precise
   population and outcome. It must not calculate a personal weekly-loss target
   or weaken the hard intake floor and 500-kcal deficit cap.
3. **Bulk draft.** Map existing reviewed bulk-rate claims where their scope
   fits; add a new claim only after direct-source review fills a genuine gap.
   No surplus percentage or gain rate becomes an individual prescription.
4. **Maintenance draft.** Curate only a directly supported statement. If the
   evidence does not support a general maintenance prescription, show no
   maintenance card rather than manufacturing one.

## Error handling and privacy

Surface selection is fail-closed: malformed authoring, an unknown exercise, a
missing claim, no consent, or a context mismatch returns no card. The app makes
no network request and stores no new health data merely to select a general
fact. Optional experience is stored locally with the existing profile and can
be changed or cleared.

## Verification

Tests must cover source provenance, context-schema rejection, optional
experience ranking without population relabelling, one-card-per-workout,
cooldown/suppression, consent, numbers-hidden, goal guard preservation, and
the absence of re-evaluation after a logged set. Claim generation, focused
advice tests, typecheck, and a targeted Playwright flow for first exercise
selection and goal draft complete the verification gate.

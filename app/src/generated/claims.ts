// GENERATED FILE — do not edit by hand.
// Source: app/claims/*.yaml. Regenerate with `npm run claims`.
// scripts/build-claims.test.ts fails if this file drifts from the YAML.
import type { Claim } from '../advice/types.ts';

export const CLAIMS: Claim[] = [
  {
    "id": "c-bulk-rate-higher-energy-body-fat",
    "statement": "In that small four-week diet comparison, the higher-energy group had a larger relative increase in skinfold-estimated body fat (7.4% vs 0.8%); only that group had a significant pre-to-post increase",
    "peekStatement": "A small trial suggests a significant body-fat increase only in the higher-energy group.",
    "grade": "C",
    "status": "settled",
    "domain": "bulk-rate",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "bulk-rate-higher-energy-body-fat",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-bulk-rate-fat-ribeiro",
        "claimId": "c-bulk-rate-higher-energy-body-fat",
        "doi": "10.2478/hukin-2019-0038",
        "authors": "Ribeiro AS, Nunes JP, Schoenfeld BJ, Aguiar AF, Cyrino ES",
        "year": 2019,
        "journal": "Journal of Human Kinetics",
        "n": 11,
        "population": "trained",
        "effectSize": "With different macronutrient distributions, skinfold-estimated body fat changed +7.4% in the higher-energy group and +0.8% in the moderate-energy group; only the higher-energy group had a significant pre-to-post increase.",
        "ci": null,
        "figures": [
          {
            "label": "higher-energy intake",
            "value": 67.5,
            "unit": "kcal/kg/day"
          },
          {
            "label": "moderate-energy intake",
            "value": 50.1,
            "unit": "kcal/kg/day"
          },
          {
            "label": "relative body-fat change, higher-energy group",
            "value": 7.4,
            "unit": "%"
          },
          {
            "label": "relative body-fat change, moderate-energy group",
            "value": 0.8,
            "unit": "%"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-bulk-rate-higher-energy-muscle-mass",
    "statement": "In an 11-person, four-week trial of competitive male bodybuilders, the higher-energy diet group with a different macronutrient distribution had a larger estimated skeletal-muscle-mass increase than the moderate-energy group (2.7% vs 1.1%)",
    "peekStatement": "A small trial suggests greater estimated muscle-mass gains in the higher-energy diet group.",
    "grade": "C",
    "status": "settled",
    "domain": "bulk-rate",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "bulk-rate-higher-energy-muscle-mass",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-bulk-rate-muscle-ribeiro",
        "claimId": "c-bulk-rate-higher-energy-muscle-mass",
        "doi": "10.2478/hukin-2019-0038",
        "authors": "Ribeiro AS, Nunes JP, Schoenfeld BJ, Aguiar AF, Cyrino ES",
        "year": 2019,
        "journal": "Journal of Human Kinetics",
        "n": 11,
        "population": "trained",
        "effectSize": "With different macronutrient distributions, estimated skeletal muscle mass increased 2.7% in the higher-energy group and 1.1% in the moderate-energy group (p = 0.03).",
        "ci": null,
        "figures": [
          {
            "label": "higher-energy intake",
            "value": 67.5,
            "unit": "kcal/kg/day"
          },
          {
            "label": "moderate-energy intake",
            "value": 50.1,
            "unit": "kcal/kg/day"
          },
          {
            "label": "estimated skeletal-muscle-mass change, higher-energy group",
            "value": 2.7,
            "unit": "%"
          },
          {
            "label": "estimated skeletal-muscle-mass change, moderate-energy group",
            "value": 1.1,
            "unit": "%"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-bulk-rate-novice-intermediate-review",
    "statement": "For novice and intermediate natural bodybuilders in the off-season, a narrative review suggests that gaining about 0.25 to 0.5% of bodyweight per week might be useful",
    "peekStatement": "A review suggests 0.25–0.5% weekly gain for novice/intermediate bodybuilders.",
    "grade": "C",
    "status": "settled",
    "domain": "bulk-rate",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "bulk-rate-novice-intermediate-review",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-bulk-rate-iraki",
        "claimId": "c-bulk-rate-novice-intermediate-review",
        "doi": "10.3390/sports7070154",
        "authors": "Iraki J, Fitschen P, Espinar S, Helms E",
        "year": 2019,
        "journal": "Sports",
        "n": null,
        "population": "unstated",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "suggested weekly bodyweight-gain lower bound",
            "value": 0.25,
            "unit": "%"
          },
          {
            "label": "suggested weekly bodyweight-gain upper bound",
            "value": 0.5,
            "unit": "%"
          }
        ],
        "quote": "Aiming for a target weight gain of ~0.25–0.5% of bodyweight per week might be useful."
      }
    ]
  },
  {
    "id": "c-bulk-rate-surplus-unknown",
    "statement": "The specific energy surplus that maximizes resistance-training hypertrophy has not been validated",
    "peekStatement": "A review suggests no validated energy-surplus sweet spot for hypertrophy.",
    "grade": "C",
    "status": "settled",
    "domain": "bulk-rate",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "bulk-rate-surplus-unknown",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-bulk-rate-slater",
        "claimId": "c-bulk-rate-surplus-unknown",
        "doi": "10.3389/fnut.2019.00131",
        "authors": "Slater GJ, Dieter BP, Marsh DJ, Helms ER, Shaw G, Iraki J",
        "year": 2019,
        "journal": "Frontiers in Nutrition",
        "n": null,
        "population": "unstated",
        "effectSize": null,
        "ci": null,
        "figures": [],
        "quote": "The specific energy surplus required to facilitate muscle hypertrophy is unknown."
      }
    ]
  },
  {
    "id": "c-deficit-beyond-500-blocks-lean-mass",
    "statement": "Around a 500 kcal per day deficit is where gaining lean mass stops being realistic, so a larger deficit trades muscle for speed",
    "peekStatement": "Past about a 500 kcal daily deficit, gaining lean mass stops being realistic",
    "grade": "B",
    "status": "settled",
    "domain": "energy-balance",
    "predicates": {
      "and": [
        {
          "==": [
            {
              "var": "goal"
            },
            "cut"
          ]
        },
        {
          ">=": [
            {
              "var": "deficitWeeks"
            },
            4
          ]
        }
      ]
    },
    "trigger": "rule",
    "clusterId": null,
    "phrasingKey": "deficit-500-threshold",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-deficit-500-murphy",
        "claimId": "c-deficit-beyond-500-blocks-lean-mass",
        "doi": "10.1111/sms.14075",
        "authors": "Murphy C, Koehler K",
        "year": 2022,
        "journal": "Scandinavian Journal of Medicine and Science in Sports",
        "n": null,
        "population": "unstated",
        "effectSize": "A meta-regression across the pooled studies placed the point where lean-mass gains were prevented at an energy deficit of about 500 kcal per day. This is one regression estimate from one paper, and a population-level threshold rather than a personal one.",
        "ci": null,
        "figures": [
          {
            "label": "daily deficit at which lean-mass gain was prevented",
            "value": 500,
            "unit": "kcal/day"
          }
        ],
        "quote": "individuals performing RT to preserve LM during weight loss should avoid energy deficits >500 kcal day-1"
      }
    ]
  },
  {
    "id": "c-deficit-impairs-lean-mass",
    "statement": "Training in an energy deficit blunts how much lean mass you gain compared with training at maintenance",
    "peekStatement": "Training in an energy deficit blunts lean-mass gain compared with maintenance",
    "grade": "B",
    "status": "settled",
    "domain": "energy-balance",
    "predicates": {
      "and": [
        {
          "==": [
            {
              "var": "goal"
            },
            "cut"
          ]
        },
        {
          ">=": [
            {
              "var": "deficitWeeks"
            },
            3
          ]
        }
      ]
    },
    "trigger": "rule",
    "clusterId": null,
    "phrasingKey": "deficit-impairs-lean-mass",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-deficit-lean-murphy",
        "claimId": "c-deficit-impairs-lean-mass",
        "doi": "10.1111/sms.14075",
        "authors": "Murphy C, Koehler K",
        "year": 2022,
        "journal": "Scandinavian Journal of Medicine and Science in Sports",
        "n": null,
        "population": "unstated",
        "effectSize": "Lean-mass gains were impaired when resistance training was performed in an energy deficit versus a non-deficit control (ES -0.57, p = 0.02). A second, separately matched analysis agreed in direction (ES -0.11, p = 0.03, against control ES 0.20, p < 0.001).",
        "ci": null,
        "figures": [
          {
            "label": "effect size on lean mass, deficit vs control",
            "value": -0.57
          },
          {
            "label": "minimum intervention length included",
            "value": 3,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-deload-periodic-break-untrained",
    "statement": "In healthy untrained adults, 10 weeks of detraining reduced strength and muscle size, but 10 weeks of retraining produced final adaptations similar to a matched 20-week continuous-training block",
    "peekStatement": "In untrained adults, a 10-week break reduced gains that retraining later regained.",
    "grade": "B",
    "status": "settled",
    "domain": "deloads",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "deload-periodic-break-untrained",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-deload-periodic-halonen",
        "claimId": "c-deload-periodic-break-untrained",
        "doi": "10.1111/sms.14739",
        "authors": "Halonen EJ, Gabriel I, Kelahaara MM, Ahtiainen JP, Hulmi JJ",
        "year": 2024,
        "journal": "Scandinavian Journal of Medicine & Science in Sports",
        "n": 55,
        "population": "untrained",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "periodic training block before detraining",
            "value": 10,
            "unit": "weeks"
          },
          {
            "label": "detraining duration",
            "value": 10,
            "unit": "weeks"
          },
          {
            "label": "retraining duration",
            "value": 10,
            "unit": "weeks"
          },
          {
            "label": "matched continuous-training block",
            "value": 20,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-deload-reduced-dose-young-adults",
    "statement": "After a 16-week resistance-training block, one-third and one-ninth maintenance doses preserved hypertrophy in young adults during 32 weeks",
    "peekStatement": "In young adults, reduced training doses preserved hypertrophy after a training block.",
    "grade": "B",
    "status": "settled",
    "domain": "deloads",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "deload-reduced-dose-young-adults",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-deload-reduced-dose-bickel",
        "claimId": "c-deload-reduced-dose-young-adults",
        "doi": "10.1249/MSS.0b013e318207c15d",
        "authors": "Bickel CS, Cross JM, Bamman MM",
        "year": 2011,
        "journal": "Medicine & Science in Sports & Exercise",
        "n": 70,
        "population": "mixed",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "initial training duration",
            "value": 16,
            "unit": "weeks"
          },
          {
            "label": "maintenance phase duration",
            "value": 32,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-deloads-not-evidence-backed",
    "statement": "Planned deload weeks are widely prescribed but barely studied, and the one controlled trial in trained lifters found they cost strength without helping muscle growth",
    "peekStatement": "Planned deloads are barely studied, and one trial found they cost strength",
    "grade": "B",
    "status": "settled",
    "domain": "deloads",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "deloads-unsupported",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-deload-coleman",
        "claimId": "c-deloads-not-evidence-backed",
        "doi": "10.7717/peerj.16777",
        "authors": "Coleman M, Burke R, Augustin F, Pinero A, Maldonado J, Fisher JP, Israetel M, Androulakis Korakakis P, Swinton P, Oberlin D, Schoenfeld BJ",
        "year": 2024,
        "journal": "PeerJ",
        "n": 39,
        "population": "trained",
        "effectSize": "A one-week deload at the midpoint of a nine-week programme produced no appreciable difference in muscle size, local endurance or power, while the continuously-training group showed greater gains in both isometric and dynamic lower-body strength. This is a single trial of 39 people; no meta-analysis of deloading in trained lifters exists to weigh it against.",
        "ci": null,
        "figures": [
          {
            "label": "participants",
            "value": 39
          },
          {
            "label": "deload length",
            "value": 1,
            "unit": "week"
          },
          {
            "label": "programme length",
            "value": 9,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-diet-breaks-trained-females-body-composition",
    "statement": "In resistance-trained females, a trial did not detect a body-composition difference between six weeks of continuous 25% energy restriction and an eight-week intermittent programme containing six restricted weeks in two-week blocks separated by two one-week energy-balance breaks",
    "peekStatement": "A small trial suggests no detectable body-composition advantage from diet breaks.",
    "grade": "C",
    "status": "settled",
    "domain": "energy-balance",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "diet-breaks-trained-females-body-composition",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-diet-breaks-siedler",
        "claimId": "c-diet-breaks-trained-females-body-composition",
        "doi": "10.5114/jhk/159960",
        "authors": "Siedler MR, Lewis MH, Trexler ET, et al.",
        "year": 2023,
        "journal": "Journal of Human Kinetics",
        "n": 38,
        "population": "trained",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "prescribed energy restriction",
            "value": 25,
            "unit": "%"
          },
          {
            "label": "continuous restriction duration",
            "value": 6,
            "unit": "weeks"
          },
          {
            "label": "intermittent energy-balance breaks",
            "value": 2,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-failure-not-required",
    "statement": "Taking sets to failure is not required for strength or muscle growth, though in lifters who already train there is a small hypertrophy cost to stopping short",
    "peekStatement": "Taking sets to failure is not required for strength or growth",
    "grade": "A",
    "status": "settled",
    "domain": "failure-proximity",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "failure-not-required",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-failure-grgic",
        "claimId": "c-failure-not-required",
        "doi": "10.1016/j.jshs.2021.01.007",
        "authors": "Grgic J, Schoenfeld BJ, Orazem J, Sabol F",
        "year": 2022,
        "journal": "Journal of Sport and Health Science",
        "n": 394,
        "population": "mixed",
        "effectSize": "No significant difference between training to failure and stopping short, for strength (ES -0.09) or hypertrophy (ES 0.22). Both confidence intervals cross zero. n is the pooled strength analysis (394); the hypertrophy analysis pooled a separate, smaller 219 participants, so the size half of this claim rests on less data than the strength half. Six of the fifteen studies used resistance-trained participants and the rest used untrained ones.",
        "ci": "Strength 95% CI -0.22 to 0.05; hypertrophy 95% CI -0.11 to 0.55",
        "figures": [
          {
            "label": "studies pooled",
            "value": 15
          },
          {
            "label": "participants, strength analysis",
            "value": 394
          },
          {
            "label": "participants, hypertrophy analysis",
            "value": 219
          },
          {
            "label": "median study sample size",
            "value": 25
          },
          {
            "label": "studies using resistance-trained participants",
            "value": 6
          },
          {
            "label": "effect size, strength",
            "value": -0.09
          },
          {
            "label": "effect size, hypertrophy",
            "value": 0.22
          }
        ],
        "quote": "Training to muscle failure does not seem to be required for gains in strength and muscle size"
      }
    ]
  },
  {
    "id": "c-failure-proximity-dose-response",
    "statement": "Muscle growth tends to increase the closer sets are taken to failure, while strength looks much the same across a wide range of reps-in-reserve",
    "peekStatement": "Growth tends to rise closer to failure; strength looks similar across a wide RIR range",
    "grade": "B",
    "status": "settled",
    "domain": "failure-proximity",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "failure-proximity-dose",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-failure-dose-robinson",
        "claimId": "c-failure-proximity-dose-response",
        "doi": "10.1007/s40279-024-02069-2",
        "authors": "Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC",
        "year": 2024,
        "journal": "Sports Medicine",
        "n": null,
        "population": "mixed",
        "effectSize": "For hypertrophy the marginal slopes for estimated reps-in-reserve were negative with intervals excluding zero; for strength the intervals contained zero. Graded down from the strength of its design because the authors report only modest model fit, estimated reps-in-reserve from study descriptions rather than measuring it, and describe the analysis as exploratory.",
        "ci": null,
        "figures": [],
        "quote": "caution is warranted when interpreting the present analysis due to its exploratory nature"
      }
    ]
  },
  {
    "id": "c-failure-small-hypertrophy-edge-when-trained",
    "statement": "In lifters who already train, sets taken to failure show a small hypertrophy advantage that does not appear in untrained beginners",
    "peekStatement": "In lifters who already train, failure shows a small hypertrophy edge",
    "grade": "B",
    "status": "settled",
    "domain": "failure-proximity",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "failure-trained-edge",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-failure-trained-grgic",
        "claimId": "c-failure-small-hypertrophy-edge-when-trained",
        "doi": "10.1016/j.jshs.2021.01.007",
        "authors": "Grgic J, Schoenfeld BJ, Orazem J, Sabol F",
        "year": 2022,
        "journal": "Journal of Sport and Health Science",
        "n": null,
        "population": "trained",
        "effectSize": "In the resistance-trained subgroup only, training to failure favoured hypertrophy with ES 0.15. This is a subgroup analysis inside a single meta-analysis and its interval only just clears zero, so it carries much less weight than the headline null result it sits beside. The trained subgroup is drawn from six of the fifteen studies; the paper does not report a participant count for that subgroup alone, so n stays unstated even though the pooled hypertrophy analysis it came from had 219.",
        "ci": "95% CI 0.03 to 0.26",
        "figures": [
          {
            "label": "effect size favouring failure, resistance-trained only",
            "value": 0.15
          },
          {
            "label": "lower bound of the confidence interval",
            "value": 0.03
          },
          {
            "label": "upper bound of the confidence interval",
            "value": 0.26
          },
          {
            "label": "studies contributing resistance-trained participants",
            "value": 6
          },
          {
            "label": "participants in the full hypertrophy analysis",
            "value": 219
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-frequency-helps-strength",
    "statement": "Strength is the exception: spreading the same volume over more sessions does tend to improve strength, though the returns shrink",
    "peekStatement": "Spreading the same volume over more sessions does tend to help strength, with shrinking returns",
    "grade": "B",
    "status": "settled",
    "domain": "frequency",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "frequency-strength",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-frequency-strength-pelland",
        "claimId": "c-frequency-helps-strength",
        "doi": "10.1007/s40279-025-02344-w",
        "authors": "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        "year": 2026,
        "journal": "Sports Medicine",
        "n": 2058,
        "population": "mixed",
        "effectSize": "Posterior probability that the frequency-strength slope exceeds zero: 100%, with diminishing returns. This contrasts with the same model's hypertrophy result, where the effect was compatible with negligible.",
        "ci": null,
        "figures": [
          {
            "label": "studies pooled",
            "value": 67
          },
          {
            "label": "participants",
            "value": 2058
          },
          {
            "label": "posterior probability of a positive frequency-strength slope",
            "value": 100,
            "unit": "%"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-frequency-irrelevant-when-volume-equated",
    "statement": "Once weekly volume is matched, how many sessions you split it across makes little difference to muscle growth",
    "peekStatement": "With weekly volume matched, how you split it makes little difference to growth",
    "grade": "A",
    "status": "settled",
    "domain": "frequency",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "frequency-volume-equated",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-frequency-schoenfeld",
        "claimId": "c-frequency-irrelevant-when-volume-equated",
        "doi": "10.1080/02640414.2018.1555906",
        "authors": "Schoenfeld BJ, Grgic J, Krieger J",
        "year": 2019,
        "journal": "Journal of Sports Sciences",
        "n": null,
        "population": "mixed",
        "effectSize": "No significant difference between higher and lower frequency on a volume-equated basis, including in the resistance-trained subgroup.",
        "ci": null,
        "figures": [
          {
            "label": "studies pooled",
            "value": 25
          }
        ],
        "quote": "there is strong evidence that resistance training frequency does not significantly or meaningfully impact muscle hypertrophy when volume is equated"
      },
      {
        "id": "cit-frequency-pelland",
        "claimId": "c-frequency-irrelevant-when-volume-equated",
        "doi": "10.1007/s40279-025-02344-w",
        "authors": "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        "year": 2026,
        "journal": "Sports Medicine",
        "n": 2058,
        "population": "mixed",
        "effectSize": "Posterior probability that the frequency-hypertrophy slope exceeds zero was below 100%, which the authors read as compatible with negligible effects.",
        "ci": null,
        "figures": [
          {
            "label": "studies pooled",
            "value": 67
          },
          {
            "label": "participants",
            "value": 2058
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-protein-dose-plateau",
    "statement": "Past roughly 1.6 g of protein per kg of bodyweight a day, more protein stops adding measurable lean mass",
    "peekStatement": "Past roughly 1.6 g per kg a day, more protein stops adding measurable lean mass",
    "grade": "B",
    "status": "settled",
    "domain": "protein-dose",
    "predicates": {
      "and": [
        {
          "!=": [
            {
              "var": "proteinPerKg7d"
            },
            null
          ]
        },
        {
          "<": [
            {
              "var": "proteinPerKg7d"
            },
            1.6
          ]
        }
      ]
    },
    "trigger": "rule",
    "clusterId": null,
    "phrasingKey": "protein-dose-plateau",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-protein-plateau-morton",
        "claimId": "c-protein-dose-plateau",
        "doi": "10.1136/bjsports-2017-097608",
        "authors": "Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM",
        "year": 2018,
        "journal": "British Journal of Sports Medicine",
        "n": 1863,
        "population": "mixed",
        "effectSize": "Two-phase break-point analysis placed the plateau at a total intake of 1.62 g/kg/day, beyond which supplementation produced no further gain in fat-free mass. The paper reports the breakpoint as a point estimate; we could not read an interval around it, so treat 1.6 as the centre of a fuzzy region rather than a line.",
        "ci": null,
        "figures": [
          {
            "label": "intake where added protein stops helping",
            "value": 1.62,
            "unit": "g/kg/day"
          },
          {
            "label": "randomised trials pooled",
            "value": 49
          },
          {
            "label": "participants",
            "value": 1863
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-protein-helps-trained-more",
    "statement": "Training experience increases how much extra protein helps, while getting older reduces it",
    "peekStatement": "Training experience raises how much extra protein helps; getting older reduces it",
    "grade": "B",
    "status": "settled",
    "domain": "protein-dose",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "protein-trained-benefit",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-protein-trained-morton",
        "claimId": "c-protein-helps-trained-more",
        "doi": "10.1136/bjsports-2017-097608",
        "authors": "Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM",
        "year": 2018,
        "journal": "British Journal of Sports Medicine",
        "n": 1863,
        "population": "mixed",
        "effectSize": "Supplementation was more effective in resistance-trained participants by 0.75 kg of fat-free mass (p = 0.03); the benefit fell by 0.01 kg per year of age (p = 0.002). Both are covariate subgroup findings within one meta-regression, not separately replicated.",
        "ci": "Resistance-trained advantage 95% CI 0.09 to 1.40 kg; effect of age 95% CI -0.02 to -0.00 kg per year",
        "figures": [
          {
            "label": "extra fat-free mass in resistance-trained participants",
            "value": 0.75,
            "unit": "kg"
          },
          {
            "label": "fat-free mass benefit lost per year of age",
            "value": -0.01,
            "unit": "kg/year"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-protein-supplementation-works",
    "statement": "Supplementing protein while you lift produces a real but modest increase in lean mass and strength",
    "peekStatement": "Supplementing protein while you lift gives a real but modest gain",
    "grade": "A",
    "status": "settled",
    "domain": "protein-dose",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "protein-supplementation",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-protein-supp-morton",
        "claimId": "c-protein-supplementation-works",
        "doi": "10.1136/bjsports-2017-097608",
        "authors": "Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM",
        "year": 2018,
        "journal": "British Journal of Sports Medicine",
        "n": 1863,
        "population": "mixed",
        "effectSize": "Fat-free mass +0.30 kg and one-repetition maximum +2.49 kg over the no-supplement condition, pooled across 49 randomised controlled trials.",
        "ci": "Fat-free mass 95% CI 0.09 to 0.52 kg; 1RM strength 95% CI 0.64 to 4.33 kg; muscle fibre cross-sectional area 95% CI 51 to 570 um2",
        "figures": [
          {
            "label": "randomised trials pooled",
            "value": 49
          },
          {
            "label": "participants",
            "value": 1863
          },
          {
            "label": "added fat-free mass",
            "value": 0.3,
            "unit": "kg"
          },
          {
            "label": "added 1RM strength",
            "value": 2.49,
            "unit": "kg"
          },
          {
            "label": "added muscle fibre cross-sectional area",
            "value": 310,
            "unit": "um2"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-protein-timing-distribution-matters",
    "statement": "Spreading protein into 20-40 g doses every three to four hours, including around training, may still add something total intake alone does not",
    "peekStatement": "Spreading protein through the day may add something total intake alone does not",
    "grade": "C",
    "status": "contested",
    "domain": "protein-timing",
    "predicates": null,
    "trigger": null,
    "clusterId": "protein-timing",
    "phrasingKey": "protein-timing-distribution",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-timing-distribution-issn",
        "claimId": "c-protein-timing-distribution-matters",
        "doi": "10.1186/s12970-017-0189-4",
        "authors": "Kerksick CM, Arent S, Schoenfeld BJ, Stout JR, Campbell B, Wilborn CD, Taylor L, Kalman D, Smith-Ryan AE, Kreider RB, and others",
        "year": 2017,
        "journal": "Journal of the International Society of Sports Nutrition",
        "n": null,
        "population": "mixed",
        "effectSize": "No pooled effect estimate. This is an expert position stand reasoning from acute muscle-protein-synthesis measurements, not from chronic hypertrophy trials. It recommends 20-40 g doses (0.25-0.40 g/kg) every three to four hours, and notes post-exercise protein raises synthesis rates. The same document names meeting total daily intake as the primary emphasis.",
        "ci": null,
        "figures": [
          {
            "label": "recommended protein dose per feeding, lower bound",
            "value": 20,
            "unit": "g"
          },
          {
            "label": "recommended protein dose per feeding, upper bound",
            "value": 40,
            "unit": "g"
          },
          {
            "label": "recommended hours between feedings, lower bound",
            "value": 3,
            "unit": "h"
          },
          {
            "label": "recommended hours between feedings, upper bound",
            "value": 4,
            "unit": "h"
          }
        ],
        "quote": "Post-exercise ingestion (immediately to 2-h post) of high-quality protein sources stimulates robust increases in MPS"
      },
      {
        "id": "cit-timing-distribution-pooled",
        "claimId": "c-protein-timing-distribution-matters",
        "doi": "10.1186/1550-2783-10-53",
        "authors": "Schoenfeld BJ, Aragon AA, Krieger JW",
        "year": 2013,
        "journal": "Journal of the International Society of Sports Nutrition",
        "n": 525,
        "population": "unstated",
        "effectSize": "Before covariates were controlled, the same meta-analysis that refuted timing did find a small-to-moderate pooled effect on hypertrophy. That uncontrolled estimate is the strongest quantitative footing this side has, and its authors attribute it to total protein intake rather than timing.",
        "ci": null,
        "figures": [
          {
            "label": "subjects in the hypertrophy analysis",
            "value": 525
          },
          {
            "label": "studies in the hypertrophy analysis",
            "value": 23
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-protein-timing-total-intake-dominates",
    "statement": "Once total daily protein is accounted for, when you eat it around training stops predicting muscle or strength gains",
    "peekStatement": "Once daily total is accounted for, timing around training stops predicting gains",
    "grade": "B",
    "status": "contested",
    "domain": "protein-timing",
    "predicates": {
      "!=": [
        {
          "var": "proteinPerKg7d"
        },
        null
      ]
    },
    "trigger": "rule",
    "clusterId": "protein-timing",
    "phrasingKey": "protein-timing-total-dominates",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-timing-total-schoenfeld",
        "claimId": "c-protein-timing-total-intake-dominates",
        "doi": "10.1186/1550-2783-10-53",
        "authors": "Schoenfeld BJ, Aragon AA, Krieger JW",
        "year": 2013,
        "journal": "Journal of the International Society of Sports Nutrition",
        "n": 525,
        "population": "unstated",
        "effectSize": "A simple pooled analysis showed a small-to-moderate effect of timing on hypertrophy, but in the full meta-regression controlling for covariates no significant difference remained for either strength or hypertrophy. Total protein intake was the strongest predictor of effect-size magnitude. Graded B rather than A: one meta-analysis from 2013, not replicated in this base, and the training status of its pooled subjects was not stated in the source we read.",
        "ci": null,
        "figures": [
          {
            "label": "subjects in the hypertrophy analysis",
            "value": 525
          },
          {
            "label": "studies in the hypertrophy analysis",
            "value": 23
          },
          {
            "label": "effect sizes in the hypertrophy analysis",
            "value": 132
          },
          {
            "label": "subjects in the strength analysis",
            "value": 478
          },
          {
            "label": "studies in the strength analysis",
            "value": 20
          }
        ],
        "quote": "total protein intake was the strongest predictor of ES magnitude"
      }
    ]
  },
  {
    "id": "c-refeed-dry-fat-free-mass-trained-adults",
    "statement": "In a seven-week trial of resistance-trained adults, two carbohydrate-refeed days per week during energy restriction produced a smaller loss of dry fat-free mass than continuous restriction",
    "peekStatement": "A small trial suggests less dry fat-free-mass loss with weekly carbohydrate refeeds.",
    "grade": "C",
    "status": "settled",
    "domain": "energy-balance",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "refeed-dry-fat-free-mass-trained-adults",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-refeed-dry-fat-free-mass-campbell",
        "claimId": "c-refeed-dry-fat-free-mass-trained-adults",
        "doi": "10.3390/jfmk5010019",
        "authors": "Campbell BI, Aguilar D, Colenso-Semple LM, et al.",
        "year": 2020,
        "journal": "Journal of Functional Morphology and Kinesiology",
        "n": 27,
        "population": "mixed",
        "effectSize": "Dry fat-free mass changed by -0.2 kg with refeeding and -1.9 kg with continuous restriction (group-by-time interaction p <= 0.001).",
        "ci": "Dry fat-free-mass change: refeeding -0.2 kg (95% CI -0.7 to 0.3); continuous restriction -1.9 kg (95% CI -2.7 to -1.2).",
        "figures": [
          {
            "label": "trial duration",
            "value": 7,
            "unit": "weeks"
          },
          {
            "label": "weekly carbohydrate-refeed days",
            "value": 2,
            "unit": "days"
          },
          {
            "label": "dry fat-free-mass change, refeed",
            "value": -0.2,
            "unit": "kg"
          },
          {
            "label": "dry fat-free-mass change, continuous restriction",
            "value": -1.9,
            "unit": "kg"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-rest-at-least-60-seconds",
    "statement": "Resting longer than about a minute between sets may be slightly better for growth, though the effect is not clearly separable from none, and past roughly 90 seconds the authors found no further difference",
    "peekStatement": "Resting past about a minute may help growth slightly, though not clearly separably from none",
    "grade": "C",
    "status": "settled",
    "domain": "rest-intervals",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rest-interval-60s",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-rest-singer",
        "claimId": "c-rest-at-least-60-seconds",
        "doi": "10.3389/fspor.2024.1429789",
        "authors": "Singer A, Wolf M, Generoso L, Arias E, Delcastillo K, Echevarria E, Martinez A, Androulakis Korakakis P, Refalo MC, Swinton PA, Schoenfeld BJ",
        "year": 2024,
        "journal": "Frontiers in Sports and Active Living",
        "n": null,
        "population": "unstated",
        "effectSize": "Central estimates favoured longer rest for the arm (0.13) and thigh (0.17) and marginally favoured shorter rest for the whole body (-0.08). Every one of those controlled credible intervals crosses zero, so the direction is consistent but the effect is not clearly distinguishable from none. The authors conclude a small benefit to resting beyond 60 s, and separately report detecting no appreciable difference beyond 90 s — that upper bound is the source of the 90-second figure in the statement.",
        "ci": "Arm 95% CrI -0.27 to 0.51; thigh 95% CrI -0.13 to 0.43; whole body 95% CrI -0.45 to 0.29",
        "figures": [
          {
            "label": "standardised mean difference, arm",
            "value": 0.13
          },
          {
            "label": "standardised mean difference, thigh",
            "value": 0.17
          },
          {
            "label": "standardised mean difference, whole body",
            "value": -0.08
          },
          {
            "label": "measurements pooled",
            "value": 19
          },
          {
            "label": "studies pooled",
            "value": 9
          },
          {
            "label": "rest duration above which a benefit was suggested",
            "value": 60,
            "unit": "s"
          },
          {
            "label": "rest duration beyond which no further difference was detected",
            "value": 90,
            "unit": "s"
          }
        ],
        "quote": "our analysis did not detect appreciable differences in hypertrophy when resting >90 s between sets"
      },
      {
        "id": "cit-rest-grgic",
        "claimId": "c-rest-at-least-60-seconds",
        "doi": "10.1080/17461391.2017.1340524",
        "authors": "Grgic J, Lazinica B, Mikulic P, Krieger JW, Schoenfeld BJ",
        "year": 2017,
        "journal": "European Journal of Sport Science",
        "n": null,
        "population": "mixed",
        "effectSize": "A qualitative systematic review of six studies with no pooled estimate. It reports that both short and long rest may work, with a possible advantage to longer rest in trained participants, and explicitly calls the evidence base sparse.",
        "ci": null,
        "figures": [
          {
            "label": "studies reviewed",
            "value": 6
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-rest-hypertrophy-trained-anterior-thigh",
    "statement": "In young resistance-trained men, three-minute versus one-minute rests produced greater anterior-thigh muscle thickness after eight weeks",
    "peekStatement": "In one trial, three-minute rests produced greater anterior-thigh growth in trained men.",
    "grade": "B",
    "status": "settled",
    "domain": "rest-intervals",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rest-hypertrophy-trained-anterior-thigh",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rest-hypertrophy-schoenfeld",
        "claimId": "c-rest-hypertrophy-trained-anterior-thigh",
        "doi": "10.1519/JSC.0000000000001272",
        "authors": "Schoenfeld BJ, Pope ZK, Benik FM, Hester GM, Sellers J, Nooner JL, Schnaiter JA, Bond-Williams KE, Carter AS, Ross CL, Just BL, Henselmans M, Krieger JW",
        "year": 2016,
        "journal": "Journal of Strength and Conditioning Research",
        "n": 21,
        "population": "trained",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "participants",
            "value": 21
          },
          {
            "label": "shorter inter-set rest duration",
            "value": 1,
            "unit": "min"
          },
          {
            "label": "longer inter-set rest duration",
            "value": 3,
            "unit": "min"
          },
          {
            "label": "training duration",
            "value": 8,
            "unit": "weeks"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-rest-strength-trained-longer",
    "statement": "In resistance-trained individuals, rests longer than two minutes appear necessary to maximize strength gains",
    "peekStatement": "For trained lifters, rests longer than two minutes appear to favour maximum strength gains.",
    "grade": "B",
    "status": "settled",
    "domain": "rest-intervals",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rest-strength-trained-longer",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rest-strength-grgic",
        "claimId": "c-rest-strength-trained-longer",
        "doi": "10.1007/s40279-017-0788-x",
        "authors": "Grgic J, Schoenfeld BJ, Skrepnik M, Davies TB, Mikulic P",
        "year": 2018,
        "journal": "Sports Medicine",
        "n": 491,
        "population": "mixed",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "studies reviewed",
            "value": 23
          },
          {
            "label": "participants reviewed",
            "value": 491
          },
          {
            "label": "rest duration above which strength gains appeared maximized in trained individuals",
            "value": 2,
            "unit": "min"
          }
        ],
        "quote": "However, it seems that longer duration RIs (> 2 min) are required to maximize strength gains in resistance-trained individuals."
      }
    ]
  },
  {
    "id": "c-rom-full-lower-limb-hypertrophy",
    "statement": "In the cited meta-analysis, full range-of-motion training produced greater lower-limb hypertrophy than partial range-of-motion training",
    "peekStatement": "The pooled evidence favoured full range of motion for lower-limb growth.",
    "grade": "A",
    "status": "settled",
    "domain": "range-of-motion",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rom-full-lower-limb-hypertrophy",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rom-hypertrophy-pallares",
        "claimId": "c-rom-full-lower-limb-hypertrophy",
        "doi": "10.1111/sms.14006",
        "authors": "Pallares JG, Hernandez-Belmonte A, Martinez-Cava A, Vetrovsky T, Steffl M, Courel-Ibanez J",
        "year": 2021,
        "journal": "Scandinavian Journal of Medicine & Science in Sports",
        "n": null,
        "population": "unstated",
        "effectSize": "Full range of motion favoured lower-limb hypertrophy (ES 0.88, p = 0.027).",
        "ci": null,
        "figures": [
          {
            "label": "effect size favouring full range of motion for lower-limb hypertrophy",
            "value": 0.88
          },
          {
            "label": "p value for the lower-limb hypertrophy comparison",
            "value": 0.027
          }
        ],
        "quote": "Full ROM resistance training is more effective than partial ROM to maximize lower-limb muscle hypertrophy."
      }
    ]
  },
  {
    "id": "c-rom-full-strength",
    "statement": "In the cited meta-analysis, full range-of-motion training produced greater strength adaptations than partial range-of-motion training",
    "peekStatement": "The pooled evidence favoured full range of motion for strength.",
    "grade": "A",
    "status": "settled",
    "domain": "range-of-motion",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rom-full-strength",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rom-strength-pallares",
        "claimId": "c-rom-full-strength",
        "doi": "10.1111/sms.14006",
        "authors": "Pallares JG, Hernandez-Belmonte A, Martinez-Cava A, Vetrovsky T, Steffl M, Courel-Ibanez J",
        "year": 2021,
        "journal": "Scandinavian Journal of Medicine & Science in Sports",
        "n": null,
        "population": "unstated",
        "effectSize": "Full range of motion favoured strength adaptations (ES 0.56, p = 0.004).",
        "ci": null,
        "figures": [
          {
            "label": "effect size favouring full range of motion for strength",
            "value": 0.56
          },
          {
            "label": "p value for the strength comparison",
            "value": 0.004
          }
        ],
        "quote": "Full ROM resistance training is more effective than partial ROM to maximize muscle strength."
      }
    ]
  },
  {
    "id": "c-rom-initial-partial-knee-extension",
    "statement": "In untrained women, initial partial knee extensions from 100 to 65 degrees of knee flexion produced greater regional hypertrophy at some sites than full or final partial range of motion",
    "peekStatement": "In untrained women, initial partial knee extensions grew some regions more.",
    "grade": "B",
    "status": "settled",
    "domain": "range-of-motion",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rom-initial-partial-knee-extension",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rom-long-length-pedrosa",
        "claimId": "c-rom-initial-partial-knee-extension",
        "doi": "10.1080/17461391.2021.1927199",
        "authors": "Pedrosa GF, Lima FV, Schoenfeld BJ, Lacerda LT, Simoes MG, Pereira MR, Diniz RCR, Chagas MH",
        "year": 2022,
        "journal": "European Journal of Sport Science",
        "n": 45,
        "population": "untrained",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "participants",
            "value": 45
          },
          {
            "label": "initial partial-ROM start angle",
            "value": 100,
            "unit": "degrees knee flexion"
          },
          {
            "label": "initial partial-ROM end angle",
            "value": 65,
            "unit": "degrees knee flexion"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-rom-upper-body-inconclusive",
    "statement": "Upper-body hypertrophy evidence comparing full and partial range of motion is too limited and conflicting for a strong practical inference",
    "peekStatement": "Upper-body ROM evidence appears to be too limited and conflicting for a strong inference.",
    "grade": "C",
    "status": "settled",
    "domain": "range-of-motion",
    "predicates": null,
    "trigger": null,
    "clusterId": null,
    "phrasingKey": "rom-upper-body-inconclusive",
    "supersededBy": null,
    "lastReviewed": "2026-08-02",
    "citations": [
      {
        "id": "cit-rom-upper-schoenfeld",
        "claimId": "c-rom-upper-body-inconclusive",
        "doi": "10.1177/2050312120901559",
        "authors": "Schoenfeld BJ, Grgic J",
        "year": 2020,
        "journal": "SAGE Open Medicine",
        "n": 74,
        "population": "mixed",
        "effectSize": null,
        "ci": null,
        "figures": [
          {
            "label": "upper-body studies reviewed",
            "value": 2
          },
          {
            "label": "upper-body participants reviewed",
            "value": 74
          }
        ],
        "quote": "Research on the effects of ROM for the upper limbs is limited and conflicting."
      }
    ]
  },
  {
    "id": "c-strength-holds-through-a-deficit",
    "statement": "Strength appears to hold up better than muscle size does in an energy deficit, though the strength comparison is a non-significant result rather than a demonstrated equivalence",
    "peekStatement": "Strength appears to hold up better than size in a deficit, on a non-significant result",
    "grade": "B",
    "status": "settled",
    "domain": "energy-balance",
    "predicates": {
      "and": [
        {
          "==": [
            {
              "var": "goal"
            },
            "cut"
          ]
        },
        {
          ">=": [
            {
              "var": "deficitWeeks"
            },
            4
          ]
        },
        {
          "==": [
            {
              "var": "e1rmTrend"
            },
            "holding"
          ]
        },
        {
          "==": [
            {
              "var": "weightTrend"
            },
            "down"
          ]
        }
      ]
    },
    "trigger": "data-earned",
    "clusterId": null,
    "phrasingKey": "strength-robust-to-deficit",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-strength-deficit-murphy",
        "claimId": "c-strength-holds-through-a-deficit",
        "doi": "10.1111/sms.14075",
        "authors": "Murphy C, Koehler K",
        "year": 2022,
        "journal": "Scandinavian Journal of Medicine and Science in Sports",
        "n": null,
        "population": "unstated",
        "effectSize": "Strength gains did not differ significantly between deficit and control (ES -0.31, p = 0.28) in the same analysis where lean-mass gains were significantly impaired, and a matched second analysis found near-identical strength gains either way (0.84 in deficit versus 0.81 at maintenance). Graded down deliberately: a non-significant result with a point estimate of -0.31 and no reported interval is a failure to detect a difference, not evidence that there is none, and it remains compatible with a real strength cost this analysis was underpowered to see.",
        "ci": null,
        "figures": [
          {
            "label": "effect size on strength, deficit vs control",
            "value": -0.31
          },
          {
            "label": "strength effect size while in a deficit",
            "value": 0.84
          },
          {
            "label": "strength effect size at maintenance",
            "value": 0.81
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-volume-dose-response",
    "statement": "More weekly sets per muscle produce more hypertrophy, with each additional set adding less than the one before",
    "peekStatement": "More weekly sets per muscle produce more growth, each set adding less than the last",
    "grade": "A",
    "status": "settled",
    "domain": "volume",
    "predicates": {
      "some": [
        {
          "var": "muscleSets"
        },
        {
          "<": [
            {
              "var": "sets"
            },
            10
          ]
        }
      ]
    },
    "trigger": "rule",
    "clusterId": null,
    "phrasingKey": "volume-dose-response",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-volume-dose-pelland",
        "claimId": "c-volume-dose-response",
        "doi": "10.1007/s40279-025-02344-w",
        "authors": "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        "year": 2026,
        "journal": "Sports Medicine",
        "n": 2058,
        "population": "mixed",
        "effectSize": "Posterior probability that the volume-hypertrophy slope exceeds zero: 100%. Best-fit model shows diminishing returns.",
        "ci": null,
        "figures": [
          {
            "label": "studies pooled",
            "value": 67
          },
          {
            "label": "participants",
            "value": 2058
          },
          {
            "label": "posterior probability of a positive volume-hypertrophy slope",
            "value": 100,
            "unit": "%"
          }
        ],
        "quote": null
      },
      {
        "id": "cit-volume-dose-schoenfeld",
        "claimId": "c-volume-dose-response",
        "doi": "10.1080/02640414.2016.1210197",
        "authors": "Schoenfeld BJ, Ogborn D, Krieger JW",
        "year": 2017,
        "journal": "Journal of Sports Sciences",
        "n": null,
        "population": "unstated",
        "effectSize": "Each additional weekly set was associated with an effect-size increase of 0.023, corresponding to a 0.37% greater gain in muscle size.",
        "ci": null,
        "figures": [
          {
            "label": "treatment groups",
            "value": 34
          },
          {
            "label": "studies pooled",
            "value": 15
          },
          {
            "label": "effect size added per weekly set",
            "value": 0.023
          },
          {
            "label": "extra muscle gain per weekly set",
            "value": 0.37,
            "unit": "%"
          },
          {
            "label": "gain difference, higher vs lower volume",
            "value": 3.9,
            "unit": "%"
          }
        ],
        "quote": null
      }
    ]
  },
  {
    "id": "c-volume-strength-diminishing-returns",
    "statement": "Strength gains keep rising with weekly volume too, but they flatten off much faster than muscle size does",
    "peekStatement": "Strength rises with weekly volume too, but flattens off much faster than size does",
    "grade": "B",
    "status": "settled",
    "domain": "volume",
    "predicates": {
      "some": [
        {
          "var": "muscleSets"
        },
        {
          ">": [
            {
              "var": "sets"
            },
            20
          ]
        }
      ]
    },
    "trigger": "rule",
    "clusterId": null,
    "phrasingKey": "volume-strength-diminishing",
    "supersededBy": null,
    "lastReviewed": "2026-07-25",
    "citations": [
      {
        "id": "cit-volume-strength-pelland",
        "claimId": "c-volume-strength-diminishing-returns",
        "doi": "10.1007/s40279-025-02344-w",
        "authors": "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC",
        "year": 2026,
        "journal": "Sports Medicine",
        "n": 2058,
        "population": "mixed",
        "effectSize": "Both hypertrophy and strength slopes were positive with 100% posterior probability, but the authors report diminishing returns for strength as considerably more pronounced.",
        "ci": null,
        "figures": [
          {
            "label": "studies pooled",
            "value": 67
          },
          {
            "label": "participants",
            "value": 2058
          }
        ],
        "quote": null
      }
    ]
  }
];

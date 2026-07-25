// GENERATED FILE — do not edit by hand.
// Source: app/claims/*.yaml. Regenerate with `npm run claims`.
// scripts/build-claims.test.ts fails if this file drifts from the YAML.
import type { Claim } from '../advice/types.ts';

export const CLAIMS: Claim[] = [
  {
    "id": "c-frequency-helps-strength",
    "statement": "Strength is the exception: spreading the same volume over more sessions does tend to improve strength, though the returns shrink",
    "grade": "B",
    "status": "settled",
    "domain": "frequency",
    "predicates": null,
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
    "grade": "A",
    "status": "settled",
    "domain": "frequency",
    "predicates": null,
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
        "effectSize": "Two-phase break-point analysis placed the plateau at a total intake of 1.62 g/kg/day, beyond which supplementation produced no further gain in fat-free mass.",
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
    "grade": "B",
    "status": "settled",
    "domain": "protein-dose",
    "predicates": null,
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
    "statement": "Adding protein to an otherwise adequate diet produces a real but modest increase in lean mass and strength while you are lifting",
    "grade": "A",
    "status": "settled",
    "domain": "protein-dose",
    "predicates": null,
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
    "grade": "C",
    "status": "contested",
    "domain": "protein-timing",
    "predicates": null,
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
    "grade": "A",
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
        "effectSize": "A simple pooled analysis showed a small-to-moderate effect of timing on hypertrophy, but in the full meta-regression controlling for covariates no significant difference remained for either strength or hypertrophy. Total protein intake was the strongest predictor of effect-size magnitude.",
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
    "id": "c-volume-dose-response",
    "statement": "More weekly sets per muscle produce more hypertrophy, with each additional set adding less than the one before",
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

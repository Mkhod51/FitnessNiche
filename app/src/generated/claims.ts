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

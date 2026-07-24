# Data Sources: Food, Exercise, Wearables

> **Status:** Phase 1 baseline (food databases only). Wave 1 Stream F extends this — everything below is retained, not replaced.
> Verbatim Phase 1 source archived at `04-sources/raw-notes/phase1/data-and-segments.md`.

Evidence grades: **[A]** meta-analysis/replicated RCT · **[B]** single good study/consistent observational · **[C]** mechanistic/small-n/expert consensus · **[D]** industry/anecdote.

## Phase 1 baseline — food databases

| Source | UK/EU coverage | License | Free tier | Cost at low scale | Quality model |
|---|---|---|---|---|---|
| **USDA FoodData Central** | Weak on UK packaged goods — Branded Food DB (~446K items, ~85% US retail sales coverage [D]) is almost entirely US SKUs. Strong for generic/raw ingredients (universal chemistry) | CC0 1.0, public domain, attribution requested | 1,000 req/hr/IP with free key; higher limits on request [C] | $0 | Foundation/SR Legacy lab-analysed by USDA; Branded Foods manufacturer-submitted and unverified [C] |
| **Open Food Facts** | Best UK fit of the five: ~134,000 products tagged "United Kingdom" [C, single-site stat, not independently audited]. Coverage uneven — major UK supermarket own-brand and FMCG lines decent, small/local brands sparse | ODbL (share-alike + attribution); photos CC BY-SA. Commercial use explicitly permitted [B] | Free, "no rate limiting for reasonable use"; full DB dumps downloadable for self-hosting [B] | $0 | Pure crowdsource (OCR + user photos), no central verification; missing/incorrect nutrient fields common, must be handled defensively [C] |
| **Nutritionix** | US-centric; UK branded coverage thin, mainly restaurant chains with US/UK overlap | Proprietary; self-serve free tier discontinued due to abuse — enterprise/negotiated only [C] | None current self-serve (historically 200 calls/day). Hobby ~$50/mo, Production $500–2,000+/mo [C] | Effectively a paid floor (~$50/mo) even at low volume | Staff-curated + manufacturer branded data; high accuracy, US-first [C] |
| **Edamam** | Modest EU/UK presence via aggregated branded + recipe data; weaker than OFF on UK barcodes | Proprietary ToS; attribution/logo required, redistribution restricted [C] | Basic free: 1,000 req/day, 50 req/min; credit card required even for free tier [B] | $0 under caps; Pro pay-per-call beyond | Aggregated from multiple providers, mixed verification, some overlap with open datasets [D] |
| **FatSecret Platform** | Free "Basic" tier is **US dataset only** — UK/non-US data requires paid "Premier" (or a negotiated "Premier Free" for qualifying students/startups) | Proprietary; Basic framed as evaluation-only, attribution required [C] | Basic: 5,000 calls/day, US data only, free | $0 for US-only testing; effectively paid or application-gated for UK data | Own curated DB + large crowd contribution base [D] |

**UK-specific source:** CoFID (McCance & Widdowson's Composition of Foods Integrated Dataset), maintained by PHE/OHID, free from gov.uk under the Open Government Licence, ~3,300 generic UK foods with full macro/micronutrient panels [B, primary source]. No barcodes or branded products — it is the UK's answer to USDA Foundation Foods, not to packaged goods. Combined with Open Food Facts for barcodes, it closes most of the UK generic-food gap that USDA alone would leave.

### Moat verdict (Phase 1)

**Surmountable, via a layered stack, not a single vendor.** Concrete route: (1) **Open Food Facts** as the primary UK packaged/barcode source — self-host a filtered dump of UK-tagged products (ODbL, free, no redistribution risk if attributed), with a "scan → not found → contribute back" loop that also improves the public dataset (a genuine portfolio talking point). (2) **CoFID** for generic/whole foods and any nutrition-advice-adjacent claims, since it is UK-government-verified rather than crowdsourced. (3) **USDA FoodData Central** (CC0) as a supplementary generic-food fallback where CoFID lacks an entry. Skip Nutritionix, Edamam and FatSecret at v1 — their free tiers are US-gated or too thin, and their ToS actively restrict the caching/redistribution a solo dev needs to hold costs at zero. This is a real engineering task (dedup, matching, gap-filling) but not a data-licensing wall.

## Gaps for Wave 1 Stream F

Phase 1 covered **food databases only**. Entirely absent and now required:

- **Spoonacular** and any other food/recipe APIs not surveyed.
- **Amino-acid profile data** (needed by the Leucine Ledger candidate) — which sources carry per-food AA panels, and at what coverage? USDA SR Legacy is the presumed answer but was never verified.
- **Exercise taxonomies** — is there a usable open exercise database, or must it be hand-built?
- **MET tables** and their provenance/accuracy.
- **Wearable and platform health APIs** — HealthKit, Health Connect, Strava, Garmin, Whoop, Oura, Polar: what each exposes, approval friction, terms, and whether a solo dev can realistically get access.
- **Verification that Hevy/Strong export usable CSV on the free tier** — Phase 1 promoted CSV import to a *survival requirement* without checking this (see `00-meta/carryover.md` §2.3).

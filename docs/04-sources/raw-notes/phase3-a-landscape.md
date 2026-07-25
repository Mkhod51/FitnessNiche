# Phase 3a — Landscape scan: who already does citation-backed / evidence-graded fitness advice

Retrieval only — enumeration, not verdicts. ~16 web searches, no direct app-file inspection (no app-store account / paywall logins used). Confidence tags: [B] documented/primary, [C] consistent multi-source, [D] single blog/marketing/speculative. "Unknown" = could not verify, not "assumed no."

## Inventory table

| Product | What it is | Cites specific studies? How? | Real & specific, or decorative? | Attached to in-app advice, or separate content? | Figure-level (effect sizes/n/numbers)? | Pricing | Audience size |
|---|---|---|---|---|---|---|---|
| **Renaissance Periodization (RP)** — content + Hypertrophy/Diet apps | Content brand (Dr. Mike Israetel et al.) + tracking apps | Books/PDFs cite 7–50 refs per chapter [C]; the **apps themselves show no evidence of in-app citations** — reviewers explicitly note the app relies on Israetel's authority/methodology rather than displaying literature refs in the UI [C] (dr-muscle.com reviews found "hardly enough evidence" documented in-app, methodology called "theoretical... no hard evidence" by one critical reviewer) | Content: real (books have reference lists). App: **unknown/likely decorative** — no citation UI found | Separate — citations live in books/articles/YouTube; the app surfaces auto-regulated volume/pump-based logic, not linked references | No — app surfaces prescriptions (sets/reps/RIR), not effect sizes | RP Hypertrophy app: freemium, subscription (exact tier not confirmed this pass) | "Over 175,000 app users" cited by one source [D] — not independently confirmed |
| **Stronger By Science + MASS Research Review** | Content brand + monthly research-review PDF/newsletter (Nuckols, Helms, Trexler, etc.) | Yes — MASS's entire product is a paper-by-paper breakdown, each issue reviews specific named studies [B] | Real & specific — named studies, authors, journals; explicit stated purpose is applying peer-reviewed research | Separate — PDF/article/video product, **not a tracker**; no workout/food logging | Yes — MASS explicitly discusses effect sizes, sample sizes, stats critique as its core content [B] | $29/mo standard; $299/yr; $999 lifetime [B] massresearchreview.com | Archive of 1000+ articles/videos, 600 audio episodes, 150 hrs video [B]; subscriber count not disclosed |
| **Menno Henselmans / Bayesian Bodybuilding** | Content brand + coaching methodology + an "adaptive coaching app" | Henselmans has published in Sports Medicine (peer-reviewed, w/ Brad Schoenfeld) [B mennohenselmans.com]; site content references studies in articles | Real for his own publications; **app-level citation behavior unknown** — no source found describing in-app citation display | Unknown for app; articles are separate content | Unknown for app; articles sometimes discuss study specifics | Not found this pass (unknown) | Not found this pass (unknown) |
| **Jeff Nippard** (content) + **MacroFactor Workouts app** (his paid program, not "UPLIFT" — no app of that name was found) | YouTube/content brand + a $99 structured-program app built on MacroFactor's platform | Content: videos routinely cite named studies (established reputation, "6 publications" per ResearchGate profile) [C]; **app-level citation UI not confirmed** — no source describes in-app footnotes/links | Content: real, specific. App: unknown | Separate — study citations appear in YouTube videos/PDF guides; app is the program-delivery vehicle | Content occasionally states effect sizes/numbers in videos (not verified this pass in depth); app: unknown | MacroFactor Workouts: $99 one-time (per YouTube video title) [D] | YouTube: ~8.5M subscribers as of July 2026 [C, multiple tracker sites converge] |
| **Eric Helms / 3DMJ** | PhD researcher, coach, MASS co-founder, "Muscle and Strength Pyramid" books, Team 3DMJ coaching | Books/pyramids and MASS are citation-dense [B]; 3DMJ's "Technique Perfection Library" ($28) explicitly advertised as having "linked citations with text-based instruction" [C wisvalue.com] | Real & specific — Helms is a published researcher himself | Mixed — the Technique Perfection Library appears to attach citations directly to instructional content (closer to "in-product" than pure marketing), but this is a video/PDF library, not a tracking app | Unknown depth; likely conclusion-level in consumer video products, figure-level in his own journal papers | 3DMJ coaching pricing not found; Technique Perfection Library $28 [C] | Not found this pass (unknown) |
| **Examine.com** | Nutrition/supplement evidence **database** (not a tracker) | Yes — core product design: every claim/summary is cited, database covers 10,000+ human in-vivo studies [B examine.com, Wikipedia] | Real & specific — named studies, "Human Effect Matrix" grades evidence quality per study | Separate from any tracking app — Examine has no food/training logger; it's a reference site/app | **Yes** — this is the strongest figure-level comparator: study-level "grade" of evidence, effect direction, and (in Examine+/Pro) more granular breakdowns | Free tier + Examine+ ~$29/mo or ~$198–$171/yr (discounted) [C]; also Examine Pro for professionals | 30+ person research team since 2011 [B]; user/subscriber counts not disclosed |
| **Consensus (app)** | General-purpose AI research-summary tool (not fitness-specific) | Yes, by design — searches peer-reviewed literature, shows "Yes/No/Mixed" consensus meter, links to source papers, study type, citation counts [B, multiple sources incl. PMC review] | Real & specific — pulls from actual indexed papers, not generative fabrication (per its stated method) | N/A — general research tool, no fitness tracking; a user could paste a fitness question into it but it is not integrated into any tracker | Yes — paper-level metadata shown (citation counts, study type); depth of effect-size surfacing not fully confirmed this pass | Has free + paid tiers (specifics not retrieved this pass — unknown) | Not found this pass (unknown) |
| **Fitbod (AI coach)** | AI workout-generation app (not citation-based; volume/recovery-model driven) | **No literature citation found** — its "evidence" is internal usage data (e.g., "1.5M sets analyzed," "27% faster 1RM gains") rather than named external peer-reviewed studies [C, fitbod.me blog + reviews] | Internal analytics, not academic citations — different category from "cites studies" | N/A (no external-study citation mechanism found) | Yes, but of its own internal data, not published research — e.g., "27% faster," "4% average drop across 7 exercises" [D self-reported blog] | ~$95.99/yr per one aggregator [D] | Not found this pass; "millions of logged sets" implies large base but no user count found |
| **Macrofactor** (adaptive nutrition tracker, Greg Nuckols) | Nutrition-tracking app w/ adaptive algorithm + "Coach" educational modules | Reviewer consensus: MacroFactor's **public articles** (BMR series, algorithm-accuracy posts) cite literature and explain reasoning [C, multiple reviews]; **whether the in-app "Coaching modules" themselves show citations/links, vs. just plain-English explanations, was not directly confirmed** — treat as unknown/plausible-but-unverified | Articles: real, specific, by a known researcher (Nuckols runs/ran Stronger By Science). In-app modules: unknown/unverified | Best candidate found for "explanation attached near tracking," but **no source confirmed inline citations/links inside the app's coaching-module UI itself** — this is the key ambiguity to flag to the architect | Not confirmed in-app; articles discuss algorithm accuracy with some specificity | $11.99/mo, $47.99/6mo, $71.99/yr [B macrofactor.com]; Workouts add-on $99 | 400,000+ users, 4.8★ both stores [C] |
| **Kompanion** | "Science-informed" fasting/calorie coach app | Described as "science-informed" in marketing copy; **no evidence found of specific study citations in-app or in marketing** | Unknown — likely decorative marketing term ("science-informed") absent supporting detail | Unknown | Unknown | Not found this pass | Not found this pass |
| **Train Fitness (AI)** | Apple-Watch-based automatic workout-tracking app (motion-recognition ML) | No literature-citation mechanism found; differentiator is auto-detection tech, not evidence grading | N/A | N/A | N/A | Not found this pass (unknown) | ~10,000 WAU as of funding-round coverage; $2.5M seed raised [C betakit.com] |
| **ChatGPT-based / generic LLM fitness coaches** | Ad hoc use of general LLMs for programming/nutrition advice | Will cite "studies" on request, but **peer-reviewed evidence shows high fabrication rates for exactly this kind of citation**: ~20–47% of AI-generated citations found fabricated/erroneous across studies; one review states 47% of references in AI-generated medical content were completely fabricated [B — Nature Scientific Reports, PMC studies] | **Decorative/fabricated by default** unless the product uses retrieval-augmented grounding — this is a directly relevant risk data-point for the target idea | N/A (no tracking integration) | Confident-sounding but unverified numbers are exactly the failure mode described (a fabricated source can carry a fabricated tempo/rep-range/effect size) | N/A | N/A |
| **App-store "evidence-based" / "science-based" scan** | General category sweep | Marketing-page language is common ("evidence-based," "science-based") across apps like Caliber, Fitness Refined, Fitbod — but **the term is typically a positioning claim in listicles/reviews, not a description of an in-app citation feature**; no app found in this pass that surfaces named studies or DOIs inside the tracking flow itself | Overwhelmingly decorative at the marketing-copy level based on this pass — no counter-example found where "science-based" branding maps to visible in-app citations | Separate (marketing copy, blog reviews) | No | N/A | N/A |

## Closest existing thing to "citation-grounded advice inside a tracking app" — factual summary

Based on searches this pass, no product was found that clearly combines **(a) a food/training tracker a user logs into daily** with **(b) inline, in-app links or footnotes to specific named studies attached to the advice being given at the moment of use.** The landscape splits cleanly into two clusters:

1. **Content that cites real, specific research — but lives outside any tracker**: MASS Research Review, Examine.com's database, Stronger By Science articles, Menno Henselmans's published work, Eric Helms/3DMJ's Technique Perfection Library (which does explicitly advertise "linked citations"), and Jeff Nippard's YouTube content. Examine.com is the strongest comparator for "citation rigor as the core product" but it is a reference database, not a tracker — you look things up, you don't log workouts/food in it. [C]

2. **Trackers/apps that market "evidence-based" or "science-based" — but show no found evidence of in-app citations**: RP's Hypertrophy/Diet apps, Fitbod, Train Fitness, Kompanion, and the general App Store "evidence-based" category. Their evidence claims are either about internal usage-data analytics (Fitbod's "1.5M sets analyzed") or unspecified marketing language, not links to external peer-reviewed papers surfaced to the user in-product.

**MacroFactor is the closest partial overlap found**: it is a tracker, built by a researcher (Nuckols) with published, citation-dense public writing about the app's own methodology (BMR articles, algorithm-accuracy posts), and it has in-app "Coaching modules" that deliver contextual explanations tied to a user's actual data. However, **no source confirmed that those in-app coaching modules themselves display citations/links to specific studies** — the citation-rich material found was the separate public-facing articles, not confirmed as replicated inside the module UI. This is flagged as an open/unverified point rather than a confirmed match. [C for the articles; unknown for in-app module citation display]

The ChatGPT/general-LLM-coach category is a relevant risk data-point rather than a competitor: published research shows generic LLMs fabricate a substantial fraction of citations (estimates 20–47% depending on domain/study) when asked to ground fitness/health claims, meaning a "just ask ChatGPT" substitute for the target idea carries a documented, verifiable failure mode rather than being a credible incumbent. [B]

## Source list

- https://dr-muscle.com/rp-hypertrophy-app-review/
- https://dr-muscle.com/rp-hypertrophy-app-critique/
- https://strengthlab360.com/blogs/reviews-and-tests/the-rp-hypertrophy-app-review-why-strengthlab360-is-superior
- https://rpstrength.com/pages/hypertrophy-app
- https://www.strongerbyscience.com/mass/
- https://massresearchreview.com/subscribe-now-2/
- https://massresearchreview.com/frequently-asked-questions-2/
- https://www.strongerbyscience.com/master-list/
- https://mennohenselmans.com/10-bayesian-bodybuilding-updates/
- https://mennohenselmans.com/bayesian-bodybuilding-method/
- https://mennohenselmans.com/
- https://jeffnippard.com/
- https://www.youtube.com/watch?v=AsLjl8NuqSw (MacroFactor Workouts app, $99)
- https://www.researchgate.net/profile/Jeff-Nippard
- https://hypeauditor.com/youtube/UC68TLK0mAEzUyHx5x5k-S1Q/ (subscriber count)
- https://barbend.com/experts/dr-eric-helms/
- https://wisvalue.com/team-3dmj-and-eric-helms-technique-perfection-library-3dmj-vault/ ($28, "linked citations")
- https://www.3dmusclejourney.com/about/
- https://muscleandstrengthpyramids.com/
- https://examine.com/
- https://examine.com/store/erd/
- https://examine.com/plus/academic-libraries/
- https://en.wikipedia.org/wiki/Examine.com
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12318603/ (Consensus.app academic-research review)
- https://marshallgjones.substack.com/p/an-ai-tool-for-reviewing-research
- https://effortlessacademic.com/consensus-ai-review-for-literature-reviews/
- https://fitbod.me/blog/best-ai-fitness-apps-in-2026-which-ones-actually-use-real-data-not-just-buzzwords/
- https://dr-muscle.com/fitbod-workout-app-review/
- https://www.fitbudd.com/fitness-industry-trends/ai-fitness-coaching-report
- https://macrofactor.com/algorithm-accuracy/
- https://macrofactor.com/mm-september-2024/ (coaching modules)
- https://macrofactor.com/workouts/price/
- https://nutriscan.app/blog/posts/macrofactor-cost-2026-free-version-29f5edc98b
- https://feastgood.com/macrofactor-review/
- https://mwm.ai/apps/kompanion-weight-loss-plan/1576161548
- https://betakit.com/train-fitness-closes-2-5-million-usd-to-expand-automatic-workout-tracking-app-for-strength-training/
- https://www.nature.com/articles/s41598-023-41032-5 (ChatGPT citation fabrication study)
- https://studyfinds.org/chatgpts-hallucination-problem-fabricated-references/
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11153973/ (ChatGPT/Bard hallucination rates, systematic reviews)
- https://strive-workout.com/2026/03/03/top-workout-apps/ ("science-based" app-store sweep)
- https://veriapp.co/top-fitness-apps-that-actually-work-science-based-review/

## Explicit gaps / unknowns flagged

- Could not verify whether RP's apps (Hypertrophy/Diet) show any in-app citations at all — no source directly describes the in-app UI on this point.
- Could not verify MacroFactor's in-app "Coaching module" citation behavior specifically (vs. its separate public articles, which are citation-rich).
- Menno Henselmans's app-level (not article-level) citation behavior is unverified.
- Audience/subscriber numbers for MASS, Examine+, Bayesian Bodybuilding, and 3DMJ coaching were not disclosed in available sources.
- "UPLIFT" app by Jeff Nippard as named in the brief was not found; the closest match is the MacroFactor-built "MacroFactor Workouts" program he authored ($99).

export type Grade = 'A' | 'B' | 'C' | 'D';

/**
 * 'unstated' is not a cop-out, it is the honest reading of a paywalled corpus: much
 * of this literature is closed access and plenty of abstracts never say who was
 * studied. FR-ADV-8 makes population a first-class field, and "the source we read
 * did not say" is a truthful value for it. Guessing 'mixed' to fill the slot would
 * be exactly the inference the curation rules forbid — and it would quietly defeat
 * FR-CLAIM-5, which can only drop a grade for a population mismatch you can see.
 */
export type Population = 'trained' | 'untrained' | 'mixed' | 'unstated';

/** A single extracted number, re-plotted in our own chart style (GR-3). */
export interface Figure {
  label: string;
  value: number;
  unit?: string;
}

export interface Citation {
  id: string;
  claimId: string;
  doi: string;
  authors: string;
  year: number;
  journal: string;
  /** Sample size. null when the source did not state one we could read. */
  n: number | null;
  population: Population;
  /** null when not extractable from a source we actually read. Never inferred. */
  effectSize: string | null;
  ci: string | null;
  figures: Figure[];
  quote: string | null;
}

/** A json-logic rule. Opaque here; evaluated by src/advice/engine.ts. */
export type JsonLogicRule = Record<string, unknown>;

export interface Claim {
  id: string;
  statement: string;
  /** Curated short form for the advice peek — never a truncation of `statement`. */
  peekStatement: string;
  grade: Grade;
  status: 'settled' | 'contested';
  domain: string;
  /** null = the claim is only ever surfaced via search, never rule-triggered. */
  predicates: JsonLogicRule | null;
  /** Declares whether a matching predicate is generic context or earned from logged data. */
  trigger: 'rule' | 'data-earned' | null;
  /** Contested claims sharing a clusterId are opposing sides of one question. */
  clusterId: string | null;
  phrasingKey: string;
  supersededBy: string | null;
  /** ISO date, YYYY-MM-DD. FR-CLAIM-4. */
  lastReviewed: string;
  citations: Citation[];
}

export interface UserStateSnapshot {
  goal: 'cut' | 'bulk' | 'maintain';
  deficitWeeks: number;
  weightTrend: 'down_fast' | 'down' | 'flat' | 'up' | 'unknown';
  e1rmTrend: 'up' | 'holding' | 'down' | 'insufficient_data';
  weeklySetsByMuscle: Record<string, number>;
  proteinPerKg7d: number | null;
  numbersHidden: boolean;
}

export interface AdviceItem {
  claimId: string;
  trigger: 'rule' | 'query' | 'data-earned';
  /** Calibrated-language rendering, grade-derived. Never free text. */
  headline: string;
  snapshot: UserStateSnapshot;
}

import { z } from 'zod';
import type { JsonLogicRule } from './types.ts';

const ROOT_PREDICATE_VARIABLES = new Set([
  'goal',
  'deficitWeeks',
  'weightTrend',
  'e1rmTrend',
  'proteinPerKg7d',
  'numbersHidden',
  'muscleSets',
]);
const MUSCLE_SET_VARIABLES = new Set(['muscle', 'sets']);
const COMPARISON_OPERATORS = new Set(['==', '!=', '<', '<=', '>', '>=']);

type PredicateScope = 'root' | 'some';

function operatorArguments(operator: string, value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`predicate operator "${operator}" expects an array of arguments`);
  }
  return value;
}

function requireArity(operator: string, args: unknown[], expected: number): void {
  if (args.length !== expected) {
    throw new Error(`predicate operator "${operator}" expects ${expected} arguments, received ${args.length}`);
  }
}

function referencesVariable(value: unknown, variable: string): boolean {
  if (Array.isArray(value)) return value.some((item) => referencesVariable(item, variable));
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.var === variable) return true;
  return Object.values(record).some((item) => referencesVariable(item, variable));
}

function isProteinNullGuard(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const args = (value as Record<string, unknown>)['!='];
  if (!Array.isArray(args) || args.length !== 2) return false;
  const isProteinVariable = (operand: unknown): boolean => (
    typeof operand === 'object'
    && operand !== null
    && !Array.isArray(operand)
    && Object.keys(operand).length === 1
    && (operand as Record<string, unknown>).var === 'proteinPerKg7d'
  );
  return (args[0] === null && isProteinVariable(args[1]))
    || (args[1] === null && isProteinVariable(args[0]));
}

function validateValue(value: unknown, scope: PredicateScope, proteinGuarded = false): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('predicate numbers must be finite numeric literals');
    return;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (Array.isArray(value)) {
    for (const item of value) validateValue(item, scope, proteinGuarded);
    return;
  }
  if (typeof value !== 'object') throw new Error('predicate values must be literals, arrays, or rules');

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length !== 1) throw new Error('each predicate rule must contain exactly one operator');
  const [operator, operand] = entries[0];

  if (operator === 'var') {
    if (typeof operand !== 'string') {
      throw new Error('predicate operator "var" expects exactly one variable name');
    }
    const allowed = scope === 'root' ? ROOT_PREDICATE_VARIABLES : MUSCLE_SET_VARIABLES;
    if (!allowed.has(operand)) {
      const location = scope === 'root' ? 'outside some scope' : 'inside some scope';
      throw new Error(`unknown predicate variable "${operand}" ${location}`);
    }
    return;
  }

  if (operator === 'and' || operator === 'or') {
    const args = operatorArguments(operator, operand);
    if (args.length < 2) {
      throw new Error(`predicate operator "${operator}" expects at least 2 arguments, received ${args.length}`);
    }
    let guarded = proteinGuarded;
    for (const arg of args) {
      validateValue(arg, scope, guarded);
      if (operator === 'and' && isProteinNullGuard(arg)) guarded = true;
    }
    return;
  }

  if (operator === '!') {
    const args = operatorArguments(operator, operand);
    requireArity(operator, args, 1);
    validateValue(args[0], scope, proteinGuarded);
    return;
  }

  if (COMPARISON_OPERATORS.has(operator)) {
    const args = operatorArguments(operator, operand);
    requireArity(operator, args, 2);
    if (
      ['<', '<=', '>', '>='].includes(operator)
      && referencesVariable(args, 'proteinPerKg7d')
      && !proteinGuarded
    ) {
      throw new Error('proteinPerKg7d ordered comparisons require a preceding != null guard in the same and');
    }
    for (const arg of args) validateValue(arg, scope, proteinGuarded);
    return;
  }

  if (operator === 'some') {
    const args = operatorArguments(operator, operand);
    requireArity(operator, args, 2);
    const collection = args[0];
    if (
      typeof collection !== 'object'
      || collection === null
      || Array.isArray(collection)
      || Object.keys(collection).length !== 1
      || (collection as Record<string, unknown>).var !== 'muscleSets'
    ) {
      throw new Error('predicate operator "some" expects muscleSets as its collection');
    }
    if (scope !== 'root') throw new Error('predicate operator "some" cannot be nested inside some scope');
    validateValue(args[1], 'some');
    return;
  }

  throw new Error(`unknown predicate operator "${operator}"`);
}

/** Reject authoring mistakes before JSON Logic can silently turn them into no match. */
export function validatePredicate(rule: unknown): asserts rule is JsonLogicRule {
  if (typeof rule !== 'object' || rule === null || Array.isArray(rule)) {
    throw new Error('predicate must be a rule object');
  }
  validateValue(rule, 'root');
}

const doi = z.string().regex(/^10\.\d{4,9}\/\S+$/, 'must be a bare DOI, e.g. 10.1080/02640414.2016.1210197');
// regex only checks shape (2026-13-45 would pass); FR-CLAIM-4 needs a date a human
// actually reviewed against, so round-trip through Date.UTC to catch calendar nonsense
// (month 13, Feb 30, non-leap Feb 29) — it already knows how many days are in each month.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date, YYYY-MM-DD').refine((s) => {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}, 'must be a real calendar date');

const figureSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1).optional(),
});

const citationSchema = z.object({
  id: z.string().min(1),
  claimId: z.string().min(1),
  doi,
  authors: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  journal: z.string().min(1),
  // null is legitimate and load-bearing: it means "not stated in a source we read".
  // Leaving it null is honest; filling it from a secondary source's description is not.
  n: z.number().int().positive().nullable(),
  population: z.enum(['trained', 'untrained', 'mixed', 'unstated']),
  effectSize: z.string().min(1).nullable(),
  ci: z.string().min(1).nullable(),
  figures: z.array(figureSchema),
  quote: z.string().min(1).nullable(),
});

const predicateSchema = z.record(z.string(), z.unknown()).superRefine((rule, ctx) => {
  try {
    validatePredicate(rule);
  } catch (error) {
    ctx.addIssue({ code: 'custom', message: (error as Error).message });
  }
});

export const claimSchema = z
  .object({
    id: z.string().regex(/^c-[a-z0-9-]+$/),
    statement: z.string().min(1),
    // The curated short form the advice peek renders. It exists so a small
    // surface shows a COMPLETE sentence rather than an ellipsis through a claim
    // — truncating a claim cuts the qualifier, which is exactly how a [C] ends
    // up read as a certainty. Capped so it cannot quietly become a second
    // full-length statement that drifts from the real one.
    peekStatement: z.string().min(1).max(100),
    grade: z.enum(['A', 'B', 'C', 'D']),
    status: z.enum(['settled', 'contested']),
    domain: z.string().min(1),
    predicates: predicateSchema.nullable(),
    trigger: z.enum(['rule', 'data-earned']).nullable(),
    clusterId: z.string().min(1).nullable(),
    phrasingKey: z.string().min(1),
    supersededBy: z.string().min(1).nullable(),
    lastReviewed: isoDate,
    // FR-ADV-1: a claim with no citation is not a claim.
    citations: z.array(citationSchema).min(1),
  })
  // FR-ADV-6: a contested claim must name the cluster it argues within, or the UI
  // has no way to find the other side and would render one-sided nuance.
  .refine((c) => c.status !== 'contested' || c.clusterId !== null, {
    message: 'a contested claim must have a clusterId so the opposing side can be found',
    path: ['clusterId'],
  })
  .refine((c) => c.citations.every((cit) => cit.claimId === c.id), {
    message: 'every citation must carry its parent claim id',
    path: ['citations'],
  })
  .refine((c) => (c.predicates === null) === (c.trigger === null), {
    message: 'trigger must be null exactly when predicates is null',
    path: ['trigger'],
  });

export const claimsFileSchema = z.array(claimSchema);

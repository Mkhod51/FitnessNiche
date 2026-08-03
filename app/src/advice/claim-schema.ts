import { z } from 'zod';

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
    predicates: z.record(z.string(), z.unknown()).nullable(),
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
  });

export const claimsFileSchema = z.array(claimSchema);

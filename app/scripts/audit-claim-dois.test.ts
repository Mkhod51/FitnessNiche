import { describe, expect, it } from 'vitest';
import { auditClaimDois } from './audit-claim-dois';

describe('auditClaimDois', () => {
  it('reports each unique DOI once and preserves a failed resolution', async () => {
    const failingFetcher: typeof fetch = async () => new Response(null, {
      status: 404,
      statusText: 'not found',
    });

    const result = await auditClaimDois([{ doi: '10.1/a' }, { doi: '10.1/a' }], failingFetcher);

    expect(result).toEqual([{ doi: '10.1/a', resolved: false, reason: 'not found' }]);
  });

  it('reports a Crossref resolution with the DOI it checked', async () => {
    const requested: string[] = [];
    const successfulFetcher: typeof fetch = async (input) => {
      requested.push(String(input));
      return new Response(JSON.stringify({ message: { DOI: '10.1/a' } }), { status: 200 });
    };

    const result = await auditClaimDois([{ doi: '10.1/a' }], successfulFetcher);

    expect(requested).toEqual(['https://api.crossref.org/works/10.1%2Fa']);
    expect(result).toEqual([{ doi: '10.1/a', resolved: true }]);
  });

  it('surfaces a Crossref availability failure so the manual command exits non-zero', async () => {
    const unavailableFetcher: typeof fetch = async () => new Response(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(auditClaimDois([{ doi: '10.1/a' }], unavailableFetcher))
      .rejects.toThrow('Crossref unavailable: 503 Service Unavailable');
  });
});

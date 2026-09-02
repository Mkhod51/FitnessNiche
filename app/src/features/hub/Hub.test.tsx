import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_SNAPSHOT } from '../../advice/engine';
import type { BuiltSnapshot } from '../../advice/snapshot';
import { loadAdviceSnapshot } from '../../advice/load-snapshot';
import { getWeightHistory } from '../../db/weights';
import {
  recordAdviceShown,
  recentlyShownClaimIds,
  suppressedClaimIds,
} from '../../db/advice-events';
import { Hub } from './Hub';

const { TEST_HUB_CLAIM_ID } = vi.hoisted(() => ({
  TEST_HUB_CLAIM_ID: 'test-hub-route-context',
}));

vi.mock('../../generated/claims', async () => {
  const actual = await vi.importActual<typeof import('../../generated/claims')>(
    '../../generated/claims',
  );
  const source = actual.CLAIMS.find((claim) => claim.id === 'c-rest-at-least-60-seconds');
  if (!source) throw new Error('expected source claim fixture');
  return {
    CLAIMS: [
      ...actual.CLAIMS.filter((claim) => claim.surfaceContexts === null),
      {
        ...source,
        id: TEST_HUB_CLAIM_ID,
        phrasingKey: TEST_HUB_CLAIM_ID,
        surfaceContexts: [{ surface: 'hub-empty' }],
        citations: source.citations.map((citation, index) => ({
          ...citation,
          id: `${TEST_HUB_CLAIM_ID}-citation-${index}`,
          claimId: TEST_HUB_CLAIM_ID,
        })),
      },
    ],
  };
});

vi.mock('../../advice/load-snapshot', () => ({ loadAdviceSnapshot: vi.fn() }));
vi.mock('../../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../../db/weights')>('../../db/weights');
  return { ...actual, getWeightHistory: vi.fn() };
});
vi.mock('../../db/advice-events', () => ({
  recordAdviceShown: vi.fn(),
  recentlyShownClaimIds: vi.fn(),
  suppressedClaimIds: vi.fn(),
}));
vi.mock('../advice/AskEvidence', () => ({ AskEvidence: () => null }));

const emptyBuiltSnapshot: BuiltSnapshot = {
  hasAnyLoggedData: false,
  snapshot: EMPTY_SNAPSHOT,
  primaryExerciseId: null,
  latestWeightKg: null,
  reconciliation: {
    verdict: 'unresolved',
    confidence: 'low',
    weightTrend: 'unknown',
    e1rmTrend: 'insufficient_data',
    deficitWeeks: 0,
    unresolved: ['weight', 'strength'],
    observed: {
      weightKgPerWeek: null,
      e1rmPctPerWeek: null,
      e1rmCi95: null,
      e1rmWithinNoise: null,
      windowDays: 0,
      weighIns: 0,
      e1rmSessions: 0,
    },
  },
};

describe('Hub empty evidence lane', () => {
  beforeEach(() => {
    vi.mocked(loadAdviceSnapshot).mockReset().mockResolvedValue(emptyBuiltSnapshot);
    vi.mocked(getWeightHistory).mockReset().mockResolvedValue([]);
    vi.mocked(recentlyShownClaimIds).mockReset().mockResolvedValue([]);
    vi.mocked(suppressedClaimIds).mockReset().mockResolvedValue([]);
    vi.mocked(recordAdviceShown).mockReset().mockResolvedValue({} as never);
  });

  it('reaches the cited General evidence lane through the Hub without personal framing', async () => {
    render(
      <MemoryRouter>
        <Hub />
      </MemoryRouter>,
    );

    const lane = await screen.findByRole('region', { name: 'General evidence' });
    expect(within(lane).getByTestId('claim-card')).toHaveAttribute(
      'data-claim-id',
      TEST_HUB_CLAIM_ID,
    );
    expect(within(lane).getByText('General evidence')).toBeVisible();
    expect(lane).not.toHaveTextContent(/for you/i);
  });
});

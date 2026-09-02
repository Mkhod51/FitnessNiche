import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AdviceFeed } from './AdviceFeed';
import { CLAIMS } from '../../generated/claims';
import { EMPTY_SNAPSHOT } from '../../advice/engine';
import { loadAdviceSnapshot } from '../../advice/load-snapshot';
import type { BuiltSnapshot } from '../../advice/snapshot';
import {
  recordAdviceShown,
  recentlyShownClaimIds,
  suppressClaim,
  suppressedClaimIds,
} from '../../db/advice-events';

const { TEST_HUB_CLAIM_ID } = vi.hoisted(() => ({
  TEST_HUB_CLAIM_ID: 'test-hub-empty-context',
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
vi.mock('../../db/advice-events', () => ({
  recordAdviceShown: vi.fn(),
  recentlyShownClaimIds: vi.fn(),
  suppressClaim: vi.fn(),
  suppressedClaimIds: vi.fn(),
}));

const mockLoadAdviceSnapshot = vi.mocked(loadAdviceSnapshot);
const mockRecentlyShownClaimIds = vi.mocked(recentlyShownClaimIds);
const mockSuppressedClaimIds = vi.mocked(suppressedClaimIds);
const mockRecordAdviceShown = vi.mocked(recordAdviceShown);
const mockSuppressClaim = vi.mocked(suppressClaim);

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

const strengthHoldingSnapshot: BuiltSnapshot = {
  ...emptyBuiltSnapshot,
  primaryExerciseId: 'barbell-bench-press',
  latestWeightKg: 78,
  snapshot: {
    ...EMPTY_SNAPSHOT,
    goal: 'cut',
    deficitWeeks: 8,
    weightTrend: 'down',
    e1rmTrend: 'holding',
  },
  reconciliation: {
    ...emptyBuiltSnapshot.reconciliation,
    verdict: 'on_track',
    confidence: 'high',
    weightTrend: 'down',
    e1rmTrend: 'holding',
    deficitWeeks: 8,
    unresolved: [],
    observed: {
      weightKgPerWeek: -0.35,
      e1rmPctPerWeek: 0.05,
      e1rmCi95: [-0.2, 0.3],
      e1rmWithinNoise: true,
      windowDays: 56,
      weighIns: 20,
      e1rmSessions: 16,
    },
  },
};

const lowVolumeSnapshot: BuiltSnapshot = {
  ...emptyBuiltSnapshot,
  snapshot: {
    ...EMPTY_SNAPSHOT,
    weeklySetsByMuscle: { chest: 8 },
  },
};

describe('AdviceFeed', () => {
  beforeEach(() => {
    mockLoadAdviceSnapshot.mockReset().mockResolvedValue(emptyBuiltSnapshot);
    mockRecentlyShownClaimIds.mockReset().mockResolvedValue([]);
    mockSuppressedClaimIds.mockReset().mockResolvedValue([]);
    mockRecordAdviceShown.mockReset().mockResolvedValue({} as never);
    mockSuppressClaim.mockReset().mockResolvedValue();
  });

  it('carries a non-empty data-claim-id on every element that represents a claim', () => {
    const { container } = render(<AdviceFeed />);
    const idEls = [...container.querySelectorAll('[data-claim-id]')];
    expect(idEls.length).toBeGreaterThan(0);
    for (const el of idEls) {
      expect(el.getAttribute('data-claim-id')).toBeTruthy();
    }
  });

  it('shows the whole evidence base — every claim in CLAIMS is represented exactly once', () => {
    // The browse surface shows all 17 claims at M1. A contested pair collapses
    // into one ClaimCard (FR-ADV-6), so this counts distinct claim ids rather
    // than top-level card elements — a cluster's card carries its own root id
    // plus one id per side, and every member must still show up somewhere.
    const { container } = render(<AdviceFeed />);
    const ids = new Set(
      [...container.querySelectorAll('[data-claim-id]')].map((el) => el.getAttribute('data-claim-id'))
    );
    expect(ids.size).toBe(CLAIMS.length);
  });

  it('never renders a contested cluster member as a second, competing standalone card', () => {
    const { container } = render(<AdviceFeed />);
    const clusterIds = new Set(CLAIMS.filter((c) => c.clusterId).map((c) => c.clusterId as string));
    for (const clusterId of clusterIds) {
      const members = CLAIMS.filter((c) => c.clusterId === clusterId);
      // Every member of the cluster must appear inside a single shared card,
      // never as its own top-level `claim-card` alongside the cluster card.
      const topLevelCards = [...container.querySelectorAll('[data-testid="claim-card"]')];
      const cardsContainingAMember = topLevelCards.filter((card) =>
        members.some((m) => card.querySelector(`[data-claim-id="${m.id}"]`))
      );
      expect(cardsContainingAMember).toHaveLength(1);
    }
  });

  it("states plainly that nothing here is earned by the user's own data yet", async () => {
    render(<AdviceFeed />);
    const empty = await screen.findByTestId('no-user-data');
    expect(empty).toBeVisible();
    expect(empty).toHaveTextContent(/nothing here/i);
  });

  it('shows one cited, labelled general-evidence claim on a truly empty Hub', async () => {
    render(<AdviceFeed />);

    const lane = await screen.findByRole('region', { name: 'General evidence' });
    expect(within(lane).getByText('General evidence')).toBeVisible();
    expect(within(lane).getByTestId('claim-card')).toHaveAttribute(
      'data-claim-id',
      TEST_HUB_CLAIM_ID,
    );
    expect(within(lane).getByTestId('claim-source')).toBeVisible();
    expect(lane).not.toHaveTextContent(/for you/i);

    await waitFor(() => expect(mockRecordAdviceShown).toHaveBeenCalledWith(
      TEST_HUB_CLAIM_ID,
      'surface-context',
      null,
      'hub-empty',
    ));
    expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1);
  });

  it('lets the reader permanently silence an empty-Hub general-evidence claim', async () => {
    render(<AdviceFeed />);

    const lane = await screen.findByRole('region', { name: 'General evidence' });
    fireEvent.click(within(lane).getByRole('button', { name: /don.t show this again/i }));

    await waitFor(() => expect(mockSuppressClaim).toHaveBeenCalledWith(TEST_HUB_CLAIM_ID));
    expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
  });

  it.each(['one meal', 'one weigh-in', 'one set'])(
    'does not surface empty-Hub evidence after %s',
    async () => {
      mockLoadAdviceSnapshot.mockResolvedValue({
        ...emptyBuiltSnapshot,
        hasAnyLoggedData: true,
      });

      render(<AdviceFeed />);

      await screen.findByTestId('no-user-data');
      expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
      expect(mockRecordAdviceShown).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['suppressed', mockSuppressedClaimIds],
    ['inside its cooldown', mockRecentlyShownClaimIds],
  ])('keeps an empty-Hub claim quiet when it is %s', async (_state, blockedIds) => {
    blockedIds.mockResolvedValue([TEST_HUB_CLAIM_ID]);

    render(<AdviceFeed />);

    await screen.findByTestId('no-user-data');
    expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
    expect(mockRecordAdviceShown).not.toHaveBeenCalled();
  });

  it('renders the matching data-earned claim from the loaded snapshot', async () => {
    mockLoadAdviceSnapshot.mockResolvedValue(strengthHoldingSnapshot);

    const { container } = render(<AdviceFeed />);

    const forYou = container.querySelector('[aria-label="for you"]');
    expect(await screen.findByText(/strength appears to hold up better/i)).toBeInTheDocument();
    expect(forYou?.querySelector('[data-claim-id="c-strength-holds-through-a-deficit"]')).not.toBeNull();
    expect(screen.queryByTestId('no-user-data')).not.toBeInTheDocument();
  });

  it('does not expose intake or bodyweight-triggered claims when numbers are hidden', async () => {
    mockLoadAdviceSnapshot.mockResolvedValue({
      ...strengthHoldingSnapshot,
      snapshot: { ...strengthHoldingSnapshot.snapshot, numbersHidden: true },
    });

    const { container } = render(<AdviceFeed />);

    await screen.findByTestId('no-user-data');
    const forYou = container.querySelector('[aria-label="for you"]');
    expect(forYou?.querySelector('[data-claim-id="c-strength-holds-through-a-deficit"]')).toBeNull();
  });

  it.each([
    ['suppressed', mockSuppressedClaimIds],
    ['inside its cooldown', mockRecentlyShownClaimIds],
  ])('does not render a personalised Hub claim when it is %s', async (_state, blockedIds) => {
    mockLoadAdviceSnapshot.mockResolvedValue(lowVolumeSnapshot);
    blockedIds.mockResolvedValue(['c-volume-dose-response']);

    const { container } = render(<AdviceFeed />);

    await screen.findByTestId('no-user-data');
    const forYou = container.querySelector('[aria-label="for you"]');
    expect(forYou?.querySelector('[data-claim-id="c-volume-dose-response"]')).toBeNull();
  });

  it('renders no personalised advice when the consent-aware loader declines a snapshot', async () => {
    mockLoadAdviceSnapshot.mockResolvedValue(null);

    const { container } = render(<AdviceFeed />);

    expect(container.querySelector('[aria-label="for you"] [data-claim-id]')).toBeNull();
    expect(await screen.findByText(/more weekly sets per muscle/i)).toBeInTheDocument();
    expect(container.querySelector('[aria-label="for you"] [data-claim-id]')).toBeNull();
  });

  it('invents no number about the user — no data-testid begins with "user-"', () => {
    const { container } = render(<AdviceFeed />);
    const userEls = [...container.querySelectorAll('[data-testid]')].filter((el) =>
      (el.getAttribute('data-testid') ?? '').startsWith('user-')
    );
    expect(userEls).toHaveLength(0);
  });
});

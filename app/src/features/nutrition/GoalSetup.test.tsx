import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalSetup } from './GoalSetup';
import { getUser, updateProfile, setCalorieTarget, type User } from '../../db/user';
import { getWeightHistory } from '../../db/weights';
import { MAX_DAILY_DEFICIT_KCAL } from '../../domain/guards';
import {
  recordAdviceShown,
  recentlyShownClaimIds,
  suppressClaim,
  suppressedClaimIds,
} from '../../db/advice-events';

const { TEST_GOAL_CLAIM_ID } = vi.hoisted(() => ({
  TEST_GOAL_CLAIM_ID: 'test-bulk-goal-context',
}));

vi.mock('../../generated/claims', async () => {
  const actual = await vi.importActual<typeof import('../../generated/claims')>(
    '../../generated/claims',
  );
  const source = actual.CLAIMS.find((claim) => claim.id === 'c-rest-at-least-60-seconds');
  if (!source) throw new Error('expected source claim fixture');
  return {
    // These tests own a deterministic synthetic goal-draft fixture, so strip any
    // real curated goal-draft claims out of the imported set: a second live bulk
    // claim would tie with the synthetic and make the selector fail closed. The
    // shipped curation is pinned separately in surface-advice.test.ts.
    CLAIMS: [
      ...actual.CLAIMS.filter(
        (claim) => !claim.surfaceContexts?.some((context) => context.surface === 'goal-draft'),
      ),
      {
        ...source,
        id: TEST_GOAL_CLAIM_ID,
        phrasingKey: TEST_GOAL_CLAIM_ID,
        surfaceContexts: [{ surface: 'goal-draft', goals: ['bulk'] }],
        citations: source.citations.map((citation, index) => ({
          ...citation,
          id: `${TEST_GOAL_CLAIM_ID}-citation-${index}`,
          claimId: TEST_GOAL_CLAIM_ID,
        })),
      },
    ],
  };
});

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn(), updateProfile: vi.fn(), setCalorieTarget: vi.fn() };
});
vi.mock('../../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../../db/weights')>('../../db/weights');
  return { ...actual, getWeightHistory: vi.fn() };
});
vi.mock('../../db/advice-events', () => ({
  recordAdviceShown: vi.fn(),
  recentlyShownClaimIds: vi.fn(),
  suppressClaim: vi.fn(),
  suppressedClaimIds: vi.fn(),
}));

const mockGetUser = vi.mocked(getUser);
const mockUpdateProfile = vi.mocked(updateProfile);
const mockSetTarget = vi.mocked(setCalorieTarget);
const mockWeights = vi.mocked(getWeightHistory);
const mockRecordAdviceShown = vi.mocked(recordAdviceShown);
const mockRecentlyShownClaimIds = vi.mocked(recentlyShownClaimIds);
const mockSuppressedClaimIds = vi.mocked(suppressedClaimIds);
const mockSuppressClaim = vi.mocked(suppressClaim);

const user: User = {
  id: 'local-user', goal: 'maintain', sex: 'male', heightCm: 178, numbersHidden: false,
  calorieTargetKcal: null, proteinTargetG: null, deficitKcal: 0, birthYear: 1999,
  goalStartedAt: null,
  trainingExperience: null,
  consentedAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(user);
  mockUpdateProfile.mockResolvedValue(user);
  mockSetTarget.mockResolvedValue(user);
  mockWeights.mockResolvedValue([
    { id: 'w', userId: 'local-user', valueKg: 78, measuredAt: '2026-07-27T07:00:00.000Z',
      updatedAt: '2026-07-27T07:00:00.000Z', deletedAt: null },
  ] as never);
  mockRecordAdviceShown.mockResolvedValue({} as never);
  mockRecentlyShownClaimIds.mockResolvedValue([]);
  mockSuppressedClaimIds.mockResolvedValue([]);
  mockSuppressClaim.mockResolvedValue();
});

function renderGoalSetup() {
  return render(
    <MemoryRouter>
      <GoalSetup />
    </MemoryRouter>,
  );
}

describe('GoalSetup — the estimate is told honestly', () => {
  it('offers a back button that returns to the previous screen', async () => {
    render(
      <MemoryRouter initialEntries={['/eat', '/goal']} initialIndex={1}>
        <Routes>
          <Route path="/goal" element={<GoalSetup />} />
          <Route path="/eat" element={<p>Eat screen</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /back/i }));

    expect(screen.getByText('Eat screen')).toBeInTheDocument();
  });

  it('returns to Settings when the goal screen was opened from Settings', async () => {
    render(
      <MemoryRouter initialEntries={['/settings', '/goal']} initialIndex={1}>
        <Routes>
          <Route path="/goal" element={<GoalSetup />} />
          <Route path="/settings" element={<p>Settings screen</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /back/i }));

    expect(screen.getByText('Settings screen')).toBeInTheDocument();
  });

  it('never shows the point without the band beside it', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());
    const band = screen.getByTestId('maintenance-band');
    expect(band).toHaveTextContent(/plausibly/i);
    expect(band.textContent).toMatch(/\d{1,2},?\d{3}\s*[–-]\s*\d{1,2},?\d{3}/);
  });

  it('says the estimate is a starting point the data replaces', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByText(/starting point, and the app will replace it/i)).toBeInTheDocument());
  });

  it('refuses to estimate from a partial answer rather than guessing', async () => {
    mockGetUser.mockResolvedValue({ ...user, birthYear: null, heightCm: null });
    mockWeights.mockResolvedValue([]);
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('estimate-missing')).toBeInTheDocument());
    expect(screen.queryByTestId('maintenance-estimate')).not.toBeInTheDocument();
  });

  it('defaults the goal to maintenance and says nothing pushes you off it', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('goal-maintain')).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByText(/maintenance is the default/i)).toBeInTheDocument();
  });

  it('offers optional training experience choices with an explicit skip state', async () => {
    renderGoalSetup();

    expect(await screen.findByTestId('experience-skip')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('experience-new')).toBeInTheDocument();
    expect(screen.getByTestId('experience-returning')).toBeInTheDocument();
    expect(screen.getByTestId('experience-experienced')).toBeInTheDocument();
    expect(screen.getByText(/training experience \(optional\)/i)).toBeInTheDocument();
  });

  it('allows clearing training experience and saving without a choice', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('experience-experienced'));
    expect(screen.getByTestId('experience-experienced')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('experience-skip'));
    fireEvent.click(screen.getByTestId('save-goal-button'));

    expect(await screen.findByTestId('goal-saved')).toBeVisible();
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ trainingExperience: null }),
    );
  });
});

describe('GoalSetup — authored general evidence for the unsaved goal', () => {
  it('renders one cited bulk-context claim before the draft goal is saved', async () => {
    renderGoalSetup();
    await screen.findByTestId('maintenance-estimate');

    fireEvent.click(screen.getByTestId('goal-bulk'));

    const lane = await screen.findByRole('region', { name: 'General evidence' });
    expect(within(lane).getByText('General evidence')).toBeVisible();
    expect(within(lane).getByTestId('claim-card')).toHaveAttribute(
      'data-claim-id',
      TEST_GOAL_CLAIM_ID,
    );
    expect(within(lane).getByTestId('claim-source')).toBeVisible();
    expect(lane).not.toHaveTextContent(/for you/i);
    expect(screen.queryByTestId('goal-saved')).not.toBeInTheDocument();

    await waitFor(() => expect(mockRecordAdviceShown).toHaveBeenCalledWith(
      TEST_GOAL_CLAIM_ID,
      'surface-context',
      null,
      'goal-draft',
    ));
  });

  it('lets the reader permanently silence a draft-goal general-evidence claim', async () => {
    renderGoalSetup();
    await screen.findByTestId('maintenance-estimate');
    fireEvent.click(screen.getByTestId('goal-bulk'));

    const lane = await screen.findByRole('region', { name: 'General evidence' });
    fireEvent.click(within(lane).getByRole('button', { name: /don.t show this again/i }));

    await waitFor(() => expect(mockSuppressClaim).toHaveBeenCalledWith(TEST_GOAL_CLAIM_ID));
    expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
  });

  it('keeps an unrelated authored goal context silent and avoids duplicate event writes', async () => {
    renderGoalSetup();
    await screen.findByTestId('maintenance-estimate');

    expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('goal-bulk'));
    await screen.findByRole('region', { name: 'General evidence' });
    fireEvent.click(screen.getByTestId('goal-maintain'));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('goal-bulk'));
    await waitFor(() => expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1));
  });

  it('keeps the displayed claim while the estimate becomes available without recording twice', async () => {
    mockGetUser.mockResolvedValue({ ...user, birthYear: null, heightCm: null });
    mockWeights.mockResolvedValue([]);
    renderGoalSetup();
    await screen.findByTestId('estimate-missing');

    fireEvent.click(screen.getByTestId('goal-bulk'));
    await screen.findByRole('region', { name: 'General evidence' });
    fireEvent.change(screen.getByTestId('height-input'), { target: { value: '178' } });
    fireEvent.change(screen.getByTestId('birth-year-input'), { target: { value: '1999' } });
    fireEvent.change(screen.getByTestId('weight-input'), { target: { value: '78' } });

    await screen.findByTestId('maintenance-estimate');
    expect(screen.getByRole('region', { name: 'General evidence' })).toBeVisible();
    await waitFor(() => expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['suppressed', mockSuppressedClaimIds],
    ['inside its cooldown', mockRecentlyShownClaimIds],
  ])('keeps a draft-goal claim quiet when it is %s', async (_state, blockedIds) => {
    blockedIds.mockResolvedValue([TEST_GOAL_CLAIM_ID]);
    renderGoalSetup();
    await screen.findByTestId('maintenance-estimate');

    fireEvent.click(screen.getByTestId('goal-bulk'));

    await waitFor(() => expect(blockedIds).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'General evidence' })).not.toBeInTheDocument();
    expect(mockRecordAdviceShown).not.toHaveBeenCalled();
  });
});

describe('GoalSetup — GR-1 in the control, not in a warning', () => {
  it('caps the deficit slider so it stops rather than clamping back afterwards', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('goal-cut'));

    const slider = await screen.findByTestId('deficit-slider');
    expect(Number(slider.getAttribute('max'))).toBeLessThanOrEqual(MAX_DAILY_DEFICIT_KCAL);
    expect(screen.getByText(/control stops here/i)).toBeInTheDocument();
    expect(screen.getByText(/not a warning you can push past/i)).toBeInTheDocument();
  });

  // D-G3.4: the cap does not assert itself, it renders its own evidence through
  // the same component as any other claim, at its own grade.
  it('renders the deficit cap as a real cited claim, bound to a claim id', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('goal-cut'));

    const card = await screen.findByTestId('claim-card');
    expect(card).toHaveAttribute('data-claim-id', 'c-deficit-beyond-500-blocks-lean-mass');
  });

  // GR-4: the claim's own record calls it population-level, so the copy must not
  // present it as a number worked out for this person.
  it('says the threshold is population-level, not calculated for you', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('goal-cut'));
    expect(await screen.findByText(/not a number\s+calculated for you/i)).toBeInTheDocument();
  });

  it('saves the clamped target rather than whatever was asked for', async () => {
    renderGoalSetup();
    await waitFor(() => expect(screen.getByTestId('maintenance-estimate')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('save-goal-button'));

    await waitFor(() => expect(mockSetTarget).toHaveBeenCalledTimes(1));
    const arg = mockSetTarget.mock.calls[0][0];
    // Maintenance goal: target is the estimate, protein follows 1.6 g/kg on 78 kg.
    expect(arg.deficitKcal).toBe(0);
    expect(arg.proteinTargetG).toBe(125);
    expect(arg.calorieTargetKcal).toBeGreaterThan(0);
  });
});

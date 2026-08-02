import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentGate } from './ConsentGate';
import { getUser, recordConsent, type User } from '../../db/user';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn(), recordConsent: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockRecordConsent = vi.mocked(recordConsent);

const baseUser: User = {
  id: 'local-user',
  goal: 'maintain',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: false,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  birthYear: null,
  goalStartedAt: null,
  trainingExperience: null,
  consentedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ConsentGate', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockRecordConsent.mockReset();
  });

  it('does not render the wrapped logging surface until consentedAt is set', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: null });
    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );
    await screen.findByTestId('consent-accept');
    expect(screen.queryByTestId('protected-logging-ui')).not.toBeInTheDocument();
  });

  it('renders the wrapped content immediately when the user already consented', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: '2026-07-01T00:00:00.000Z' });
    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );
    await screen.findByTestId('protected-logging-ui');
    expect(screen.queryByTestId('consent-accept')).not.toBeInTheDocument();
  });

  it('is a deliberate action — never a pre-ticked box — content only appears after an explicit accept click calls recordConsent()', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: null });
    mockRecordConsent.mockResolvedValue({ ...baseUser, consentedAt: '2026-07-25T14:00:00.000Z' });

    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );

    // A pre-ticked checkbox is exactly the dark pattern being avoided — there
    // must be no checkbox at all, just an explicit action.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    const acceptButton = await screen.findByTestId('consent-accept');
    expect(screen.queryByTestId('protected-logging-ui')).not.toBeInTheDocument();
    expect(mockRecordConsent).not.toHaveBeenCalled();

    fireEvent.click(acceptButton);

    await screen.findByTestId('protected-logging-ui');
    expect(mockRecordConsent).toHaveBeenCalledTimes(1);
  });

  it('no dark patterns: decline is exactly as prominent as accept — same element type, same size, never disabled or de-emphasized', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: null });
    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );

    const accept = await screen.findByTestId('consent-accept');
    const decline = screen.getByTestId('consent-decline');

    expect(accept.tagName).toBe('BUTTON');
    expect(decline.tagName).toBe('BUTTON');
    expect(accept).not.toBeDisabled();
    expect(decline).not.toBeDisabled();

    // Same sizing/weight classes on both — differentiated by fill, not by
    // making one smaller, greyed out, or a de-emphasized "skip" link.
    for (const sharedClass of ['min-h-[44px]', 'flex-1', 'text-[13px]', 'font-semibold']) {
      expect(accept.className, sharedClass).toContain(sharedClass);
      expect(decline.className, sharedClass).toContain(sharedClass);
    }
    expect(decline.className).not.toMatch(/opacity-|text-ink-faint|cursor-not-allowed|pointer-events-none/);
  });

  it('declining is a real, supported action that leaves the app usable — no dead end, no error screen, sibling content keeps working', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: null });
    mockRecordConsent.mockResolvedValue({ ...baseUser, consentedAt: '2026-07-25T14:00:00.000Z' });

    render(
      <>
        <ConsentGate>
          <div data-testid="protected-logging-ui">log a set</div>
        </ConsentGate>
        <div data-testid="evidence-feed">the evidence base, needing no consent</div>
      </>,
    );

    const decline = await screen.findByTestId('consent-decline');
    fireEvent.click(decline);

    // Still gated (declining never grants consent) but not broken, and the
    // unrelated evidence surface beside it is completely unaffected.
    expect(screen.queryByTestId('protected-logging-ui')).not.toBeInTheDocument();
    expect(screen.getByTestId('evidence-feed')).toBeVisible();
    expect(mockRecordConsent).not.toHaveBeenCalled();

    // Not a dead end: the prompt is still there, fully interactive, and the
    // user can still change their mind and accept afterwards.
    const acceptAfterDecline = screen.getByTestId('consent-accept');
    expect(acceptAfterDecline).toBeEnabled();
    fireEvent.click(acceptAfterDecline);
    await screen.findByTestId('protected-logging-ui');
    expect(mockRecordConsent).toHaveBeenCalledTimes(1);
  });

  it('consent persists across a reload — a fresh mount after recordConsent sees it and skips straight to content', async () => {
    let consentedAt: string | null = null;
    mockGetUser.mockImplementation(async () => ({ ...baseUser, consentedAt }));
    mockRecordConsent.mockImplementation(async () => {
      consentedAt = '2026-07-25T14:00:00.000Z';
      return { ...baseUser, consentedAt };
    });

    const { unmount } = render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );
    fireEvent.click(await screen.findByTestId('consent-accept'));
    await screen.findByTestId('protected-logging-ui');
    unmount();

    // "Reload": a brand-new mount reading the same underlying persisted user.
    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );
    await screen.findByTestId('protected-logging-ui');
    expect(screen.queryByTestId('consent-accept')).not.toBeInTheDocument();
  });

  it('distinguishes local logs from food searches and barcodes sent to Open Food Facts', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, consentedAt: null });
    render(
      <ConsentGate>
        <div data-testid="protected-logging-ui">log a set</div>
      </ConsentGate>,
    );
    await screen.findByTestId('consent-accept');
    const gate = screen.getByTestId('consent-gate');
    expect(gate).toHaveTextContent(/workout/i);
    expect(gate).toHaveTextContent(/bodyweight/i);
    expect(gate).toHaveTextContent(/meal/i);
    expect(gate).toHaveTextContent(/logs stay on this device unless you configure sync/i);
    expect(gate).toHaveTextContent(/food search text is sent through the food-search proxy to Open Food Facts as you type/i);
    expect(gate).toHaveTextContent(/barcodes are sent when you scan or enter one/i);
    expect(gate).toHaveTextContent(/special.category/i);
    expect(gate).toHaveTextContent(/UK GDPR|GDPR/i);
  });
});

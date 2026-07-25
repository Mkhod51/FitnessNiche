import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdviceFeed } from './AdviceFeed';
import { CLAIMS } from '../../generated/claims';

describe('AdviceFeed', () => {
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

  it("states plainly that nothing here is earned by the user's own data yet", () => {
    render(<AdviceFeed />);
    const empty = screen.getByTestId('no-user-data');
    expect(empty).toBeVisible();
    expect(empty).toHaveTextContent(/nothing here/i);
  });

  it('invents no number about the user — no data-testid begins with "user-"', () => {
    const { container } = render(<AdviceFeed />);
    const userEls = [...container.querySelectorAll('[data-testid]')].filter((el) =>
      (el.getAttribute('data-testid') ?? '').startsWith('user-')
    );
    expect(userEls).toHaveLength(0);
  });
});

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClaimCard, shortenAuthors } from './ClaimCard';
import type { Claim } from '../advice/types';

const claim: Claim = {
  id: 'c-test-volume',
  statement: 'More weekly sets produce more growth, with diminishing returns',
  grade: 'C', status: 'settled', domain: 'volume',
  predicates: null, clusterId: null, phrasingKey: 'test-volume',
  supersededBy: null, lastReviewed: '2026-07-25',
  citations: [{
    id: 'cit-1', claimId: 'c-test-volume', doi: '10.1080/02640414.2016.1210197',
    authors: 'Someone A', year: 2017, journal: 'Journal of Sports Sciences',
    n: 42, population: 'trained', effectSize: null, ci: null, figures: [], quote: null,
  }],
};

describe('ClaimCard', () => {
  it('carries the claim id on its root, which is what makes provenance checkable', () => {
    render(<ClaimCard claim={claim} />);
    expect(screen.getByTestId('claim-card')).toHaveAttribute('data-claim-id', 'c-test-volume');
  });

  it('shows the statement as the card\'s own advice line', () => {
    render(<ClaimCard claim={claim} />);
    expect(screen.getByTestId('claim-statement')).toHaveTextContent(/more weekly sets produce more growth/i);
  });

  it('shows the confidence in the default state, with no interaction', () => {
    // PRODUCT.md principle 7: nuance is the default state, not a disclosure layer.
    render(<ClaimCard claim={claim} />);
    expect(within(screen.getByTestId('claim-card')).getByTestId('confidence-ticks')).toBeVisible();
  });

  it('orders advice, then confidence, then source — the order is the argument', () => {
    // DESIGN.md fixes this order: the reader must meet the confidence before the
    // citation, because a citation alone reads as proof.
    render(<ClaimCard claim={claim} />);
    const card = screen.getByTestId('claim-card');
    const order = [...card.querySelectorAll('[data-testid]')]
      .map((n) => n.getAttribute('data-testid'))
      .filter((t) => t === 'claim-statement' || t === 'confidence-ticks' || t === 'claim-source');
    expect(order).toEqual(['claim-statement', 'confidence-ticks', 'claim-source']);
  });

  it('renders the source from the claim record', () => {
    render(<ClaimCard claim={claim} />);
    const src = screen.getByTestId('claim-source');
    expect(src).toHaveTextContent('Someone A');
    expect(src).toHaveTextContent('2017');
  });

  it('does not show study detail until it is asked for', () => {
    // The user's explicit architecture: figures and caveats are layer 3, never layer 1.
    render(<ClaimCard claim={claim} />);
    expect(screen.queryByTestId('figure-n')).toBeNull();
    expect(screen.queryByText('10.1080/02640414.2016.1210197')).toBeNull();
  });

  it('renders both sides when given a contested cluster', () => {
    const a: Claim = { ...claim, id: 'c-timing-for', status: 'contested', clusterId: 'protein-timing',
      statement: 'Peri-workout protein timing matters',
      citations: [{ ...claim.citations[0], claimId: 'c-timing-for' }] };
    const b: Claim = { ...claim, id: 'c-timing-against', status: 'contested', clusterId: 'protein-timing',
      statement: 'Total daily protein dominates timing', grade: 'A',
      citations: [{ ...claim.citations[0], claimId: 'c-timing-against' }] };
    render(<ClaimCard claim={a} cluster={[a, b]} />);
    expect(screen.getByText(/peri-workout protein timing matters/i)).toBeInTheDocument();
    expect(screen.getByText(/total daily protein dominates timing/i)).toBeInTheDocument();
    expect(screen.getByTestId('contested-marker')).toBeVisible();
  });

  it('gives every side of a contested cluster its own claim id and its own confidence', () => {
    const a: Claim = { ...claim, id: 'c-a', status: 'contested', clusterId: 'k' };
    const b: Claim = { ...claim, id: 'c-b', status: 'contested', clusterId: 'k', grade: 'A' };
    render(<ClaimCard claim={a} cluster={[a, b]} />);
    const sides = screen.getAllByTestId('claim-side');
    expect(sides.map((el) => el.getAttribute('data-claim-id')).sort()).toEqual(['c-a', 'c-b']);
    for (const side of sides) expect(within(side).getByTestId('confidence-ticks')).toBeVisible();
  });

  it('shortens a long author list instead of wrapping four lines on a phone', () => {
    const many = { ...claim, citations: [{ ...claim.citations[0],
      authors: 'Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Phillips SM' }] };
    render(<ClaimCard claim={many} />);
    const src = screen.getByTestId('claim-source');
    expect(src).toHaveTextContent('Morton RW et al.');
    expect(src).not.toHaveTextContent('Phillips SM');
  });
});

describe('shortenAuthors', () => {
  it('leaves a single author alone', () => {
    expect(shortenAuthors('Grgic J')).toBe('Grgic J');
  });

  it('collapses two or more to et al.', () => {
    expect(shortenAuthors('Murphy C, Koehler K')).toBe('Murphy C et al.');
  });

  it('returns the original when there is nothing to split', () => {
    expect(shortenAuthors('')).toBe('');
  });
});

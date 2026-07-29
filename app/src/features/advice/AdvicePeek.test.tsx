import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdvicePeek } from './AdvicePeek';
import { CLAIMS } from '../../generated/claims';

const claimA = CLAIMS.find((c) => c.id === 'c-volume-dose-response')!;
const claimC = CLAIMS.find((c) => c.id === 'c-rest-at-least-60-seconds')!;

function open(claim = claimA, why?: string) {
  const onDismiss = vi.fn();
  const onSuppress = vi.fn();
  render(<AdvicePeek claim={claim} why={why} onDismiss={onDismiss} onSuppress={onSuppress} />);
  return { onDismiss, onSuppress };
}

describe('AdvicePeek — principle 7 survives the small surface', () => {
  // The whole reason peekStatement exists. Truncating a claim cuts the
  // qualifier, and the qualifier is what stops a low grade reading as certainty.
  it('renders the curated short form, never an ellipsis through the statement', () => {
    open(claimC);
    expect(screen.getByText(claimC.peekStatement)).toBeInTheDocument();
    expect(screen.queryByText(/…|\.\.\./)).not.toBeInTheDocument();
  });

  it('shows the confidence counter and its words even collapsed', () => {
    open(claimC);
    // A [C] must announce itself as limited evidence at a glance, not on a tap.
    expect(screen.getByText(/limited evidence/i)).toBeInTheDocument();
    // The counter's accessible name IS the grade's own wording — it takes a
    // Grade and reads its words from the map, so a caller cannot supply any.
    expect(screen.getByTestId('confidence-ticks')).toHaveAttribute('aria-label', 'limited evidence');
    // Four slots always render; the FILLED count is what encodes the grade.
    expect(screen.getAllByTestId('tick')).toHaveLength(4);
    expect(screen.getAllByTestId('tick-filled')).toHaveLength(2); // C = 2 of 4
  });

  it('carries a different confidence for a different grade', () => {
    open(claimA);
    expect(screen.getByText(/well-supported/i)).toBeInTheDocument();
  });

  it('states why it fired as a fact about the user, not a recommendation', () => {
    open(claimA, 'Chest · 8.5 sets in the last 7 days');
    expect(screen.getByText(/8\.5 sets in the last 7 days/)).toBeInTheDocument();
  });
});

describe('AdvicePeek — it opens, and it can always be got rid of', () => {
  it('expands on a tap rather than requiring a drag', () => {
    open();
    expect(screen.getByTestId('advice-peek')).toHaveAttribute('data-expanded', 'false');
    fireEvent.click(screen.getByTestId('advice-expand'));
    expect(screen.getByTestId('advice-peek')).toHaveAttribute('data-expanded', 'true');
  });

  it('shows the full claim and its citation once expanded', () => {
    open();
    fireEvent.click(screen.getByTestId('advice-expand'));
    const card = screen.getByTestId('claim-card');
    expect(card).toHaveAttribute('data-claim-id', claimA.id);
    expect(card).toHaveTextContent(claimA.statement.slice(0, 40));
  });

  it('dismisses for the session from the collapsed state', () => {
    const { onDismiss } = open();
    fireEvent.click(screen.getByTestId('advice-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // Permanent suppression must be reachable without a settings trip, or the
  // only remedy left is uninstalling.
  it('offers permanent suppression once expanded', () => {
    const { onSuppress } = open();
    fireEvent.click(screen.getByTestId('advice-expand'));
    fireEvent.click(screen.getByTestId('advice-suppress'));
    expect(onSuppress).toHaveBeenCalledTimes(1);
  });
});

describe('AdvicePeek — provenance', () => {
  it('renders no sentence about the evidence that is not from the record', () => {
    open(claimC);
    const peek = screen.getByTestId('advice-peek');
    const text = peek.textContent ?? '';
    // Everything visible is the peek statement, the grade words, or the dismiss
    // glyph. Any other prose about the evidence would be authored, which T1
    // forbids.
    const accounted = [claimC.peekStatement, 'limited evidence', '×'];
    let residue = text;
    for (const part of accounted) residue = residue.replace(part, '');
    expect(residue.replace(/[\s·]/g, '')).toBe('');
  });
});

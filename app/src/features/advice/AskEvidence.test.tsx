import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AskEvidence } from './AskEvidence';

describe('AskEvidence', () => {
  it('has a real accessible label on the query input', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    expect(input.tagName).toBe('INPUT');
  });

  it('gives the input a large enough touch target and a font-size iOS will not zoom on', () => {
    // NFR-6: one hand, phone at arm's length, ≥44px target, ≥16px text so
    // focusing the field does not trigger the iOS Safari zoom-on-focus behaviour.
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    expect(input).toHaveClass('min-h-[44px]');
    expect(input).toHaveClass('text-[16px]');
  });

  it('shows nothing before the user has typed anything', () => {
    render(<AskEvidence />);
    expect(screen.queryByTestId('no-match')).toBeNull();
    expect(screen.queryByTestId('claim-card')).toBeNull();
  });

  it('renders matching claims as real ClaimCards carrying their stored claim ids', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'deloads' } });
    const cards = screen.getAllByTestId('claim-card');
    expect(cards.some((card) => card.getAttribute('data-claim-id') === 'c-deloads-not-evidence-backed')).toBe(true);
  });

  it('renders both sides of a contested cluster in one card, never as two competing cards', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'protein-timing' } });
    expect(screen.getAllByTestId('claim-card')).toHaveLength(1);
    const sides = screen.getAllByTestId('claim-side');
    expect(sides.map((el) => el.getAttribute('data-claim-id')).sort()).toEqual([
      'c-protein-timing-distribution-matters',
      'c-protein-timing-total-intake-dominates',
    ]);
    expect(screen.getByTestId('contested-marker')).toBeVisible();
  });

  it('never generates prose for a query that matches nothing — it shows the honest no-match state', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'zzzznonexistentquery' } });
    expect(screen.queryByTestId('claim-card')).toBeNull();
    expect(screen.getByTestId('no-match')).toHaveTextContent(
      /nothing in the evidence base covers that yet/i
    );
  });

  it('clears the no-match state once a real match is typed', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'zzzznonexistentquery' } });
    expect(screen.getByTestId('no-match')).toBeVisible();
    fireEvent.change(input, { target: { value: 'deloads' } });
    expect(screen.queryByTestId('no-match')).toBeNull();
    expect(screen.getAllByTestId('claim-card')[0]).toBeVisible();
  });

  it('clearing the query back to empty shows neither results nor the no-match state', () => {
    render(<AskEvidence />);
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'deloads' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByTestId('claim-card')).toBeNull();
    expect(screen.queryByTestId('no-match')).toBeNull();
  });
});

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConfidenceTicks } from './ConfidenceTicks';
import { GRADE_LANGUAGE } from '../advice/language';
import type { Grade } from '../advice/types';

const FILLED: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

describe('ConfidenceTicks', () => {
  it.each(['A', 'B', 'C', 'D'] as Grade[])('fills %s slots to match the grade', (g) => {
    render(<ConfidenceTicks grade={g} />);
    const el = screen.getByTestId('confidence-ticks');
    expect(within(el).getAllByTestId('tick')).toHaveLength(4);
    expect(within(el).getAllByTestId('tick-filled')).toHaveLength(FILLED[g]);
  });

  it.each(['A', 'B', 'C', 'D'] as Grade[])('always renders the words for %s, never the count alone', (g) => {
    // DESIGN.md: colour is redundant to the count and the label. Strip the hue and the
    // card must still read correctly, so the label is not optional.
    render(<ConfidenceTicks grade={g} />);
    expect(screen.getByTestId('confidence-ticks')).toHaveTextContent(GRADE_LANGUAGE[g].chipLabel);
  });

  it('gives assistive tech the meaning, not the geometry', () => {
    render(<ConfidenceTicks grade="C" />);
    expect(screen.getByTestId('confidence-ticks')).toHaveAccessibleName(/limited evidence/i);
  });

  it('takes a grade, not a caption — the words come from the grade map', () => {
    // Guards T1: a caller must not be able to pass its own wording in.
    render(<ConfidenceTicks grade="A" />);
    expect(screen.getByTestId('confidence-ticks')).not.toHaveTextContent(/limited evidence/i);
  });
});

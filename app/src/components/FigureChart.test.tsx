import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FigureChart } from './FigureChart';
import type { Citation } from '../advice/types';

const full: Citation = {
  id: 'cit-1', claimId: 'c-x', doi: '10.1080/02640414.2016.1210197',
  authors: 'Someone A, Another B', year: 2017, journal: 'Journal of Sports Sciences',
  n: 42, population: 'trained', effectSize: 'SMD 0.35', ci: '95% CI 0.03 to 0.67',
  figures: [{ label: 'weekly sets', value: 10, unit: 'sets' }], quote: null,
};

describe('FigureChart', () => {
  it('shows sample size as a first-class field', () => {
    render(<FigureChart citation={full} />);
    expect(screen.getByTestId('figure-n')).toHaveTextContent('42');
  });

  it('shows the population as a first-class field', () => {
    render(<FigureChart citation={full} />);
    expect(screen.getByTestId('figure-population')).toHaveTextContent(/trained/i);
  });

  it('says so plainly when sample size was not extractable', () => {
    render(<FigureChart citation={{ ...full, n: null }} />);
    expect(screen.getByTestId('figure-n')).toHaveTextContent(/not stated/i);
  });

  it('says so plainly when no confidence interval was extractable', () => {
    render(<FigureChart citation={{ ...full, ci: null }} />);
    expect(screen.getByTestId('figure-ci')).toHaveTextContent(/not (stated|extracted)/i);
  });

  it('never embeds an image — figures are re-plotted, per GR-3', () => {
    const { container } = render(<FigureChart citation={full} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders no chart at all when there are no extracted figures', () => {
    const { container } = render(<FigureChart citation={{ ...full, figures: [] }} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByTestId('figure-n')).toBeInTheDocument();
  });
});

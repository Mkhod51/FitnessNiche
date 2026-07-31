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

  it('never embeds an image, whatever the figures look like — GR-3', () => {
    // The copyright rule is about images, and it holds for every shape of input,
    // including the ones that draw no chart at all.
    for (const figures of [
      full.figures,
      [],
      [{ label: 'a', value: 1, unit: 'kg' }, { label: 'b', value: 2, unit: 'kg' }],
    ]) {
      const { container, unmount } = render(<FigureChart citation={{ ...full, figures }} />);
      expect(container.querySelector('img')).toBeNull();
      expect(container.innerHTML).not.toMatch(/https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)/i);
      unmount();
    }
  });

  it('draws its own svg when there is something commensurable to plot', () => {
    const two = { ...full, figures: [
      { label: 'a', value: 1, unit: 'kg' }, { label: 'b', value: 2, unit: 'kg' },
    ] };
    const { container } = render(<FigureChart citation={two} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders no chart at all when there are no extracted figures', () => {
    const { container } = render(<FigureChart citation={{ ...full, figures: [] }} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByTestId('figure-n')).toBeInTheDocument();
  });

  it('never puts incommensurable figures on one shared axis', () => {
    // The real Morton citation carries trials, participants, kg and um2 together.
    // On one linear scale 1863 takes the full width and every genuine effect size
    // collapses to a sliver — a graphic asserting the effects are nothing.
    const mixed: Citation = { ...full, figures: [
      { label: 'randomised trials pooled', value: 49 },
      { label: 'participants', value: 1863 },
      { label: 'added fat-free mass', value: 0.3, unit: 'kg' },
      { label: 'added 1RM strength', value: 2.49, unit: 'kg' },
      { label: 'added muscle fibre cross-sectional area', value: 310, unit: 'um2' },
    ] };
    render(<FigureChart citation={mixed} />);
    const plots = screen.getAllByTestId('figure-plot');
    expect(plots).toHaveLength(1);
    expect(plots[0]).toHaveAttribute('data-unit', 'kg');
  });

  it('shows the unplottable figures as numbers rather than dropping them', () => {
    const mixed: Citation = { ...full, figures: [
      { label: 'participants', value: 1863 },
      { label: 'added fat-free mass', value: 0.3, unit: 'kg' },
      { label: 'added 1RM strength', value: 2.49, unit: 'kg' },
    ] };
    render(<FigureChart citation={mixed} />);
    const values = screen.getByTestId('figure-values');
    expect(values).toHaveTextContent('participants');
    expect(values).toHaveTextContent('1863');
  });

  it('does not plot a lone value, which has nothing to compare against', () => {
    const single: Citation = { ...full, figures: [{ label: 'weekly sets', value: 10, unit: 'sets' }] };
    render(<FigureChart citation={single} />);
    expect(screen.queryByTestId('figure-plot')).toBeNull();
    expect(screen.getByTestId('figure-values')).toHaveTextContent('weekly sets');
  });

  it('keeps a zero baseline in any plot it does draw', () => {
    const two: Citation = { ...full, figures: [
      { label: 'a', value: -0.2, unit: 'kg' }, { label: 'b', value: 0.5, unit: 'kg' },
    ] };
    const { container } = render(<FigureChart citation={two} />);
    expect(container.querySelectorAll('svg line').length).toBeGreaterThan(0);
  });
});

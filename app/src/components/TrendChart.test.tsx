import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart } from './TrendChart';

const points = [
  { date: '2026-01-01', value: 80 },
  { date: '2026-01-08', value: 81 },
  { date: '2026-01-15', value: 82 },
];

const band = points.map((p) => ({ date: p.date, lo: p.value - 2, hi: p.value + 2 }));

describe('TrendChart', () => {
  it('renders a trend line and band when there is a real signal', () => {
    render(<TrendChart points={points} band={band} unit="kg" />);
    expect(screen.getByTestId('trend-line')).toBeInTheDocument();
    expect(screen.getByTestId('trend-band')).toBeInTheDocument();
    expect(screen.queryByTestId('trend-noise-copy')).not.toBeInTheDocument();
  });

  it('does not render a trend line or band when the signal is within noise, and says so in words', () => {
    render(<TrendChart points={points} band={band} withinNoise unit="kg" />);
    expect(screen.queryByTestId('trend-line')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trend-band')).not.toBeInTheDocument();
    expect(screen.getByTestId('trend-noise-copy')).toHaveTextContent(/noise/i);
  });

  it('renders a plain line with no band when none is supplied', () => {
    render(<TrendChart points={points} unit="kg" />);
    expect(screen.getByTestId('trend-line')).toBeInTheDocument();
    expect(screen.queryByTestId('trend-band')).not.toBeInTheDocument();
  });

  it('shows an honest empty state instead of an empty chart when there are no points', () => {
    render(<TrendChart points={[]} unit="kg" />);
    expect(screen.queryByTestId('trend-line')).not.toBeInTheDocument();
    expect(screen.getByTestId('trend-empty')).toBeInTheDocument();
  });
});

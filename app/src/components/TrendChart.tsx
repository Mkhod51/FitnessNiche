import type { ReactElement } from 'react';

export interface TrendChartPoint {
  date: string;
  value: number;
}

export interface TrendChartBandPoint {
  date: string;
  lo: number;
  hi: number;
}

export interface TrendChartProps {
  /** The series to plot. Assumed sorted ascending by date. */
  points: TrendChartPoint[];
  /**
   * Optional fitted-line confidence band, one entry per point (same order).
   * Only meaningful together with `points` from the same regression.
   */
  band?: TrendChartBandPoint[];
  /**
   * FR-SIG-2: when the signal cannot be told apart from noise, this
   * component must not draw a line or band that reads as a confident trend —
   * it renders honest copy instead.
   */
  withinNoise?: boolean;
  unit: string;
}

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 100;

// Hand-rolled SVG, per DESIGN.md/decision #11 — no charting library.
export function TrendChart({ points, band, withinNoise, unit }: TrendChartProps): ReactElement {
  if (points.length === 0) {
    return (
      <p data-testid="trend-empty" className="font-serif text-[14px] text-ink-soft">
        Not enough data yet to show a trend.
      </p>
    );
  }

  if (withinNoise) {
    return (
      <p data-testid="trend-noise-copy" className="font-serif text-[14px] text-ink-soft">
        The recent change here can&apos;t be told apart from noise yet — not enough of a signal to call it a trend.
      </p>
    );
  }

  const allValues = [...points.map((p) => p.value), ...(band?.flatMap((b) => [b.lo, b.hi]) ?? [])];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;

  const n = points.length;
  const x = (i: number) => (n === 1 ? VIEW_WIDTH / 2 : (i / (n - 1)) * VIEW_WIDTH);
  const y = (v: number) => VIEW_HEIGHT - ((v - min) / span) * VIEW_HEIGHT;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');

  const bandPath = band
    ? [
        ...band.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(b.hi)}`),
        ...[...band].reverse().map((b, i) => `L${x(band.length - 1 - i)},${y(b.lo)}`),
        'Z',
      ].join(' ')
    : undefined;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-24 w-full text-ink"
        role="img"
        aria-label={`Trend chart, ${unit}`}
      >
        {bandPath && <path data-testid="trend-band" d={bandPath} fill="currentColor" opacity={0.12} />}
        <path data-testid="trend-line" d={linePath} fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.12em] text-ink-faint">measured in {unit}</p>
    </div>
  );
}

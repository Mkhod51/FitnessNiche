import type { ReactElement } from 'react';
import type { Citation, Figure, Population } from '../advice/types';

const MARK_UNIT = 100;
const NOT_STATED = 'not stated in source';
const NOT_EXTRACTED = 'not extracted from source';

const POPULATION_LABEL: Record<Population, string> = {
  trained: 'trained',
  untrained: 'untrained',
  mixed: 'mixed',
  unstated: NOT_STATED,
};

// DESIGN.md §Components "FigureChart"/brief: field rows are a mono label above
// a value. Numeric values get the mono/tabular treatment ("a number set in the
// serif face is a bug"); prose values (population words, ci text, absence
// statements) are serif, since they are read as language, not counted.
function FieldRow({
  testId,
  label,
  value,
  mono,
}: {
  testId: string;
  label: string;
  value: string;
  mono?: boolean;
}): ReactElement {
  return (
    <div data-testid={testId}>
      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">{label}</span>
      <span className={mono ? 'font-mono text-[13px] tabular-nums text-ink' : 'font-serif text-[14px] text-ink'}>
        {value}
      </span>
    </div>
  );
}

// Isotype's founding rule: quantity is shown by repeating a countable mark,
// never by scaling one. One solid mark per 100 people; the remainder (always
// < 100) gets a single hatched mark, not a proportionally-sized bar — a mark
// that changed length would be exactly the scaling this world refuses.
function SampleMarks({ n }: { n: number }): ReactElement {
  const full = Math.floor(n / MARK_UNIT);
  const remainder = n % MARK_UNIT;

  return (
    <div>
      <div className="mt-1 flex flex-wrap items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: full }, (_, i) => (
          <span key={i} className="block h-[10px] w-[10px] bg-ink" />
        ))}
        {remainder > 0 && (
          <span
            className="block h-[10px] w-[10px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, var(--color-ink) 0 2px, transparent 2px 4px)',
            }}
          />
        )}
      </div>
      <p className="mt-1 font-mono text-[9px] text-ink-faint">each mark = 100 people</p>
    </div>
  );
}

// Hand-rolled SVG, per the locked architecture decision (GR-3: no charting
// library, no publisher figure — extracted numbers only, re-plotted here).
// Only ever mounted when `figures` is non-empty; the zero baseline is always
// in the domain so a value sitting on or across it is seen to do so.
function ZeroLinePlot({ figures }: { figures: Figure[] }): ReactElement {
  const width = 260;
  const rowHeight = 22;
  const padding = 10;
  const height = figures.length * rowHeight + padding * 2;

  const values = figures.map((f) => f.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const plotWidth = width - padding * 2;
  const scale = (v: number) => padding + ((v - min) / span) * plotWidth;
  const zeroX = scale(0);

  return (
    <svg
      data-testid="figure-plot"
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 w-full text-ink"
      role="img"
      aria-label="extracted figures plotted against a zero baseline"
    >
      <line x1={zeroX} y1={2} x2={zeroX} y2={height - 2} stroke="currentColor" strokeWidth={1.5} />
      {figures.map((figure, i) => {
        const y = padding + i * rowHeight;
        const barX1 = Math.min(zeroX, scale(figure.value));
        const barX2 = Math.max(zeroX, scale(figure.value));
        return (
          <g key={figure.label}>
            <text x={padding} y={y - 2} fontSize={8} className="font-mono" fill="currentColor">
              {figure.label}
              {figure.unit ? ` (${figure.unit})` : ''} — {figure.value}
            </text>
            <rect x={barX1} y={y} width={Math.max(barX2 - barX1, 1)} height={8} fill="currentColor" opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Layer 3's per-citation number strip. Every field renders even when the
 * value could not be read from a paywalled source — as an explicit statement
 * of absence, never a blank, a dash, or an inferred value.
 */
export function FigureChart({ citation }: { citation: Citation }): ReactElement {
  const { n, population, effectSize, ci, figures } = citation;

  return (
    <div className="flex flex-col gap-3">
      <div data-testid="figure-n">
        <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">sample size</span>
        {n === null ? (
          <span className="font-serif text-[14px] text-ink">{NOT_STATED}</span>
        ) : (
          <>
            <span className="font-mono text-[13px] tabular-nums text-ink">{n}</span>
            <SampleMarks n={n} />
          </>
        )}
      </div>

      <FieldRow testId="figure-population" label="population" value={POPULATION_LABEL[population]} />
      <FieldRow testId="figure-effect-size" label="effect size" value={effectSize ?? NOT_STATED} mono={!!effectSize} />
      <FieldRow testId="figure-ci" label="confidence interval" value={ci ?? NOT_EXTRACTED} />

      {figures.length > 0 && <ZeroLinePlot figures={figures} />}
    </div>
  );
}

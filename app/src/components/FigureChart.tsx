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

// DESIGN.md §Components "FigureChart": a sans-caps label above its value.
// Every field this renders — population, effect size, confidence interval — is
// read as language rather than counted, so all three are serif. There was a
// `mono` flag here for a figure-faced variant; no caller ever passed it, so the
// branch was unreachable and is gone. Numeric fields that DO need the figure
// face render through FigureValues and the sample-size block below, which set
// it directly.
function FieldRow({
  testId,
  label,
  value,
}: {
  testId: string;
  label: string;
  value: string;
}): ReactElement {
  return (
    <div data-testid={testId}>
      <span className="block font-sans text-[9px] uppercase tracking-[0.12em] text-ink-faint">{label}</span>
      <span className="font-serif text-[14px] text-ink">{value}</span>
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
      <p className="mt-1 font-sans text-[9px] text-ink-faint">each mark = 100 people</p>
    </div>
  );
}

// Figures only go on a shared axis when they are actually commensurable. Grouping
// by unit is what makes that decidable: "0.30 kg" and "2.49 kg" belong on one
// scale, while "49 trials", "1863 participants" and "310 um2" do not. Plotting
// them together put 1863 at full width and squashed every real effect size to a
// sliver — a graphic that said the effects were nothing. Unitless figures are
// counts of unrelated things and never share an axis.
function groupPlottable(figures: Figure[]): Map<string, Figure[]> {
  const byUnit = new Map<string, Figure[]>();
  for (const f of figures) {
    if (!f.unit) continue;
    const g = byUnit.get(f.unit) ?? [];
    g.push(f);
    byUnit.set(f.unit, g);
  }
  // One value alone has nothing to be compared against, so a bar would be pure
  // decoration; it reads better as a number.
  for (const [unit, g] of byUnit) if (g.length < 2) byUnit.delete(unit);
  return byUnit;
}

// Hand-rolled SVG, per the locked architecture decision (GR-3: no charting
// library, no publisher figure — extracted numbers only, re-plotted here).
// Labels are HTML rather than SVG <text> so they stay at a readable size and
// are selectable; only the bar itself is drawn.
function UnitPlot({ unit, figures }: { unit: string; figures: Figure[] }): ReactElement {
  const values = figures.map((f) => f.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
  const zero = pct(0);

  return (
    <div data-testid="figure-plot" data-unit={unit}>
      <span className="block font-sans text-[9px] uppercase tracking-[0.12em] text-ink-faint">
        measured in {unit}
      </span>
      {figures.map((f) => {
        const x = pct(f.value);
        return (
          <div key={f.label} className="mt-1.5">
            <span className="block font-figure tabular-nums text-[10px] text-ink">
              {f.label} — {f.value} {unit}
            </span>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-0.5 h-2 w-full text-ink" role="presentation">
              {/* the zero baseline is always in the domain, so a value sitting on
                  or crossing it is seen to do so */}
              <line x1={zero} y1={0} x2={zero} y2={8} stroke="currentColor" strokeWidth={0.6} />
              <rect
                x={Math.min(zero, x)}
                y={2}
                width={Math.max(Math.abs(x - zero), 0.6)}
                height={4}
                fill="currentColor"
                opacity={0.85}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

// Anything not on a shared axis still has to be readable — as a number, not a bar.
function FigureValues({ figures }: { figures: Figure[] }): ReactElement {
  return (
    <div data-testid="figure-values" className="flex flex-col gap-1">
      {figures.map((f) => (
        <span key={f.label} className="font-figure tabular-nums text-[10px] text-ink">
          {f.label} — {f.value}
          {f.unit ? ` ${f.unit}` : ''}
        </span>
      ))}
    </div>
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
        <span className="block font-sans text-[9px] uppercase tracking-[0.12em] text-ink-faint">sample size</span>
        {n === null ? (
          <span className="font-serif text-[14px] text-ink">{NOT_STATED}</span>
        ) : (
          <>
            <span className="font-figure text-[13px] tabular-nums text-ink">{n}</span>
            <SampleMarks n={n} />
          </>
        )}
      </div>

      <FieldRow testId="figure-population" label="population" value={POPULATION_LABEL[population]} />
      <FieldRow testId="figure-effect-size" label="effect size" value={effectSize ?? NOT_EXTRACTED} />
      <FieldRow testId="figure-ci" label="confidence interval" value={ci ?? NOT_EXTRACTED} />

      {figures.length > 0 &&
        (() => {
          const plotted = groupPlottable(figures);
          const plottedLabels = new Set([...plotted.values()].flat().map((f) => f.label));
          const rest = figures.filter((f) => !plottedLabels.has(f.label));
          return (
            <div className="flex flex-col gap-3">
              {[...plotted].map(([unit, group]) => (
                <UnitPlot key={unit} unit={unit} figures={group} />
              ))}
              {rest.length > 0 && <FigureValues figures={rest} />}
            </div>
          );
        })()}
    </div>
  );
}

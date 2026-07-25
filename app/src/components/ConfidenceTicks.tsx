import type { ReactElement } from 'react';
import { GRADE_LANGUAGE } from '../advice/language';
import type { Grade } from '../advice/types';

const FILLED_COUNT: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

// One value per grade, DESIGN.md §Colour "The confidence ramp". Tailwind utility
// names, not literal words — indexed by grade so no grade string is interpolated
// into rendered text (T1/GR-6).
const RAMP_CLASS: Record<Grade, string> = {
  A: 'bg-conf-a',
  B: 'bg-conf-b',
  C: 'bg-conf-c',
  D: 'bg-conf-d',
};

// The label carries the ramp too — that is the variant the developer chose, and
// DESIGN.md applies the ramp to "the confidence counter and its label". Every
// value clears 4.5:1 on paper (measurements recorded in DESIGN.md).
const RAMP_TEXT: Record<Grade, string> = {
  A: 'text-conf-a',
  B: 'text-conf-b',
  C: 'text-conf-c',
  D: 'text-conf-d',
};

/**
 * Four-slot confidence counter. DESIGN.md §Components: the count is the primary
 * encoding, colour is redundant to it, and the label is never optional — remove
 * the hue and the card must still read correctly (NFR-6). Takes only a grade;
 * every word rendered comes from GRADE_LANGUAGE so a caller can't supply its own
 * wording (T1).
 */
export function ConfidenceTicks({ grade }: { grade: Grade }): ReactElement {
  const filled = FILLED_COUNT[grade];
  const label = GRADE_LANGUAGE[grade].chipLabel;

  return (
    <div data-testid="confidence-ticks" role="img" aria-label={label} className="flex items-center gap-2">
      <div className="flex gap-[2.5px]">
        {Array.from({ length: 4 }, (_, i) => {
          const isFilled = i < filled;
          return (
            <span
              key={i}
              data-testid="tick"
              className={`block h-[7px] w-[15px] ${isFilled ? RAMP_CLASS[grade] : 'bg-rule-strong'}`}
            >
              {isFilled && <span data-testid="tick-filled" className="sr-only" />}
            </span>
          );
        })}
      </div>
      <span className={`font-sans text-[9px] font-semibold uppercase tracking-[0.12em] ${RAMP_TEXT[grade]}`}>{label}</span>
    </div>
  );
}

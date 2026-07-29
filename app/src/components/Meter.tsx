import type { ReactElement } from 'react';

/**
 * Countable-mark meter. DESIGN.md §Direction contract: quantity is always shown
 * by repeating a countable mark, never by scaling one — so this is N marks, and
 * never a bar whose width encodes the value.
 *
 * The marks fill in sequence (§Motion, "numeric meters"), which shows that a
 * value moved and by how much rather than substituting a new static bar. The
 * per-mark delay is normalised so the TOTAL is always one `--motion-settle`,
 * whether the meter has six marks or thirty: an un-clamped per-mark delay is how
 * this turns into a progress bar the user waits on, and a loading animation over
 * a local read is banned outright.
 *
 * Extracted from EatDay when the weekly review needed the same idiom. One
 * implementation, so the two surfaces cannot drift into two different meters.
 */
export function Meter({
  filled,
  total,
  tone = 'ink',
  /** Marks past this point are over the range — rendered faint, never red. */
  overFrom,
}: {
  filled: number;
  total: number;
  tone?: 'ink' | 'conf';
  overFrom?: number;
}): ReactElement {
  const marks = Math.max(total, filled, 1);
  const fillClass = tone === 'conf' ? 'bg-conf-b' : 'bg-ink';

  return (
    <div className="mt-2 flex gap-[2.5px]" aria-hidden="true">
      {Array.from({ length: marks }, (_, i) => {
        const on = i < filled;
        const over = overFrom !== undefined && i >= overFrom;
        return (
          <span
            key={i}
            className={`h-[16px] min-w-0 flex-1 ${
              on ? `mark-fill ${over ? 'bg-ink-faint' : fillClass}` : 'bg-rule-strong'
            }`}
            style={
              on
                ? { animationDelay: `calc(var(--motion-settle) * ${(i / Math.max(filled, 1)) * 0.6})` }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

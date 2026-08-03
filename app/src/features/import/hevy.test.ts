import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHevyCsv, rirFromRpe, mapSetType, matchExercise, splitCsvLine } from './hevy';

const here = dirname(fileURLToPath(import.meta.url));
const sample = readFileSync(join(here, '__fixtures__', 'hevy-sample.csv'), 'utf8');

/**
 * OQ-2 is answered in these tests as much as in the parser: Hevy's export
 * carries `rpe`, not `rir`, and RIR is recoverable as 10 − RPE. It is commonly
 * blank, so both paths are exercised here.
 */

describe('rirFromRpe — the answer to OQ-2', () => {
  it('converts RPE to reps in reserve', () => {
    expect(rirFromRpe('10')).toBe(0);
    expect(rirFromRpe('8')).toBe(2);
    expect(rirFromRpe('6.5')).toBe(3.5);
  });

  it('treats a blank RPE as absent, which is the common case', () => {
    expect(rirFromRpe('')).toBeNull();
    expect(rirFromRpe('   ')).toBeNull();
  });

  // A clamped nonsense value would silently become a usable e1RM input, and a
  // wrong qualifying set moves the trend this product stakes its credibility on.
  it.each(['0', '11', '-3', 'hard', 'RPE 8'])('treats %p as absent rather than clamping it', (bad) => {
    expect(rirFromRpe(bad)).toBeNull();
  });
});

describe('parseHevyCsv', () => {
  it('imports the sets it understands', () => {
    const out = parseHevyCsv(sample);
    expect(out.sets).toHaveLength(4); // the 5th exercise is not in the catalogue
    expect(out.sets[0]).toMatchObject({
      exerciseId: 'barbell-bench-press',
      reps: 8,
      setType: 'warmup',
      rir: null,
    });
  });

  it('converts pounds to kilograms rather than importing the number as-is', () => {
    const out = parseHevyCsv(sample);
    // 225 lb = 102.06 kg. Importing 225 as kg would be a 2.2x error on every
    // lift, which would look plausible and be completely wrong.
    expect(out.sets[1].weightKg).toBeCloseTo(102.06, 2);
  });

  it('recovers RIR where an RPE was recorded, and leaves it null where it was not', () => {
    const out = parseHevyCsv(sample);
    expect(out.sets[1].rir).toBe(2); // rpe 8
    expect(out.sets[2].rir).toBeNull(); // blank
    expect(out.setsWithRir).toBe(2);
  });

  it('carries warm-ups across as warm-ups, so they stay out of volume and e1RM', () => {
    const out = parseHevyCsv(sample);
    expect(out.sets.filter((s) => s.setType === 'warmup')).toHaveLength(1);
  });

  // Silently dropping rows is how an import quietly loses half a training
  // history and nobody notices until the trend looks wrong.
  it('reports every row it could not import rather than dropping it silently', () => {
    const out = parseHevyCsv(sample);
    expect(out.problems).toHaveLength(1);
    expect(out.problems[0].reason).toMatch(/Sissy Squat Machine/);
    expect(out.unmatchedExercises).toEqual(['Sissy Squat Machine']);
  });

  it('refuses a file that is not a Hevy export instead of importing nonsense', () => {
    const out = parseHevyCsv('date,weight,notes\n2026-01-01,100,hello');
    expect(out.sets).toHaveLength(0);
    expect(out.problems[0].reason).toMatch(/does not look like a Hevy export/i);
  });

  it('handles an empty file without throwing', () => {
    expect(parseHevyCsv('').problems[0].reason).toMatch(/empty/i);
  });

  // Reading by position would silently shift every value if Hevy ever inserts
  // a column, which is the kind of change an export format makes quietly.
  it('reads columns by name, so a reordered export still imports correctly', () => {
    const reordered =
      '"reps","exercise_title","rpe","weight_kg","set_type"\n"5","Barbell Bench Press","8","100","normal"';
    const out = parseHevyCsv(reordered);
    expect(out.sets[0]).toMatchObject({ reps: 5, weightKg: 100, rir: 2, setType: 'working' });
  });

  it('accepts a metric export, which uses weight_kg instead of weight_lbs', () => {
    const metric = '"exercise_title","reps","weight_kg"\n"Barbell Bench Press","5","100"';
    expect(parseHevyCsv(metric).sets[0].weightKg).toBe(100);
  });

  it('keeps a zero weight, because bodyweight work legitimately has none', () => {
    const bw = '"exercise_title","reps","weight_kg"\n"Barbell Bench Press","5","0"';
    const out = parseHevyCsv(bw);
    expect(out.sets).toHaveLength(1);
    expect(out.sets[0].weightKg).toBe(0);
  });
});

describe('csv parsing details', () => {
  it('handles quoted fields containing commas', () => {
    expect(splitCsvLine('"a","b,c","d"')).toEqual(['a', 'b,c', 'd']);
  });

  it('handles escaped quotes', () => {
    expect(splitCsvLine('"say ""hi""","x"')).toEqual(['say "hi"', 'x']);
  });

  it('matches exercise titles regardless of case and punctuation', () => {
    expect(matchExercise('barbell bench press')).toBe('barbell-bench-press');
    expect(matchExercise('Barbell  Bench-Press')).toBe('barbell-bench-press');
    expect(matchExercise('Nonexistent Lift')).toBeNull();
  });

  it('treats any set type other than warmup as a working set', () => {
    expect(mapSetType('warmup')).toBe('warmup');
    expect(mapSetType('normal')).toBe('working');
    expect(mapSetType('dropset')).toBe('working');
    expect(mapSetType('failure')).toBe('working');
  });
});

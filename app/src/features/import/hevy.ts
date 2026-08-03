import { SEED_EXERCISES } from '../../db/seed-exercises';

/**
 * Hevy CSV import (FR-LOG-5).
 *
 * ── OQ-2, answered ──────────────────────────────────────────────────────────
 * The open question was whether Hevy's free export carries RIR or only
 * weight×reps. It carries neither directly: it has an **`rpe`** column, and
 * RIR is recoverable from it as `10 − RPE`. Confirmed against two independent
 * descriptions of the export, whose header is:
 *
 *   title, start_time, end_time, description, exercise_title, superset_id,
 *   exercise_notes, set_index, set_type, weight_lbs, reps, distance_miles,
 *   duration_seconds, rpe
 *
 * That is better than the build plan assumed — imported history CAN contribute
 * e1RM points. But `rpe` is optional per set and is commonly blank, so the
 * pessimistic path still has to work: a blank RPE imports as `rir: null`, which
 * `setE1rm` then excludes. Both are normal, neither is an error.
 *
 * No real export file was available to test against, so this parses the header
 * by NAME rather than by position, and reports anything it cannot place instead
 * of guessing. If the real format differs, it will say so rather than silently
 * import wrong numbers.
 */

const LB_TO_KG = 0.45359237;

export type ParsedSet = {
  workoutName: string;
  startedAt: string;
  exerciseId: string;
  exerciseTitle: string;
  weightKg: number;
  reps: number;
  rir: number | null;
  setType: 'working' | 'warmup';
};

export type ImportProblem = { row: number; reason: string; raw?: string };

export type ParseResult = {
  sets: ParsedSet[];
  problems: ImportProblem[];
  /** Exercise titles in the file with no match in the catalogue. */
  unmatchedExercises: string[];
  /** How many sets arrived with a usable RPE — the answer to "will this feed a trend". */
  setsWithRir: number;
};

/** Minimal RFC4180-ish splitter: handles quoted fields and embedded commas. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * RPE → RIR. Hevy records RPE on the usual 1–10 scale where 10 is failure, so
 * RIR is what is left in the tank: 10 − RPE.
 *
 * Anything outside the scale is treated as absent rather than clamped. A
 * clamped nonsense value would silently become a usable e1RM input, and a wrong
 * qualifying set is worse than no set — it moves the trend this product stakes
 * its credibility on.
 */
export function rirFromRpe(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const rpe = Number(t);
  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) return null;
  return Math.round((10 - rpe) * 10) / 10;
}

/** Hevy's set types, mapped onto the two this app models. */
export function mapSetType(raw: string): 'working' | 'warmup' {
  return raw.trim().toLowerCase() === 'warmup' ? 'warmup' : 'working';
}

/** Loose title match against the seeded catalogue: case and punctuation insensitive. */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const BY_NAME = new Map(SEED_EXERCISES.map((e) => [normalise(e.name), e.id]));

export function matchExercise(title: string): string | null {
  return BY_NAME.get(normalise(title)) ?? null;
}

export function parseHevyCsv(csv: string): ParseResult {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
  const problems: ImportProblem[] = [];
  const sets: ParsedSet[] = [];
  const unmatched = new Set<string>();

  if (lines.length === 0) {
    return { sets, problems: [{ row: 0, reason: 'the file is empty' }], unmatchedExercises: [], setsWithRir: 0 };
  }

  // Header by NAME, never by position: a column added upstream would silently
  // shift every value if this counted from the left.
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const iTitle = col('title');
  const iStart = col('start_time');
  const iExercise = col('exercise_title');
  const iSetType = col('set_type');
  const iReps = col('reps');
  const iRpe = col('rpe');
  const iKg = col('weight_kg');
  const iLb = col('weight_lbs');

  const required: [string, number][] = [
    ['exercise_title', iExercise],
    ['reps', iReps],
  ];
  const missing = required.filter(([, i]) => i === -1).map(([n]) => n);
  if (missing.length > 0 || (iKg === -1 && iLb === -1)) {
    const names = [...missing, ...(iKg === -1 && iLb === -1 ? ['weight_kg or weight_lbs'] : [])];
    return {
      sets,
      problems: [{ row: 1, reason: `this does not look like a Hevy export — missing ${names.join(', ')}` }],
      unmatchedExercises: [],
      setsWithRir: 0,
    };
  }

  for (let r = 1; r < lines.length; r++) {
    const f = splitCsvLine(lines[r]);
    const raw = lines[r];
    const title = iExercise >= 0 ? (f[iExercise] ?? '').trim() : '';

    if (title === '') {
      problems.push({ row: r + 1, reason: 'no exercise name on this row', raw });
      continue;
    }

    const exerciseId = matchExercise(title);
    if (!exerciseId) {
      unmatched.add(title);
      problems.push({ row: r + 1, reason: `no exercise in this app matches “${title}”`, raw });
      continue;
    }

    const reps = Number((f[iReps] ?? '').trim());
    if (!Number.isInteger(reps) || reps <= 0) {
      problems.push({ row: r + 1, reason: 'reps is not a whole number above zero', raw });
      continue;
    }

    // Weight legitimately reads 0 for bodyweight work, so it is checked for
    // being a NUMBER rather than for being positive.
    const kgField = iKg >= 0 ? (f[iKg] ?? '').trim() : '';
    const lbField = iLb >= 0 ? (f[iLb] ?? '').trim() : '';
    let weightKg: number;
    if (kgField !== '') weightKg = Number(kgField);
    else if (lbField !== '') weightKg = Math.round(Number(lbField) * LB_TO_KG * 100) / 100;
    else weightKg = 0;

    if (!Number.isFinite(weightKg) || weightKg < 0) {
      problems.push({ row: r + 1, reason: 'weight is not a usable number', raw });
      continue;
    }

    sets.push({
      workoutName: iTitle >= 0 ? (f[iTitle] ?? '').trim() : '',
      startedAt: iStart >= 0 ? (f[iStart] ?? '').trim() : '',
      exerciseId,
      exerciseTitle: title,
      weightKg,
      reps,
      rir: iRpe >= 0 ? rirFromRpe(f[iRpe] ?? '') : null,
      setType: iSetType >= 0 ? mapSetType(f[iSetType] ?? '') : 'working',
    });
  }

  return {
    sets,
    problems,
    unmatchedExercises: [...unmatched],
    setsWithRir: sets.filter((s) => s.rir !== null).length,
  };
}

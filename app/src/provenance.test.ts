import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdviceFeed } from './features/advice/AdviceFeed';
import { AskEvidence } from './features/advice/AskEvidence';
import { GRADE_LANGUAGE } from './advice/language';

// This file is .ts, not .tsx (per the brief) — JSX syntax cannot appear in a
// .ts file, so every render() below goes through createElement instead of
// <Component />.

/**
 * AC-4/T1: "no render path for an ungraded or uncited recommendation" has to be
 * provable by grep and by test, both. The tests below are the grep half — they
 * read real files off disk, not a hand-copied duplicate of the code under test
 * (M0 shipped exactly that mistake once and it caught nothing). The render-level
 * describe block below is the test half.
 */

const SRC_ROOT = path.resolve(__dirname); // app/src

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
    // Test fixtures legitimately contain DOIs and calibrated grade wording as
    // literal strings (they're asserting against real values) — scanning them
    // would make this check fire on its own fixtures.
    if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
    out.push(full);
  }
  return out;
}

function readAll(files: string[]): { file: string; text: string }[] {
  return files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));
}

// Brief's exact scope: the DOI / grade-language / image checks run over
// src/components/** and src/features/**. src/advice/claim-schema.ts legitimately
// carries an example DOI in a zod error message ("must be a bare DOI, e.g.
// 10.1080/...") — including src/advice/ here would make the check fire on its
// own documentation string, which is the same shape of false positive the
// test-file exclusion above exists to avoid.
const COMPONENT_AND_FEATURE_FILES = [
  ...listSourceFiles(path.join(SRC_ROOT, 'components')),
  ...listSourceFiles(path.join(SRC_ROOT, 'features')),
];

// The LLM / scholarly-API checks are scoped differently per the brief: fetch(/
// XMLHttpRequest only matters inside the advice trust path itself (src/advice/),
// everywhere else in the app network access is legitimate (sync, etc). openai/
// anthropic must not appear anywhere near the trust path, so that scan is wider.
const ADVICE_FILES = listSourceFiles(path.join(SRC_ROOT, 'advice'));
const LLM_STRING_SCAN_FILES = [...ADVICE_FILES, ...COMPONENT_AND_FEATURE_FILES];

const DOI_PATTERN = /10\.\d{4,9}\/\S/;
const IMAGE_URL_PATTERN = /https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|avif)/i;
const GRADE_BRACKET_PATTERN = /\[[ABCD]\]/;
const GRADE_INTERPOLATION_PATTERN = />\s*\{\s*(claim\.grade|grade)\s*\}\s*</;

describe('provenance: source-level scan (AC-4/T1, GR-3, GR-6, FR-CLAIM-3)', () => {
  it('actually scanned real files — a bad glob must not make this vacuously pass', () => {
    expect(COMPONENT_AND_FEATURE_FILES.length).toBeGreaterThan(0);
    expect(ADVICE_FILES.length).toBeGreaterThan(0);
    expect(COMPONENT_AND_FEATURE_FILES.some((f) => f.endsWith('ClaimCard.tsx'))).toBe(true);
    expect(COMPONENT_AND_FEATURE_FILES.some((f) => f.endsWith('AdviceFeed.tsx'))).toBe(true);
    expect(COMPONENT_AND_FEATURE_FILES.some((f) => f.endsWith('AskEvidence.tsx'))).toBe(true);
  });

  it('never hard-codes a DOI-shaped literal in a component or feature file — DOIs only arrive via a Claim prop', () => {
    const offenders = readAll(COMPONENT_AND_FEATURE_FILES).filter(({ text }) => DOI_PATTERN.test(text));
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('never hard-codes a calibrated GRADE_LANGUAGE verb, confidence sentence, or chip label outside language.ts', () => {
    // Imported from the real module, not restated here, so this check breaks
    // the moment someone edits language.ts rather than silently going stale.
    const calibratedStrings = Object.values(GRADE_LANGUAGE).flatMap((l) => [l.verb, l.confidence, l.chipLabel]);

    const offenders: { file: string; string: string }[] = [];
    for (const { file, text } of readAll(COMPONENT_AND_FEATURE_FILES)) {
      for (const literal of calibratedStrings) {
        if (text.includes(literal)) offenders.push({ file, string: literal });
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never hard-codes a raw grade letter as display text ("[A]" or a bare {claim.grade} interpolation)', () => {
    const offenders = readAll(COMPONENT_AND_FEATURE_FILES).filter(
      ({ text }) => GRADE_BRACKET_PATTERN.test(text) || GRADE_INTERPOLATION_PATTERN.test(text)
    );
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('never renders an <img> tag or an external image URL under src/components/ (GR-3: no publisher figure images, ever)', () => {
    const componentFiles = listSourceFiles(path.join(SRC_ROOT, 'components'));
    expect(componentFiles.length).toBeGreaterThan(0);
    const offenders = readAll(componentFiles).filter(
      ({ text }) => /<img\b/i.test(text) || IMAGE_URL_PATTERN.test(text)
    );
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('never references fetch( or XMLHttpRequest inside src/advice/ — no network path in the trust path (FR-CLAIM-3)', () => {
    const offenders = readAll(ADVICE_FILES).filter(({ text }) => /fetch\(|XMLHttpRequest/.test(text));
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  it('never mentions openai or anthropic near the advice trust path — no LLM in the runtime trust path (GR-6)', () => {
    const offenders = readAll(LLM_STRING_SCAN_FILES).filter(({ text }) => /openai|anthropic/i.test(text));
    expect(offenders.map((o) => o.file)).toEqual([]);
  });
});

describe('provenance: render-level invariant (AC-4/T1)', () => {
  function assertEveryStatementHasAClaimIdAncestor() {
    const statements = screen.getAllByTestId('claim-statement');
    expect(statements.length).toBeGreaterThan(0);

    for (const statement of statements) {
      let node: HTMLElement | null = statement.parentElement;
      let found = false;
      while (node) {
        const claimId = node.getAttribute('data-claim-id');
        if (claimId && claimId.trim() !== '') {
          found = true;
          break;
        }
        node = node.parentElement;
      }
      expect(found).toBe(true);
    }
  }

  it('every claim-statement in AdviceFeed (including contested-cluster sides) has an ancestor carrying a non-empty data-claim-id', () => {
    render(createElement(AdviceFeed));
    assertEveryStatementHasAClaimIdAncestor();
  });

  it('every claim-statement in a contested AskEvidence result has an ancestor carrying a non-empty data-claim-id', () => {
    render(createElement(AskEvidence));
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'protein-timing' } });
    // Sanity: this query really does hit the contested-cluster render path
    // (both `claim-side` elements), not just a single settled claim.
    expect(screen.getAllByTestId('claim-side').length).toBeGreaterThan(1);
    assertEveryStatementHasAClaimIdAncestor();
  });

  it('every claim-statement in a settled-claim AskEvidence result has an ancestor carrying a non-empty data-claim-id', () => {
    render(createElement(AskEvidence));
    const input = screen.getByLabelText(/what does the evidence say/i);
    fireEvent.change(input, { target: { value: 'deloads' } });
    assertEveryStatementHasAClaimIdAncestor();
  });
});

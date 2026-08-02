import { describe, it, expect } from 'vitest';
import { buildClaims, renderModule } from './build-claims';

const goodYaml = `
id: c-test-volume
statement: A statement about volume.
peekStatement: A short curated form about volume.
grade: A
status: settled
domain: volume
predicates: null
trigger: null
clusterId: null
phrasingKey: test-volume
supersededBy: null
lastReviewed: 2026-07-25
citations:
  - id: cit-test-1
    claimId: c-test-volume
    doi: 10.1080/02640414.2016.1210197
    authors: Someone A
    year: 2017
    journal: Journal of Sports Sciences
    n: 42
    population: trained
    effectSize: null
    ci: null
    figures: []
    quote: null
`;

describe('buildClaims', () => {
  it('parses a well-formed claim file', () => {
    const claims = buildClaims([{ file: 'c-test-volume.yaml', yaml: goodYaml }]);
    expect(claims).toHaveLength(1);
    expect(claims[0].id).toBe('c-test-volume');
    expect(claims[0].grade).toBe('A');
  });

  it('rejects an unknown variable before a predicate reaches the runtime evaluator', () => {
    const bad = goodYaml
      .replace('predicates: null', 'predicates: { "==": [{ var: unknown }, 1] }')
      .replace('trigger: null', 'trigger: rule');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: bad }]))
      .toThrow(/unknown predicate variable/);
  });

  it.each(['.nan', '.inf'])('rejects %s predicate literals before generation can turn them into null', (literal) => {
    const bad = goodYaml
      .replace('predicates: null', `predicates: { "==": [${literal}, ${literal}] }`)
      .replace('trigger: null', 'trigger: rule');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: bad }]))
      .toThrow(/finite numeric literal/);
  });

  it('names the offending file when a claim is malformed', () => {
    const bad = goodYaml.replace('grade: A', 'grade: S');
    expect(() => buildClaims([{ file: 'c-bad.yaml', yaml: bad }])).toThrow(/c-bad\.yaml/);
  });

  it('rejects a claim whose id does not match its filename', () => {
    expect(() => buildClaims([{ file: 'c-wrong-name.yaml', yaml: goodYaml }])).toThrow(/filename/i);
  });

  it('rejects duplicate claim ids across files', () => {
    const dup = [
      { file: 'c-test-volume.yaml', yaml: goodYaml },
      { file: 'c-test-volume.yaml', yaml: goodYaml },
    ];
    expect(() => buildClaims(dup)).toThrow(/duplicate/i);
  });

  it('rejects a supersededBy pointing at a claim that does not exist', () => {
    const dangling = goodYaml.replace('supersededBy: null', 'supersededBy: c-nope');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: dangling }])).toThrow(/c-nope/);
  });

  it('rejects a contested claim that is alone in its cluster', () => {
    const lonely = goodYaml
      .replace('status: settled', 'status: contested')
      .replace('clusterId: null', 'clusterId: lonely-cluster');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: lonely }])).toThrow(/cluster/i);
  });

  it('sorts output by id so the generated file is stable across runs', () => {
    // plain .replace() only swaps the first hit, leaving the citation's claimId
    // pointing at the old id (fails the "citation must carry parent id" rule
    // before sorting is ever exercised) — needs a global replace here.
    const second = goodYaml
      .replace(/c-test-volume/g, 'c-a-first')
      .replace('phrasingKey: test-volume', 'phrasingKey: a-first');
    const claims = buildClaims([
      { file: 'c-test-volume.yaml', yaml: goodYaml },
      { file: 'c-a-first.yaml', yaml: second },
    ]);
    expect(claims.map((c) => c.id)).toEqual(['c-a-first', 'c-test-volume']);
  });
});

describe('buildClaims — gates added after the whole-branch review', () => {
  it('rejects two citations sharing an id inside one claim', () => {
    // Citation ids key the evidence panel's React list; a collision drops a source.
    const second = [
      '  - id: cit-test-1',
      '    claimId: c-test-volume',
      '    doi: 10.1000/second',
      '    authors: Another B',
      '    year: 2020',
      '    journal: Another Journal',
      '    n: null',
      '    population: unstated',
      '    effectSize: null',
      '    ci: null',
      '    figures: []',
      '    quote: null',
      '',
    ].join('\n');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: goodYaml + second }]))
      .toThrow(/duplicate citation id/i);
  });

  it('rejects a settled claim carrying a clusterId', () => {
    // Would render under a "contested — both sides shown" banner and misrepresent a
    // settled pair as a live controversy.
    const bad = goodYaml.replace('clusterId: null', 'clusterId: some-cluster');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: bad }])).toThrow(/only a contested claim/i);
  });

  it('rejects a claim superseded by itself', () => {
    const bad = goodYaml.replace('supersededBy: null', 'supersededBy: c-test-volume');
    expect(() => buildClaims([{ file: 'c-test-volume.yaml', yaml: bad }])).toThrow(/itself/i);
  });
});

describe('renderModule', () => {
  it('emits a typed module importing the pinned Claim type', () => {
    const out = renderModule(buildClaims([{ file: 'c-test-volume.yaml', yaml: goodYaml }]));
    expect(out).toContain("import type { Claim } from '../advice/types.ts'");
    expect(out).toContain('export const CLAIMS: Claim[]');
    expect(out).toContain('c-test-volume');
  });
});

import { readFileSync } from 'node:fs';
import { buildClaims as build, renderModule as render, readClaimSources, CLAIMS_DIR, OUTPUT_PATH } from './build-claims';

describe('the committed bundle', () => {
  // This is the T1 build gate. The generated module is committed so that test,
  // typecheck and build need no generation-ordering dance — which only works if
  // something fails loudly when it goes stale. This is that something.
  it('matches the claim YAML on disk', () => {
    const expected = render(build(readClaimSources(CLAIMS_DIR)));
    const actual = readFileSync(OUTPUT_PATH, 'utf8');
    expect(actual).toBe(expected);
  });
});

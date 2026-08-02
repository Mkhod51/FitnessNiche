import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EvidencePanel } from './EvidencePanel';
import type { Claim } from '../advice/types';

const claim: Claim = {
  id: 'c-volume',
  statement: 'More weekly sets produce more growth, with diminishing returns',
  peekStatement: 'Short curated form',
  grade: 'C', status: 'settled', domain: 'volume',
  predicates: null, trigger: null, clusterId: null, phrasingKey: 'test-volume',
  supersededBy: null, lastReviewed: '2026-06-01',
  citations: [
    {
      id: 'cit-1', claimId: 'c-volume', doi: '10.1080/02640414.2016.1210197',
      authors: 'Morton RW, Murphy KT, McKellar SR', year: 2017, journal: 'Journal of Sports Sciences',
      n: 42, population: 'trained', effectSize: 'SMD 0.35', ci: '95% CI 0.03 to 0.67',
      figures: [{ label: 'weekly sets', value: 10, unit: 'sets' }], quote: null,
    },
    {
      id: 'cit-2', claimId: 'c-volume', doi: '10.1249/MSS.0000000000002200',
      authors: 'Someone Else A', year: 2020, journal: 'Medicine & Science in Sports & Exercise',
      n: null, population: 'unstated', effectSize: null, ci: null, figures: [], quote: null,
    },
  ],
};

describe('EvidencePanel', () => {
  it('renders the grade\'s confidence sentence at tap-1', () => {
    render(<EvidencePanel claim={claim} />);
    expect(screen.getByTestId('evidence-confidence')).toHaveTextContent(
      /mechanism, small studies, or expert consensus without trial evidence behind it/i,
    );
  });

  it('shows authors, year and journal for every citation at tap-2', () => {
    render(<EvidencePanel claim={claim} />);
    const blocks = screen.getAllByTestId('citation-block');
    expect(blocks).toHaveLength(2);

    expect(within(blocks[0]).getByTestId('citation-authors')).toHaveTextContent(
      'Morton RW, Murphy KT, McKellar SR',
    );
    expect(within(blocks[0]).getByText(/Journal of Sports Sciences/)).toBeInTheDocument();
    expect(within(blocks[0]).getByText(/2017/)).toBeInTheDocument();

    expect(within(blocks[1]).getByTestId('citation-authors')).toHaveTextContent('Someone Else A');
    expect(within(blocks[1]).getByText(/Medicine & Science in Sports & Exercise/)).toBeInTheDocument();
    expect(within(blocks[1]).getByText(/2020/)).toBeInTheDocument();
  });

  it('carries the full author list, not the shortened card version', () => {
    render(<EvidencePanel claim={claim} />);
    const blocks = screen.getAllByTestId('citation-block');
    expect(within(blocks[0]).getByTestId('citation-authors')).toHaveTextContent('McKellar SR');
  });

  it('renders each citation\'s DOI as a resolvable link', () => {
    render(<EvidencePanel claim={claim} />);
    const blocks = screen.getAllByTestId('citation-block');
    const link = within(blocks[0]).getByTestId('citation-doi');
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1080/02640414.2016.1210197');
    expect(link).toHaveTextContent('https://doi.org/10.1080/02640414.2016.1210197');
  });

  it('mounts a FigureChart per citation, including one with no extractable figures', () => {
    render(<EvidencePanel claim={claim} />);
    const nFields = screen.getAllByTestId('figure-n');
    expect(nFields).toHaveLength(2);
    expect(nFields[0]).toHaveTextContent('42');
    expect(nFields[1]).toHaveTextContent(/not stated/i);
  });

  it('displays lastReviewed (FR-CLAIM-4)', () => {
    render(<EvidencePanel claim={claim} />);
    expect(screen.getByTestId('evidence-last-reviewed')).toHaveTextContent('2026-06-01');
  });

  it('shows a supersededBy value when the claim carries one', () => {
    const superseded = { ...claim, supersededBy: 'c-volume-v2' };
    render(<EvidencePanel claim={superseded} />);
    expect(screen.getByTestId('evidence-superseded')).toHaveTextContent('c-volume-v2');
  });

  it('shows no supersededBy notice when the claim does not carry one', () => {
    render(<EvidencePanel claim={claim} />);
    expect(screen.queryByTestId('evidence-superseded')).toBeNull();
  });

  it('shows a curated attributed quote when the record carries one', () => {
    // Quotes are curated at the point a paper qualifies its own finding, so this is
    // load-bearing nuance rather than decoration.
    const quoted: Claim = { ...claim, citations: [
      { ...claim.citations[0], quote: 'caution is warranted when interpreting the present analysis' },
    ] };
    render(<EvidencePanel claim={quoted} />);
    expect(screen.getByTestId('citation-quote')).toHaveTextContent(/caution is warranted/i);
  });

  it('renders no quote element at all when the record has none', () => {
    render(<EvidencePanel claim={claim} />);
    expect(screen.queryByTestId('citation-quote')).toBeNull();
  });
});

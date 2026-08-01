import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExercisePicker } from './ExercisePicker';
import { SEED_EXERCISES } from '../../db/seed-exercises';

function open(recentIds: string[] = []) {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(<ExercisePicker open recentIds={recentIds} onPick={onPick} onClose={onClose} />);
  return { onPick, onClose };
}

describe('ExercisePicker', () => {
  it('renders nothing at all when closed', () => {
    render(<ExercisePicker open={false} recentIds={[]} onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('exercise-sheet')).not.toBeInTheDocument();
  });

  // The whole point of the change: searching is a shortcut, not the only way in.
  it('lists the entire catalogue without anyone typing anything', () => {
    open();
    expect(screen.getAllByTestId('exercise-row')).toHaveLength(SEED_EXERCISES.length);
    expect(screen.getByText('All exercises')).toBeInTheDocument();
  });

  it('keeps recents short while collapsed, so the catalogue is on screen from the start', () => {
    const recent = SEED_EXERCISES.slice(0, 5).map((e) => e.id);
    open(recent);

    // 2 recents + the full catalogue, not 5 recents crowding it out.
    expect(screen.getAllByTestId('exercise-row')).toHaveLength(2 + SEED_EXERCISES.length);

    fireEvent.click(screen.getByTestId('sheet-handle'));
    expect(screen.getAllByTestId('exercise-row')).toHaveLength(5 + SEED_EXERCISES.length);
  });

  it('opens taller on the handle, on scrolling, and on typing', () => {
    open();
    const sheet = () => screen.getByTestId('exercise-sheet');
    expect(sheet()).toHaveAttribute('data-expanded', 'false');

    fireEvent.scroll(screen.getByTestId('exercise-list'), { target: { scrollTop: 40 } });
    expect(sheet()).toHaveAttribute('data-expanded', 'true');

    fireEvent.click(screen.getByTestId('sheet-handle'));
    expect(sheet()).toHaveAttribute('data-expanded', 'false');

    fireEvent.change(screen.getByTestId('exercise-search'), { target: { value: 'bench' } });
    expect(sheet()).toHaveAttribute('data-expanded', 'true');
  });

  it('filters by name and by muscle, and reports the count', () => {
    open();
    fireEvent.change(screen.getByTestId('exercise-search'), { target: { value: 'bench' } });
    const byName = screen.getAllByTestId('exercise-row');
    expect(byName.length).toBeGreaterThan(0);
    expect(byName.length).toBeLessThan(SEED_EXERCISES.length);
    byName.forEach((r) => expect(r.textContent?.toLowerCase()).toContain('bench'));

    fireEvent.change(screen.getByTestId('exercise-search'), { target: { value: 'triceps' } });
    expect(screen.getAllByTestId('exercise-row').length).toBeGreaterThan(0);
  });

  it('says so plainly when nothing matches, including that you cannot add your own yet', () => {
    open();
    fireEvent.change(screen.getByTestId('exercise-search'), { target: { value: 'zercher carry' } });
    expect(screen.queryByTestId('exercise-row')).not.toBeInTheDocument();
    expect(screen.getByText(/no way to add your own yet/i)).toBeInTheDocument();
  });

  it('returns the id that was tapped', () => {
    const { onPick } = open();
    const row = screen.getAllByTestId('exercise-row')[0];
    fireEvent.click(row);
    expect(onPick).toHaveBeenCalledWith(row.getAttribute('data-exercise-id'));
  });

  it('closes on the scrim and on escape, so it is not a trap', () => {
    const { onClose } = open();
    fireEvent.click(screen.getByTestId('picker-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  // Artwork is sourced separately; until a file lands the row shows an obvious
  // gap rather than a stock glyph standing in for 56 different movements.
  it('shows a visible missing-art slot rather than a stand-in', () => {
    open();
    expect(screen.getAllByTestId('exercise-art-missing').length).toBe(SEED_EXERCISES.length);
  });
});

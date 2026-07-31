import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { initDb } from './db/client';

vi.mock('./db/client', () => ({ initDb: vi.fn() }));
vi.mock('./db/weights', () => ({ getWeightHistory: vi.fn(async () => []) }));

const mockInitDb = vi.mocked(initDb);

describe('App', () => {
  beforeEach(() => {
    mockInitDb.mockReset();
  });

  it('renders the app name', () => {
    mockInitDb.mockResolvedValue('opfs-sahpool');
    render(<App />);
    expect(screen.getByRole('heading', { name: /evidence/i })).toBeInTheDocument();
  });

  it('shows the storage mode as a bare value when persistence is durable', async () => {
    mockInitDb.mockResolvedValue('opfs-sahpool');
    render(<App />);
    const banner = await screen.findByTestId('storage-mode');
    expect(banner).toHaveTextContent('opfs-sahpool');
  });

  it('renders a visible warning, not a bare value, when storage falls back to memory (D7)', async () => {
    mockInitDb.mockResolvedValue('memory-fallback');
    render(<App />);
    const banner = await screen.findByTestId('storage-mode');
    expect(banner).toBeVisible();
    expect(banner).toHaveTextContent(/memory-fallback/);
    // A bare value carries no warning meaning of its own — the banner text must
    // say something is at risk, not just repeat the mode string in isolation.
    expect(banner).toHaveTextContent(/data loss|may not be saved|at risk/i);
  });
});

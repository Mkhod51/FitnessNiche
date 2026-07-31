import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from './Settings';
import { getSyncConfig, setSyncConfig, clearSyncConfig } from '../../sync/config';
import { syncNow, startAutoSync } from '../../sync/sync';
import type { SyncConfig } from '../../sync/config';

// Settings touches db/user (getUser in an effect) and theme (localStorage); mock
// at the module boundary so nothing real runs. Sync is the subject here, so its
// modules are mocked wholesale — no real storage, no real network.
vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn(async () => null), updateProfile: vi.fn() };
});

vi.mock('../../db/export', async () => {
  const actual = await vi.importActual<typeof import('../../db/export')>('../../db/export');
  return {
    ...actual,
    exportEverything: vi.fn(async () => ({})),
    exportSetsCsv: vi.fn(async () => ''),
    deleteEverything: vi.fn(async () => undefined),
    exportFilename: vi.fn(() => 'myostat.json'),
    exportCsvFilename: vi.fn(() => 'myostat-sets.csv'),
  };
});

vi.mock('../../generated/claims', () => ({ CLAIMS: [] }));
vi.mock('../../theme', () => ({ readStoredTheme: () => 'auto', applyTheme: vi.fn() }));

vi.mock('../../sync/config', () => ({
  getSyncConfig: vi.fn(),
  setSyncConfig: vi.fn(),
  clearSyncConfig: vi.fn(),
}));
vi.mock('../../sync/sync', () => ({
  syncNow: vi.fn(),
  startAutoSync: vi.fn(() => () => {}),
}));

const mockGetSyncConfig = vi.mocked(getSyncConfig);
const mockSetSyncConfig = vi.mocked(setSyncConfig);
const mockClearSyncConfig = vi.mocked(clearSyncConfig);
const mockSyncNow = vi.mocked(syncNow);
const mockStartAutoSync = vi.mocked(startAutoSync);

// Settings renders <Link>, so it needs router context to mount at all.
const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe('Settings sync section', () => {
  beforeEach(() => {
    mockGetSyncConfig.mockReset();
    mockSetSyncConfig.mockReset();
    mockClearSyncConfig.mockReset();
    mockSyncNow.mockReset();
    mockStartAutoSync.mockReset();
    mockStartAutoSync.mockReturnValue(() => {});
  });

  it('shows the on-device privacy notice and no Sync-now button when sync is not configured', async () => {
    mockGetSyncConfig.mockReturnValue(null);
    render(<Settings />);
    await screen.findByTestId('privacy-notice');
    expect(screen.getByTestId('sync-status')).toHaveTextContent(/off.*this device/i);
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent(/nowhere else/i);
    expect(screen.queryByTestId('sync-now-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sync-disconnect-button')).not.toBeInTheDocument();
  });

  it('attributes food data to Open Food Facts and CoFID', async () => {
    mockGetSyncConfig.mockReturnValue(null);
    render(<Settings />);
    await screen.findByText(/data sources/i);

    expect(screen.getByText(/open food facts/i)).toBeInTheDocument();
    expect(screen.getByText(/cofid/i)).toBeInTheDocument();
    expect(screen.getByText(/each entry shows its source/i)).toBeInTheDocument();
  });

  it('saving url + token calls setSyncConfig, re-arms auto-sync, and reflects configured status with the URL in the notice', async () => {
    let cfg: SyncConfig | null = null;
    mockGetSyncConfig.mockImplementation(() => cfg);
    mockSetSyncConfig.mockImplementation((url, token) => {
      cfg = { url, token };
    });

    render(<Settings />);
    await screen.findByTestId('sync-status');
    expect(screen.getByTestId('sync-status')).toHaveTextContent(/off/i);

    fireEvent.change(screen.getByTestId('sync-url-input'), { target: { value: 'https://sync.example.workers.dev' } });
    fireEvent.change(screen.getByTestId('sync-token-input'), { target: { value: 'sek-123' } });

    // Save is disabled until both fields are non-empty — here they are, so it fires.
    fireEvent.click(screen.getByTestId('sync-save-button'));

    await waitFor(() => {
      expect(mockSetSyncConfig).toHaveBeenCalledWith('https://sync.example.workers.dev', 'sek-123');
    });
    expect(mockStartAutoSync).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sync-status')).toHaveTextContent('https://sync.example.workers.dev');
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent(/replicates to the server/i);
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent('https://sync.example.workers.dev');
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent(/device only/i);
    // Sync-now becomes available once configured.
    expect(screen.getByTestId('sync-now-button')).toBeInTheDocument();
  });

  it('Save stays disabled while either field is empty', async () => {
    mockGetSyncConfig.mockReturnValue(null);
    render(<Settings />);
    await screen.findByTestId('sync-status');
    expect(screen.getByTestId('sync-save-button')).toBeDisabled();
    fireEvent.change(screen.getByTestId('sync-url-input'), { target: { value: 'https://x.example' } });
    expect(screen.getByTestId('sync-save-button')).toBeDisabled();
    fireEvent.change(screen.getByTestId('sync-token-input'), { target: { value: 'tok' } });
    expect(screen.getByTestId('sync-save-button')).not.toBeDisabled();
  });

  it('Sync now reports the push/pull counts and surfaces errors instead of swallowing them', async () => {
    let cfg: SyncConfig | null = { url: 'https://sync.example.workers.dev', token: 't' };
    mockGetSyncConfig.mockImplementation(() => cfg);
    mockSyncNow.mockResolvedValue({ configured: true, pushed: 3, pulled: 1, superseded: 0 });

    render(<Settings />);
    await screen.findByTestId('sync-now-button');
    fireEvent.click(screen.getByTestId('sync-now-button'));
    await waitFor(() => {
      expect(screen.getByTestId('sync-result')).toHaveTextContent('pushed 3, pulled 1');
    });

    // A broken endpoint must be visible, matching sync.ts's console.error philosophy.
    mockSyncNow.mockRejectedValueOnce(new Error('sync failed: 503 Service Unavailable'));
    fireEvent.click(screen.getByTestId('sync-now-button'));
    await waitFor(() => {
      expect(screen.getByTestId('sync-result')).toHaveTextContent(/503/);
    });
  });

  it('Disconnect clears the config, re-arms auto-sync, and returns to the on-device notice', async () => {
    let cfg: SyncConfig | null = { url: 'https://sync.example.workers.dev', token: 't' };
    mockGetSyncConfig.mockImplementation(() => cfg);
    mockClearSyncConfig.mockImplementation(() => {
      cfg = null;
    });

    render(<Settings />);
    await screen.findByTestId('sync-now-button');
    expect(screen.getByTestId('sync-status')).toHaveTextContent('https://sync.example.workers.dev');

    fireEvent.click(screen.getByTestId('sync-disconnect-button'));
    await waitFor(() => {
      expect(mockClearSyncConfig).toHaveBeenCalledTimes(1);
    });
    expect(mockStartAutoSync).toHaveBeenCalled();
    expect(screen.getByTestId('sync-status')).toHaveTextContent(/off/i);
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent(/nowhere else/i);
    expect(screen.queryByTestId('sync-now-button')).not.toBeInTheDocument();
  });
});

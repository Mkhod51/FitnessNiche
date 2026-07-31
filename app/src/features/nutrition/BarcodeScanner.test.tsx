import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BarcodeScanner } from './BarcodeScanner';

const SCANNER_MOTION_MS = 200;

// Mock the motion helper
vi.mock('../../motion', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

// Create a mock module that can be configured per test
const mockState = {
  decodeImpl: null as any,
  storedCallback: null as ((result: any, error?: any, controls?: any) => void) | null,
  mockStop: null as any,
};

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    decodeFromConstraints = async (
      constraints: any,
      video: any,
      callback: (result?: any, error?: any, controls?: any) => void
    ) => {
      if (mockState.decodeImpl) {
        return mockState.decodeImpl(constraints, video, callback);
      }
      mockState.storedCallback = callback;
      const mockControls = { stop: mockState.mockStop };
      return mockControls;
    };
    constructor() {}
  },
}));

describe('BarcodeScanner', () => {
  let onDetected: any;
  let onClose: any;

  beforeEach(() => {
    onDetected = vi.fn();
    onClose = vi.fn();

    // Reset mock state
    mockState.storedCallback = null;
    mockState.mockStop = vi.fn();
    mockState.decodeImpl = null;

    // Reset navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render close button and video element', () => {
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close scanner/i });
    expect(closeButton).toBeInTheDocument();

    const video = screen.getByRole('dialog').querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('should call onDetected once and stop controls on plausible barcode', async () => {
    vi.useFakeTimers();
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    // Wait for the scanner to initialize
    await vi.waitFor(() => {
      expect(mockState.storedCallback).not.toBeNull();
    });

    // Simulate a decode with a plausible barcode
    const mockResult = {
      getText: vi.fn(() => '5000159484695'),
    };

    mockState.storedCallback!(mockResult, undefined, { stop: mockState.mockStop });

    // Wait for onDetected to be called
    await vi.waitFor(() => {
      expect(onDetected).toHaveBeenCalledWith('5000159484695');
      expect(onDetected).toHaveBeenCalledTimes(1);
    });

    expect(mockState.mockStop).toHaveBeenCalled();

    // Fast forward past the motion delay
    vi.advanceTimersByTime(SCANNER_MOTION_MS);
    expect(onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should not fire onDetected for non-plausible barcode', async () => {
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    // Wait for the scanner to initialize
    await vi.waitFor(() => {
      expect(mockState.storedCallback).not.toBeNull();
    });

    // Simulate a decode with a non-plausible code
    const mockResult = {
      getText: vi.fn(() => 'abc'),
    };

    mockState.storedCallback!(mockResult, undefined, { stop: mockState.mockStop });

    // onDetected should not be called
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('should show permission denied message on NotAllowedError', async () => {
    mockState.decodeImpl = vi.fn().mockRejectedValueOnce({ name: 'NotAllowedError' });

    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    await vi.waitFor(() => {
      expect(screen.getByText(/Camera permission was blocked/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /type barcode/i })).toBeInTheDocument();
  });

  it('should show unavailable message when navigator.mediaDevices is undefined', () => {
    // Remove mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    expect(screen.getByText(/Camera unavailable — type the barcode below/i)).toBeInTheDocument();
  });

  it('should stop controls on unmount', async () => {
    const { unmount } = render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    // Wait for the scanner to initialize
    await vi.waitFor(() => {
      expect(mockState.storedCallback).not.toBeNull();
    });

    unmount();

    expect(mockState.mockStop).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    vi.useFakeTimers();
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close scanner/i });
    closeButton.click();

    // Fast forward past the motion delay
    vi.advanceTimersByTime(SCANNER_MOTION_MS);

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should call onClose when type barcode button is clicked in error state', async () => {
    vi.useFakeTimers();
    mockState.decodeImpl = vi.fn().mockRejectedValueOnce({ name: 'NotAllowedError' });

    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    await vi.waitFor(() => {
      expect(screen.getByText(/Camera permission was blocked/i)).toBeInTheDocument();
    });

    const typeButton = screen.getByRole('button', { name: /type barcode/i });
    typeButton.click();

    vi.advanceTimersByTime(SCANNER_MOTION_MS);

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should validate barcodes using isPlausibleBarcode', async () => {
    vi.useFakeTimers();
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    // Wait for the scanner to initialize
    await vi.waitFor(() => {
      expect(mockState.storedCallback).not.toBeNull();
    });

    // Test plausible barcode
    const plausibleResult = { getText: vi.fn(() => '5000159484695') };
    mockState.storedCallback!(plausibleResult, undefined, { stop: mockState.mockStop });

    await vi.waitFor(() => {
      expect(onDetected).toHaveBeenCalledWith('5000159484695');
    });

    // Reset for next test
    onDetected.mockClear();
    mockState.mockStop!.mockClear();

    // Test implausible barcode (too short)
    const implausibleResult = { getText: vi.fn(() => '123') };
    mockState.storedCallback!(implausibleResult, undefined, { stop: vi.fn() });

    // onDetected should not be called for implausible barcode
    expect(onDetected).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

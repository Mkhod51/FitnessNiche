import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BarcodeScanner } from './BarcodeScanner';

const SCANNER_MOTION_MS = 200;

// Mock the motion helper
vi.mock('../../motion', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

// Create a mock module that can be configured per test
const mockState = {
  decodeVideoImpl: null as any,
  storedCallback: null as ((result: any, error?: any, controls?: any) => void) | null,
  mockStop: null as any,
  decodeCalls: 0,
};

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoElement = async (
      video: any,
      callback: (result?: any, error?: any, controls?: any) => void
    ) => {
      mockState.decodeCalls += 1;
      if (mockState.decodeVideoImpl) {
        return mockState.decodeVideoImpl(video, callback);
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
  let mockTrackStop: any;
  let mockStream: MediaStream;

  beforeEach(() => {
    onDetected = vi.fn();
    onClose = vi.fn();
    mockTrackStop = vi.fn();
    mockStream = {
      getTracks: vi.fn(() => [{ stop: mockTrackStop }]),
    } as unknown as MediaStream;

    // Reset mock state
    mockState.storedCallback = null;
    mockState.mockStop = vi.fn();
    mockState.decodeVideoImpl = null;
    mockState.decodeCalls = 0;

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    // Reset navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
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

  it('renders the scanner dialog at document body level so fixed sizing is viewport-based', () => {
    const { container } = render(
      <div data-testid="animated-picker-shell" style={{ transform: 'translate3d(0, 0, 0)', overflow: 'hidden' }}>
        <BarcodeScanner onDetected={onDetected} onClose={onClose} />
      </div>,
    );

    const dialog = screen.getByRole('dialog', { name: /barcode scanner/i });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.parentElement).toBe(document.body);
  });

  it('keeps the decorative viewfinder from intercepting the close button tap', () => {
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    const viewfinderLayer = screen.getByTestId('scanner-viewfinder-layer');
    expect(viewfinderLayer).toHaveClass('pointer-events-none');
  });

  it('keeps the close control thumb-sized in both dimensions', () => {
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close scanner/i });
    expect(closeButton).toHaveClass('min-h-[44px]');
    expect(closeButton).toHaveClass('min-w-[44px]');
  });

  it('attaches a granted camera stream to the video before starting the decoder', async () => {
    render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    const video = screen.getByRole('dialog').querySelector('video')!;

    await vi.waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: { ideal: 'environment' } },
      });
      expect(video.srcObject).toBe(mockStream);
      expect(video.play).toHaveBeenCalled();
      expect(mockState.decodeCalls).toBe(1);
    });
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
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce({ name: 'NotAllowedError' });

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

    expect(screen.getByText(/Camera unavailable. Type the barcode below/i)).toBeInTheDocument();
  });

  it('should stop controls on unmount', async () => {
    const { unmount } = render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);

    // Wait for the scanner to initialize
    await vi.waitFor(() => {
      expect(mockState.storedCallback).not.toBeNull();
    });

    unmount();

    expect(mockState.mockStop).toHaveBeenCalled();
    expect(mockTrackStop).toHaveBeenCalled();
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
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce({ name: 'NotAllowedError' });

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

  it('does not re-acquire the camera when the parent re-renders with a fresh onDetected', async () => {
    const { rerender } = render(<BarcodeScanner onDetected={onDetected} onClose={onClose} />);
    await vi.waitFor(() => expect(mockState.decodeCalls).toBe(1));

    // A parent that passes a new callback identity each render must not cause the
    // scanner to re-subscribe and re-request the camera mid-scan.
    rerender(<BarcodeScanner onDetected={vi.fn()} onClose={vi.fn()} />);
    expect(mockState.decodeCalls).toBe(1);
  });

  it('fires onDetected under React StrictMode, which double-invokes effects in dev', async () => {
    render(
      <StrictMode>
        <BarcodeScanner onDetected={onDetected} onClose={onClose} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(mockState.storedCallback).not.toBeNull());

    await act(async () => {
      mockState.storedCallback!({ getText: () => '5000159484695' }, undefined, { stop: mockState.mockStop });
    });

    expect(onDetected).toHaveBeenCalledWith('5000159484695');
  });
});

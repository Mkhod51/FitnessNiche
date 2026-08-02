import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { isPlausibleBarcode } from '../../food/barcode';
import { prefersReducedMotion } from '../../motion';

const SCANNER_MOTION_MS = 200;
const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

type BarcodeScannerProps = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<{ type: 'permission' | 'unavailable' } | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resolvedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  // Latest-callback refs: the scanner subscribes once on mount (effect deps []),
  // so a parent passing a fresh onDetected/onClose each render cannot re-trigger
  // the camera. Re-subscribing here would re-acquire the camera mid-scan.
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  onDetectedRef.current = onDetected;
  onCloseRef.current = onClose;

  function closeWithMotion() {
    if (closing || closeTimerRef.current !== null) return;
    setClosing(true);
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onCloseRef.current();
    }, SCANNER_MOTION_MS);
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      stopScanner();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({ type: 'unavailable' });
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
        ]);

        // ponytail: seam — a Capacitor native barcode plugin replaces this decode block; onDetected/onClose stay unchanged
        const reader = new BrowserMultiFormatReader(hints);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        video!.srcObject = stream;
        await video!.play();

        const controls = await reader.decodeFromVideoElement(
          video!,
          (result, _error, ctrl) => {
            if (!result || resolvedRef.current) return;
            const code = result.getText();
            if (!isPlausibleBarcode(code)) return;
            resolvedRef.current = true;
            controlsRef.current = ctrl ?? controlsRef.current;
            stopScanner();
            if (!cancelled) onDetectedRef.current(code);
            closeWithMotion();
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err) {
        if (cancelled) return;
        stopScanner();
        const caught = err as { name?: string };
        setError(
          caught?.name === 'NotAllowedError' || caught?.name === 'SecurityError'
            ? { type: 'permission' }
            : { type: 'unavailable' },
        );
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, []);

  const surface = error ? (
      <div
        className={`fixed inset-0 z-50 bg-ink ${closing ? 'scanner-exit' : 'scanner-enter'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Barcode scanner"
      >
        <div className="flex h-full flex-col items-center justify-center px-4">
          <p className="font-serif text-[16px] leading-[1.5] text-paper">
            {error.type === 'permission'
              ? 'Camera permission was blocked. Enable it in your browser or site settings, or type the barcode below.'
              : 'Camera unavailable — type the barcode below.'}
          </p>
          <button
            type="button"
            onClick={closeWithMotion}
            className="mt-4 min-h-[48px] w-full bg-paper font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink"
          >
            Type barcode
          </button>
          <button
            type="button"
            onClick={closeWithMotion}
            className="mt-3 min-h-[44px] w-full font-sans text-[11px] text-paper"
            aria-label="Close scanner"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
    <div
      className={`fixed inset-0 z-50 bg-ink ${closing ? 'scanner-exit' : 'scanner-enter'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scanner"
    >
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        aria-hidden
      />
      <button
        type="button"
        onClick={closeWithMotion}
        className="absolute right-4 top-4 z-10 min-h-[44px] min-w-[44px] font-sans text-[11px] text-paper"
        aria-label="Close scanner"
      >
        ✕
      </button>
      <div
        data-testid="scanner-viewfinder-layer"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="relative h-48 w-64">
          <div className="absolute inset-0 border-2 border-paper opacity-50" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className={LABEL}>Align the barcode</p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(surface, document.body);
}

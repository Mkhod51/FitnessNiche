# Camera Barcode Scanner — Design

**Status:** approved 2026-07-31
**Branch:** `BarcodeScanner`
**Priority:** handoff item 4 (food logging)

## Goal

Let a user scan a food barcode (EAN-13 / EAN-8 / UPC-A) with the device camera inside the food picker, on iOS Safari (primary) and Android Chrome, including when installed as a standalone PWA. Chosen so the same web scanner carries over to a future iOS app with no rewrite.

## What already exists (no need to rebuild)

- Manual barcode entry already works: `FoodPicker.tsx` has `isPlausibleBarcode(term)` (`/^\d{8,14}$/`) wired into its search field.
- `src/food/off.ts` already has `lookupBarcode(barcode): Promise<FoodItemDraft | null>` (OFF v3.6 product endpoint), with parser and tests. The manual path already calls it.
- `FoodItemDraft` already carries a `barcode?` field; logging snapshots at write time.

The scanner's only job is to produce a validated barcode string and drop it into the path the typed digits already use. `off.ts`, the data model, and logging stay untouched.

## Decisions

- **Library:** `@zxing/browser` (`BrowserMultiFormatReader`). `BarcodeDetector` is not usable on iOS Safari (disabled by default through Safari 26.5+), and Safari is the primary target, so a JS decoder is mandatory for all users. `BarcodeDetector` may be revisited later as a Chromium-only optimization.
- **Formats:** EAN-13, EAN-8, UPC-A. No QR (no QR food lookup; scanning arbitrary QRs is noise). No UPC-E (rare; add later).
- **Surface:** full-screen overlay above the `FoodPicker` sheet.
- **Motion:** the overlay transitions on and off screen so it feels native, not abrupt (details below).
- **iOS-native future:** the web scanner is wrapped later with Capacitor, where it keeps working; a native ML Kit / AVFoundation plugin is an optional later perf upgrade, not a rewrite. React Native / Expo would force a rewrite and is not the path.

## Architecture

New component `BarcodeScanner` owns three things and nothing else:

1. the `<video>` element and the `getUserMedia` stream,
2. the `@zxing/browser` continuous decode loop,
3. the permission / error UI.

Contract with its parent is one callback: `onDetected(barcode: string)`. On a valid decode it fires once, stops the reader, releases the camera, and the parent closes the overlay.

```
[camera button in FoodPicker]
   └─ mount <BarcodeScanner> overlay (user gesture)
        ├─ getUserMedia({ video:{ facingMode:'environment' } })
        ├─ BrowserMultiFormatReader continuous decode (EAN-13/EAN-8/UPC-A)
        └─ on decode → validate (shared isPlausibleBarcode) → onDetected(code)
   ← FoodPicker sets query=code, runs existing lookupBarcode(), closes overlay
```

**The Capacitor seam (kept deliberately simple).** No adapter interface is introduced now (one implementation = YAGNI). The decode logic simply lives inside this one component. When Capacitor arrives, the native-plugin branch is a later refactor contained to this file (feature-detect native → call a Capacitor barcode plugin). `FoodPicker` and `lookupBarcode` never change. A `// ponytail: seam` comment marks the swap point.

**Shared validator.** The local `isPlausibleBarcode` in `FoodPicker.tsx` moves to `src/food/barcode.ts` so the manual path and the scanner share one truth. Both import it.

## UX

- **Entry:** a camera-icon button in the `FoodPicker` search row (next to "Search foods, brands or barcode"). Tap opens the overlay. The tap is the user gesture iOS Safari requires to start the camera.
- **Viewfinder:** the `<video>` fills the overlay full-bleed (`object-fit: cover`) with a framing reticle and a hint to align the barcode. A close button returns to the sheet.
- **On decode:** fill the search field with the code, run the existing lookup, animate the overlay out. No new result UI — the existing OFF result card renders exactly as it does for a typed barcode.
- **Manual entry stays primary fallback:** the search field still accepts typed digits exactly as today.

## Motion (native feel)

- **Entrance:** overlay slides up from the bottom edge (`translateY(100%) → 0`) with a fade (`opacity 0 → 1`), ~250ms, ease-out (decelerate), so the camera rises into view rather than snapping on.
- **Exit:** reverse — slide down (`0 → translateY(100%)`) with fade out, ~200ms, and the component unmounts **only after the exit transition completes**, so it never abruptly disappears.
- **Reduced motion:** when `prefers-reduced-motion` is set, collapse the slide to a short fade (or no motion), per the OS setting. Accessibility is not simplified away.
- **Mechanism:** CSS transitions driven by a small `closing` state + `onTransitionEnd`/timeout-to-unmount. No animation library is added. If the app already has a sheet/overlay motion style, mirror its timing and easing for consistency (confirm during planning).

## Permission & error messaging (honest, no invented capability)

Distinct messages, both keeping manual entry fully usable:

- **Permission denied** (`NotAllowedError`): "Camera permission was blocked. Enable it in your browser or site settings, or type the barcode below." The overlay offers a dismiss that closes it and focuses the existing search field.
- **Other unavailable** (`NotFoundError`, missing `navigator.mediaDevices`, insecure context, or any other failure): "Camera unavailable — type the barcode below." Same dismiss path.

No path claims the camera works when it does not.

## Lifecycle & cleanup

- Stop the `BrowserMultiFormatReader` and release every `MediaStreamTrack` on: first valid decode, close, and unmount. iOS Safari holds the camera if tracks are not stopped.
- Guard against setState after unmount.
- Request camera on the open tap only (never pre-requested).

## Testing (TDD, per handoff)

- **Unit (Vitest):** `src/food/barcode.test.ts` for the shared validator.
- **Component (Vitest + RTL):** `BarcodeScanner.test.tsx` with `BrowserMultiFormatReader` and `getUserMedia` mocked:
  - on decode → `onDetected` fires with the code and the reader is stopped;
  - `NotAllowedError` → renders the permission-denied message;
  - no `mediaDevices` / insecure context → renders the unavailable message;
  - unmount → stops tracks / reader.
- **Integration:** extend `FoodPicker.test.tsx` so delivering a scanned barcode drives the existing `lookupBarcode` mock and renders the result — proving the scan path reuses the manual path.
- **Honest gap:** live `getUserMedia` cannot run in jsdom. The real camera is verified manually on a device during the build (optionally a Playwright e2e later). This is stated, not papered over.

## Known risk

iOS Safari exposes no camera focus control, so EAN-13 decode can be finicky in poor light or angle. The manual-entry fallback exists for misses. If `@zxing/browser` underperforms on-device, swapping to `html5-qrcode` or a wasm decoder is contained to the one component — which is exactly why the decode seam stays isolated.

## Net diff

- **New:** `app/src/features/nutrition/BarcodeScanner.tsx` (+ `.test.tsx`), `app/src/food/barcode.ts` (+ `.test.ts`)
- **Modified:** `app/src/features/nutrition/FoodPicker.tsx` (shared validator import, camera button, overlay + animation wiring), `app/package.json` (`@zxing/browser`)
- **Untouched:** `app/src/food/off.ts`, data model, logging, PWA manifest (no manifest change needed; HTTPS is the only prerequisite and is already assumed)

## Out of scope

Capacitor / native plugin, `BarcodeDetector` optimization, QR scanning, OFF proxy / rate-limiting (handoff priority 3), and any change to `off.ts` or the data/log path.

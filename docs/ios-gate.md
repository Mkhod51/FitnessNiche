# iOS platform gate — human check required

This is the one check nobody's automation can do for you: whether OPFS-backed SQLite
actually persists on a real iPhone, in real Safari, under real memory pressure. The
whole offline-first premise of this project (NFR-1/2) rests on the answer. Playwright's
"Mobile Safari" emulation runs on desktop WebKit and does **not** reproduce iOS's OPFS
implementation or its storage-eviction behavior, so it cannot substitute for this.

**Do not mark milestone M0 complete until this has been run on a real device and the
result recorded below.**

## Why this needs HTTPS (or localhost)

Service workers only register in a "secure context." `https://` origins qualify, and so
does `http://localhost` — but a plain LAN IP like `http://192.168.1.23:4173` does **not**.
If you serve the build over bare HTTP to your phone, the app will still load and the
database will still work, but **the service worker will never register**, which means:

- no install prompt / no offline precache
- the airplane-mode reload step below will fail even though OPFS persistence itself is fine
- you will *not* be testing the thing this gate exists to test

So pick one of the two routes below. Route A gives you a full check (including offline).
Route B is faster to set up but only proves storage persistence, not the offline reload.

### Route A — HTTPS tunnel (full check, recommended)

1. Build the app: `cd app && npm run build`
2. Serve it locally: `npx vite preview --port 4173`
3. In a second terminal, tunnel it to a public HTTPS URL. Any of these work — use
   whichever you already have installed:
   - `npx localtunnel --port 4173`
   - `ngrok http 4173` (needs an ngrok account/token)
   - `cloudflared tunnel --url http://localhost:4173`
4. Open the resulting `https://...` URL in Safari on the iPhone. Everything below
   (offline reload included) is now testable.

### Route B — LAN HTTPS with a self-signed cert (no external tunnel)

1. Find your Mac's LAN IP: `ipconfig getifaddr en0`
2. Generate a local cert (e.g. with `mkcert`, if installed: `mkcert 192.168.1.23
   localhost`) and point `vite preview` at it, or simply run
   `npx vite preview --host --port 4173` over **plain HTTP** and accept the limitation.
3. **Caveat if you stay on plain HTTP:** the service worker will not register. You can
   still check storage-mode, seeding, force-quit persistence, and the ~7-day eviction
   risk — but you cannot validate the airplane-mode reload (there's no cached shell to
   serve). Note this explicitly in your results.
4. If you do get a self-signed HTTPS cert loaded, Safari will show an "untrusted
   certificate" warning on first visit — go to Settings → General → About → Certificate
   Trust Settings and enable full trust for the cert, otherwise the page (and the
   service worker) will refuse to load.

## Steps to run on the phone

1. Open the URL in **Safari** (not Chrome — Chrome on iOS is WebKit-based but does not
   expose the same install/service-worker path). Do this in a normal tab, not Private
   Browsing (see risk below).
2. Confirm the page loads and shows `storage-mode: opfs-sahpool` and
   `exercise-count: 56`. If you see `memory-fallback` instead, stop — see "What a
   memory-fallback reading means" below.
3. Tap Share → **Add to Home Screen**. Launch the app from the new home screen icon
   (not from Safari) so it runs standalone.
4. Confirm again: `storage-mode` reads `opfs-sahpool`, `exercise-count` reads `56`.
5. Force-quit the app (swipe up from the app switcher). Reopen from the home screen
   icon. Confirm both values are still correct — this proves the data survived a
   process kill, not just a soft reload.
6. Enable **Airplane Mode**. Reopen the app from the home screen icon. Confirm it still
   loads and still shows `opfs-sahpool` / `56` with zero connectivity. (This step only
   works if you used Route A, or Route B with a trusted HTTPS cert — see above.)
7. Turn Airplane Mode back off.

## Two known risks — read before you conclude anything

- **Private Browsing has no OPFS at all.** If you happen to run this in a Private tab,
  the app will fall back to `memory-fallback` regardless of whether persistence works
  in a normal tab. That's expected and is not a finding — just don't test in Private
  Browsing, or note it explicitly if you did.
- **Safari evicts script-writable storage (including OPFS) after roughly 7 days of no
  interaction with the site/app.** A pass today does not guarantee the data is still
  there in two weeks if the user never opens the app in that window. This is a real
  product constraint, not a bug to fix — note it as a known limitation, not a defect.

## What a `memory-fallback` reading would mean

If `storage-mode` ever reads `memory-fallback` on the real device (not in Private
Browsing), it means the OPFS SAH-pool persistence approach this milestone was built on
does not hold up on iOS Safari. That's a foundational finding, not a bug to patch: per
BUILD-PLAN's TA-1, it would mean reconsidering the app's shell entirely — most likely a
React Native / Expo build instead of a Safari PWA — while reusing `src/domain` and
`src/advice` unchanged, since that logic is framework-free. Do not attempt to work
around a `memory-fallback` reading with clever code; report it.

## Results — fill in after running on a real device

| iOS version | Storage mode observed | Survived force-quit? | Survived airplane mode? | Notes |
|---|---|---|---|---|
| | | | | |


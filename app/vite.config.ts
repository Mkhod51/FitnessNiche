/// <reference types="vitest/config" />
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const OFF_SEARCH_FIELDS = ['code', 'product_name', 'product_name_en', 'brands', 'nutriments'];

function boundedPageSize(value: unknown): number {
  const size = Number(value ?? 20);
  if (!Number.isFinite(size)) return 20;
  return Math.min(Math.max(Math.trunc(size), 1), 20);
}

function foodSearchMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'method not allowed' }));
      return;
    }
    const raw = await new Promise<string>((resolve) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => {
        body += chunk;
      });
      req.on('end', () => resolve(body));
      req.on('error', () => resolve(''));
    });
    let parsed: { q?: unknown; pageSize?: unknown };
    try {
      parsed = raw ? JSON.parse(raw) as { q?: unknown; pageSize?: unknown } : {};
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'malformed request body' }));
      return;
    }
    const q = typeof parsed.q === 'string' ? parsed.q.trim() : '';
    if (!q) {
      res.end(JSON.stringify({ hits: [] }));
      return;
    }
    try {
      const upstream = await fetch(OFF_SEARCH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, page_size: boundedPageSize(parsed.pageSize), fields: OFF_SEARCH_FIELDS }),
      });
      if (!upstream.ok) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'food search failed' }));
        return;
      }
      res.end(await upstream.text());
    } catch {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'food search failed' }));
    }
  };
}

export default defineConfig({
  // The iOS gate (docs/ios-gate.md) serves this build to a real iPhone through an
  // HTTPS tunnel, and vite's host check rejects the tunnel's hostname by default.
  // A leading dot matches subdomains, so this allows any *.loca.lt tunnel without
  // switching the check off entirely.
  server: {
    allowedHosts: ['.loca.lt', '.trycloudflare.com'],
  },
  preview: { allowedHosts: ['.loca.lt', '.trycloudflare.com'] },
  plugins: [
    {
      name: 'myostat-food-search-proxy',
      configureServer(server) {
        server.middlewares.use('/api/food/search', foodSearchMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use('/api/food/search', foodSearchMiddleware());
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MyoStat',
        short_name: 'MyoStat',
        description: 'MyoStat — lift and nutrition tracking with graded, cited evidence.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // wasm is NOT in the default pattern set — without this the app cannot boot offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // the sqlite wasm binary is well over the 2 MiB default
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  // sqlite-wasm ships its own wasm loader; pre-bundling it breaks the worker import.
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Playwright owns e2e/; keep vitest out of it or it will try to run those specs.
    // server/ is the sync Worker — a separate package with its own dependencies
    // (hono, workers-types) and its own vitest. Running its tests from here
    // resolves them against the APP's dependency tree, where `hono` does not
    // exist, so the app suite fails on a file the app does not own.
    exclude: ['e2e/**', 'server/**', 'node_modules/**'],
  },
});

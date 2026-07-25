/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Evidence-graded training log',
        short_name: 'Training log',
        description: 'Lift and nutrition tracking with graded, cited evidence.',
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
    exclude: ['e2e/**', 'node_modules/**'],
  },
});

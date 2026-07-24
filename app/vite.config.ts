/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    // `--mode e2e` flips on the window.__db escape hatch in src/db/client.ts
    // that the migrations e2e test reads through (see persistence.spec.ts).
    command: 'npx tsc --noEmit && npx vite build --mode e2e && npx vite preview --mode e2e --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

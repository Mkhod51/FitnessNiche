import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('the sqlite wasm binary is precached', () => {
  const dist = join(process.cwd(), 'dist');
  const swFile = readdirSync(dist).find((f) => f === 'sw.js');
  expect(swFile, 'sw.js should be generated').toBeTruthy();
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  expect(sw, 'precache manifest must include a .wasm entry').toMatch(/\.wasm/);
});

test('manifest is served', async ({ page }) => {
  const res = await page.request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
});

import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// RTL's auto-cleanup only self-registers when `afterEach` is a real global,
// which vitest doesn't provide (no `test.globals: true` in vite.config.ts).
// Without this, every test file with more than one render() leaks DOM across
// tests in that file.
afterEach(cleanup);

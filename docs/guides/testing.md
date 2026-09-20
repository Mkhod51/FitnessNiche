# Testing guide

**Status:** current scope page; the test-layer map and focused command catalogue are owned by documentation Task 7.

The repository uses Vitest for domain, component, structural, generated-file, and server contract coverage, plus Playwright for browser workflows. Test existence is not the same as end-to-end deployment verification; known boundaries are recorded in [feature status](../reference/feature-status.md).

From `app/`, run `npm test -- --run`, `npm run typecheck`, `npm run build`, and `npm run e2e`. The full guide will map each test layer to its source and explain e2e-only instrumentation.

# Development guide

**Status:** current setup capsule; the full contributor guide is owned by documentation Task 7.

Use Node.js 24, matching CI. The PWA and its tooling are installed independently from the optional sync server.

```bash
cd app
npm ci
npm run dev
```

Run `npm run typecheck`, `npm test -- --run`, and `npm run build` before handing off a change; use `npm run e2e` when browser behaviour is in scope. Domain and advice logic should remain framework-free where the current architecture intends it. See [testing](testing.md) and the [repository map](../reference/repository-map.md).

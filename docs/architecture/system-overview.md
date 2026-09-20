# System overview

**Status:** current scope page; the source-traced architecture narrative is owned by documentation Task 5.

MyoStat is a React PWA whose primary data store is SQLite compiled to WASM and run in a Web Worker. Curated YAML claims are validated into a typed bundle consumed by a deterministic advice engine. Cloudflare Worker/D1 sync and Open Food Facts lookup are optional network paths.

The root [README](../../README.md) contains the compact system diagram. This page will own boot flow, component boundaries, offline/online labels, and links to the [data model](data-model.md), [storage](local-first-storage.md), and [sync](sync.md) details.

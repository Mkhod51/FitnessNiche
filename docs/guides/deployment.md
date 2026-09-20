# Deployment guide

**Status:** current scope page; complete PWA and Worker/D1 operations are owned by documentation Task 7.

The static PWA can run without a sync deployment. Optional replication uses the service under `app/server/`; exact Worker and D1 commands currently live in its [server README](../../app/server/README.md).

This page will own environment variables, PWA/WASM constraints, schema application, authentication, food-search configuration, and operational gaps. It must not imply that a deployed browser-to-D1 round trip is covered by the present test suite.

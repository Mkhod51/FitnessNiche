# myostat-sync

Cloudflare Worker + D1 sync target for MyoStat. Implements `POST /sync`
against the `PushPullRequest` / `PushPullResponse` contract in
`../src/sync/protocol.ts`. See that file for the wire contract and merge
semantics (last-write-wins on `updated_at`, tie-break on `id`).

## Setup

Install dependencies:

```
cd app/server
npm install
```

## Create the D1 database

```
npx wrangler d1 create myostat-sync-db
```

This prints a `database_id`. Paste it into `wrangler.toml` under
`[[d1_databases]]`, replacing `REPLACE_WITH_D1_DATABASE_ID`.

## Apply the schema

Local (for `wrangler dev`):

```
npx wrangler d1 execute myostat-sync-db --local --file=./schema.sql
```

Remote (production database):

```
npx wrangler d1 execute myostat-sync-db --remote --file=./schema.sql
```

## Set the auth secret

The Worker checks every request for `Authorization: Bearer <SYNC_TOKEN>`
using a timing-safe comparison. Generate a token and set it as a secret
(never commit it, never put it in `wrangler.toml`):

```
openssl rand -hex 32 | npx wrangler secret put SYNC_TOKEN
```

For local dev, put the same value in a `.dev.vars` file (gitignored):

```
echo "SYNC_TOKEN=<same-value-you-generated>" > .dev.vars
```

## Develop

```
npm run dev
```

Runs the Worker locally with a local D1 instance (`--local` state lives in
`.wrangler/`).

## Test

```
npm test
```

Vitest against an in-memory fake D1 binding (`src/index.test.ts`) -- no real
D1 instance or network needed to run the suite.

## Typecheck

```
npm run typecheck
```

## Deploy

```
npx wrangler deploy
```

Deploys to the account tied to your `wrangler login` / `CLOUDFLARE_API_TOKEN`.
Confirm `wrangler.toml`'s `database_id` points at the database you applied
`schema.sql` to remotely, and that `SYNC_TOKEN` is already set as a secret
(`wrangler secret put SYNC_TOKEN`) before the client tries to talk to it.

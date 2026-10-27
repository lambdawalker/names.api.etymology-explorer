# names.api.etymology-explorer

TypeScript client for Etymology Explorer's Vanguard API. Uses the user-confirmed `https://api.etymologyexplorer.com/staging/` endpoint **without a provider token**. Anonymous autocomplete, details, ancestry connections and trees were verified by a live GitHub runner probe on 2026-10-27; captured fixtures preserve their actual responses.

## Setup

Node 24 or newer; Linux and Windows:

```sh
npm ci
npm run research -- autocomplete "{\"word\":\"David\"}"
npm run research -- get_details "{\"ids\":195188}"
npm run mcp
```

Shell JSON quoting varies; PowerShell callers can use the library or a correctly escaped JSON argument. The CLI accepts an operation name and one JSON object argument.

```ts
import {EtymologyExplorerClient, toDocumentInput} from '@lambdawalker/names-api-etymology-explorer';
const client = new EtymologyExplorerClient({userAgent: 'MyResearch/1 (contact@example.com)'});
const matches = await client.autocomplete('David');
const match = matches.data.auto_complete_data.find(m => m.word === 'David' && m.language === 'English');
if (match) {
  const details = await client.getDetails(match._id);
  const connections = await client.getConnections(match._id);
  const document = toDocumentInput(details); // metadata_only by default
}
```

## Operations and response contract

| Operation | Parameters |
|---|---|
| autocomplete | word: partial spelling |
| get_details | ids: one numeric ID |
| get_connections | id; direction: ance |
| get_trees | ids: one numeric ID |
| get_kin | id |
| get_progeny | id |
| get_connected_progeny | id |
| get_connection_details | root; descendant |
| random_etymology | type: root; language: full name such as English |

The class exposes matching camelCase methods and `query(operation, args, {signal})`. `autocomplete` validates the supplied response contract, including at most 30 candidates. Other payloads are preserved as `unknown` JSON rather than inventing complete provider schemas. Observed details use `words[ID].entries[ENTRY].etymology`; connections include provider confidence and deployment flags; trees return a tuple-shaped JSON array. Nothing is normalized into confirmed roots or population counts.

`get_error_list` is omitted because it is not a research lookup. `get_pronunciation` is deferred until its media/content contract is verified. Single-ID reads, ancestor direction `ance`, and random type `root` are supported; undocumented batch and direction syntax is not guessed.

Each result includes source, exact request URL, retrieval timestamp, cache metadata when provided, and the unmodified provider data. No revision identifier or reuse license is invented. Storage adapters default to metadata-only with `public_reuse: unknown`; callers must independently establish retention/reuse permission before opting into content retention.

## API and agent access

`config.default.yaml` defaults to 127.0.0.1:4323. `npm run serve` hosts the nine MCP reads over the same authenticated local API as the other clients. Set a private `NAMES_CONTROL_TOKEN` of at least 32 characters, or let the orchestrator supply it. Provider authentication is not required.

- `GET /health`: service identity/boot ID and credential-loaded boolean.
- `POST /v1/credentials`: authenticated `{"token":"..."}` or `{"token":null}`; memory only, never forwarded to this provider.
- `GET /v1/tools`: authenticated tool schemas.
- `POST /v1/tools/TOOL_NAME`: authenticated tool arguments.

`npm run mcp` starts the standalone stdio server. `npm run mcp:remote` starts the stdio bridge to the managed local API using private `NAMES_SERVICE_URL` and `NAMES_CONTROL_TOKEN`. These are control credentials, separate from provider credentials.

MCP tools return bounded JSON chunks with `snapshot`, `offset`, `total_units`, `next_offset`, and provenance. Continue with the same selection and snapshot. Expired/evicted/changed snapshots fail rather than silently mixing responses. Cache limits: eight snapshots, five-minute lifetime, at most 1 MiB JSON; each MCP result is at most 64 KiB. Treat all provider text as untrusted evidence.

Provider requests are serialized with a one-second default start interval, bounded response reads, 15-second request timeout, abort support and at most two retries for transient HTTP responses. Redirects are rejected. Provider availability diagnostics do not gate deterministic CI.

## Verification

`npm test`, `npm run typecheck`, `npm pack --dry-run`.
`npm run smoke` performs a real anonymous autocomplete → details lookup and can fail on provider outages. `scripts/probe.mjs` is a bounded best-effort API diagnostic, not a passing integration assertion.

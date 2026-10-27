# Vanguard Client Implementation Plan
> For agentic workers: use executing-plans for inline implementation.
Goal: implement token-free Vanguard name discovery and documented relationship reads, with MCP and managed startup.
Architecture: copy the existing generic transport/host; add focused schemas/client/MCP/evidence modules.
Tech stack: Node 24, TypeScript, Zod 4, MCP SDK 2.4, YAML 2.9.
Spec: ../specs/2026-10-27-vanguard-design.md
## Global constraints
Staging HTTPS; no provider auth; port 4323; bounded responses; unknown provider JSON retained as evidence; no invented license.
## Review focus
Malformed IDs, query injection, continuation consistency, arbitrary provider text, credential separation.
## Task 1: source client
- [ ] Add tests for supplied autocomplete, encoding, malformed envelopes, cancellation, bounds and typed HTTP errors.
- [ ] Observe failing tests; implement src/schemas.ts and src/client.ts with SourceRecord metadata.
- [ ] Run full tests and typecheck.
## Task 2: agent boundary and evidence
- [ ] Add MCP tests for real discovery/call, snapshot paging and stale snapshots.
- [ ] Implement MCP/CLI, conservative storage document adapter, and service wrappers.
- [ ] Verify credential lifecycle via existing real HTTP host tests.
## Task 3: orchestrator
- [ ] Add managed token-free startup regression.
- [ ] Enable registry entry/port and remove obsolete unimplemented guard.
- [ ] Run both suites, review branch, publish CI and merge after success.

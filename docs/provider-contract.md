# Provider contract and verification

Source: Vanguard documentation supplied by the user from https://etymologyexplorer.com/vanguard. It names staging as the base URL while its old hyperlinks use dev. The user's successful staging autocomplete and an independent GitHub runner probe confirm staging reads without a token.

On 2026-10-27 the runner received HTTP 200 for autocomplete(word=David), get_details(ids=195188), get_connections(id=195188,direction=ance), and get_trees(ids=195188). Complete observed JSON is checked into tests/fixtures; it is test evidence, not an asserted production schema for every word. The probe's job logs provide the original retrieval record.

The client implements nine documented data reads. All parameter values are bounded/validated. Other directions, batch-ID encodings, pronunciation media formats, revision/provenance guarantees, quotas and reuse license are not documented and are not invented. Provider confidence, frequency and deployment values retain their original meaning and are not promoted to verified historical facts or usage statistics.

Remaining undocumented payloads are preserved as bounded JSON. The API can evolve; malformed autocomplete raises invalid_response. No provider token is sent, including a token seeded into the local compatibility endpoint.

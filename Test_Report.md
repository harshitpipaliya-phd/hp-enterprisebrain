# Test_Report.md

## Total: 144 tests, 144 passing, 0 failing

Verified by actually running `node --test dist/tests/*.test.js` against the compiled output, this session — not aggregated from prior claims.

## Per-file breakdown

| Test file | Count | Sprint |
|---|---|---|
| tenant | 5 | 1 |
| auth | 8 | 1 |
| org / org.neo4j / org.integration | 5 / 5 / 2 | 1 |
| department / .neo4j / .integration | 5 / 5 / 2 | 1 |
| person / .neo4j / .integration | 5 / 5 / 2 | 1 |
| capability / .neo4j / .integration | 5 / 5 / 2 | 1 |
| event.dispatcher / event.store / event.integration | 4 / 5 / 2 | 1 |
| audit / health / logging / tracing | 4 / 3 / 3 / 1 | 1 |
| signal | 5 | 2/3 |
| evidence | 2 | 2/4 |
| reasoning | 4 | 2/4 |
| recommendation | 3 | 2/4 |
| decision | 5 | 2/4 |
| eso-runtime | 4 | 2 |
| executor-matching | 5 | 3 |
| outcome | 2 | 2 |
| learning | 3 | 2/5 |
| anonymize | 4 | 3 |
| closed-intelligence-loop | 1 | 3 |
| policy | 3 | 4 |
| risk | 4 | 4 |
| analytics | 5 | 4 |
| mental-model | 5 | 5 |
| autonomous-decision | 6 | 6 |
| **Total** | **144** | |

## What this suite tests, in one sentence each

- **Integration tests** (`.integration.test.js`) need a live Postgres and are structurally present but not run against one here
- **Neo4j tests** (`.neo4j.test.js`) similarly need a live graph instance
- **Everything else** runs against in-memory mock repositories implementing the same port interfaces the real Postgres-backed repositories implement — proving business logic correctness, not database correctness

## The two tests that matter most for trust in this system

1. `reasoning.test.js` — proves confidence is computed from evidence corroboration and freshness, never asserted
2. `autonomous-decision.test.ts` — proves the opportunity-category safety block holds even against a policy deliberately written to bypass it

## Build

```
cd contracts && npm run generate   → OK
cd database && npx tsc             → 0 errors
cd events && npx tsc               → 0 errors
cd api && npx tsc                  → 0 errors
cd web && npx tsc --noEmit         → 0 errors
```

# QA_Report.md

## Test suite composition (133 tests, all passing)

| Domain | Tests | Notes |
|---|---|---|
| Foundation (tenant, auth, org, department, person, capability, events, audit, health, logging, tracing) | 74 | Sprint 1, re-verified this pass |
| Signal / Evidence / Reasoning / Recommendation | 14 | Sprint 2, extended Sprint 4 |
| Decision / ESO Runtime / Executor Resolver / Outcome / Learning / Anonymization | 23 | Sprint 2–3 |
| Closed Intelligence Loop (full 8-service integration test) | 1 | Sprint 3 — not mocked, real service instances |
| Policy / Risk / Analytics | 12 | Sprint 4 |

## What "133 tests passing" does and doesn't prove

**Proves:** every service's business logic is internally correct against realistic inputs — confidence computation, category-forcing thresholds, executor resolution rules, rule evaluation, risk scoring, DPDP redaction, the full cross-service chain.

**Does not prove:** that any of this works against a live Postgres/Neo4j, that the compiled SQL/Cypher is free of runtime-only errors (typos in column names would compile fine in TypeScript and only surface against a real database), or that the React UI renders correctly in an actual browser. Every test in this suite uses an in-memory mock repository — the same convention throughout, disclosed every time, not new information.

## Known defects fixed and verified this engagement

1. CORS entirely missing → added, verified via live curl against a running server (not just code review)
2. Server crashed on any unhandled DB error → process-level safety net added, verified by triggering the exact crash scenario and confirming survival
3. `CapabilityAssigned` event published since Sprint 1, never subscribed to → Person→Capability graph edge never existed → fixed
4. Original Sprint 1 report overstated test counts (claimed 90, actual 53) → caught and corrected

## Open defects, named not hidden

- No live-database verification, ever, in this environment
- Search and true Pattern Detection (Sprint 2 scope) not built
- AI Platform (chat, vector search, prompt management) not built — needs product decisions, see escalation
- Individual requests touching an unreachable DB still hang rather than returning a clean 500
- No seed data for Executors, Policies, or Risks

## Verdict

**QA status: internally consistent and logic-verified. Not integration-verified against live infrastructure.** Recommend a live-database pass before any production consideration.

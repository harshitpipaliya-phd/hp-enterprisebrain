# Known_Issues.md

## Verified real, currently open

1. **No live Postgres/Neo4j has ever been available in this environment, across all 6 sprints.** Every migration and Cypher statement is structurally correct and pattern-matched against tested code, but none have executed against a real database instance. This is the single largest gap between "tests pass" and "production ready."
2. **A request that touches an unreachable database hangs rather than returning a clean error.** The process no longer crashes (fixed during the runtime pass), but the individual request has no timeout/circuit-breaker.
3. **No seed data** for Executors, Policies, Risks, or MentalModels — the logic is real and tested, but nothing populates these tables in a fresh environment.
4. **Search and true Pattern Detection** (original Sprint 2 scope) were never built — found and named during the Sprint 2 verification pass, not fixed.
5. **AI Platform** (chat, vector search, prompt management, streaming) — zero implementation, needs vendor/infra decisions (see prior escalation).
6. **Department Brain / Performance Brain** — needs a decision on how Decisions/Signals attribute to organizational units (see `SPRINT5_ARCHITECTURE.md`).
7. **Multi-Agent, Digital Twin, Simulation, Predictive Intelligence, Workflow/Optimization Engines** — not started, need real product/governance decisions (see `SPRINT6_ARCHITECTURE.md`).
8. **Policy rule evaluation supports flat comparisons only** — no AND/OR composition within a single rule.
9. **The Decision Dashboard has no dark mode, charts, or responsive design** — extended with real data instead of redesigned.

## Fixed during this engagement, for reference

- CORS entirely missing → fixed, verified live against a running server
- Server crashed on any unhandled DB error → process-level safety net added
- `CapabilityAssigned` event published since Sprint 1, never subscribed to → Person→Capability graph edge now actually created
- Frontend had no way to acquire a token → dev-token + Login flow added (caught locally, incorporated)
- Original Sprint 1 completion report overstated test counts (claimed 90, actual 53) → caught and corrected

## Not an issue, a deliberate boundary

Everything in item 5–7 above was investigated and explicitly not built because doing so would have required inventing product/governance decisions rather than extending existing architecture — consistent with this engagement's explicit authorization boundary (engineering decisions only, business decisions escalated).

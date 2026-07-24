# HP Enterprise Brain — Enterprise Architecture Bible

**Status legend:** [DONE] Real, implemented · [PARTIAL] Real but incomplete · [PLANNED] Designed, not built · [VISION] Aspirational.

This document complements PRODUCT_BIBLE.md (product/module framing) with the engineering angle: how the code is actually structured, what patterns to follow when extending it, and what's genuinely untested or unresolved. Facts reused from the same verified audit (48 tables, 39 route modules, 17 graph labels, 251+/26 tests) — the codebase hasn't changed between documents.

---

## Section 1 — System Architecture [DONE]

Stack: React/Vite (frontend) to Express/TypeScript (api/) to Postgres (business data) + Neo4j (relationship/traversal data), ESM monorepo with workspace packages (@hpbrain/database, @hpbrain/events).

Design rationale, evidenced not asserted: Postgres and Neo4j are used for genuinely different jobs, not redundantly — Postgres holds the authoritative record, Neo4j answers "what connects to what" queries a relational join would make painful (Signal to Evidence to Recommendation to Decision to Outcome chains, multi-hop). This is why Global Search deliberately keeps two backends instead of forcing one — they answer different question shapes.

Component responsibility boundary: api/src/<domain>/ owns one bounded context (person, capability, kasba, career, etc.) — routes, service where business logic needs a layer, and no cross-domain imports except through @hpbrain/database repositories, the only shared data-access surface.

## Section 2 — Frontend Architecture [DONE]

- Structure: web/src/components/<domain>/ mirrors backend domains. web/src/api/<domain>.ts — one thin client file per domain.
- Routing: not a router library — App.tsx holds a View string union and conditionally renders; navigation is a single navigate(view, entity?) function. A real, deliberate simplicity choice — appropriate at current scale (~35 screens), would need real routing if deep-linking needs grow.
- State: local component state throughout; no global store. ToastProvider and theme (useTheme) are the only two context providers.
- Design system: inline styles referencing a theme object from useTheme() — real light/dark support, no CSS framework, no formal spacing/typography scale — a real, named gap if visual consistency at scale becomes a priority.

## Section 3 — Backend Architecture [DONE]

Real, consistent pattern for every domain (verified by having been followed repeatedly across this project's development): migration (database/migrations/0NN_name.sql) to repository (database/src/<name>.repository.ts, exported from index.ts) to route file (api/src/<domain>/<name>.routes.ts, authMiddleware + requireRole applied via router.use()) to registered in app.ts.

Validation: zod schemas at the route boundary, consistently — every POST/PUT/PATCH route validates with safeParse before touching a repository.

A real, repeated bug class worth naming for future engineers: route registration order matters in Express — a literal path registered after a wildcard path at the same segment depth gets silently swallowed by the wildcard. This has been a real, found-and-fixed bug more than once in this codebase's history. Rule: register literal-segment routes before wildcard routes at the same depth, always.

Events/Queues: event_store + dead_letter_queue + consumer_state tables — real event sourcing, with retry and DLQ.

## Section 4 — Knowledge Graph Architecture [DONE]

17 real node labels (Organization, Department, Person, Capability, CapabilityAssignment, Signal, Evidence, ReasoningStep, Recommendation, Decision, Outcome, Learning, Executor, Policy, Risk, MentalModel, Case, Hypothesis), synced from Postgres.

The one non-negotiable pattern: every Cypher query includes tenantId in its MATCH. This isn't a style guide suggestion — a CI workflow greps every changed Cypher file and fails the build if a MATCH lacks it. A new engineer should treat a failing tenant-isolation check as a correctness bug, not a lint nag to suppress.

Traversal patterns: Graph Explorer's real queries demonstrate bounded-depth traversal from a starting node, not unbounded patterns, for real performance reasons at scale (never load-tested, but the query shape avoids the obvious pitfall).

## Section 5 — Database Architecture [DONE]

48 real tables across 28 migrations — the migration files are the authoritative field-level reference, not re-transcribed here.

Real conventions, consistent across every table: tenant_id on every row, created_date as TIMESTAMPTZ, UUIDs as TEXT primary keys generated in application code, not DB-generated — deliberate, so a repository can return the created row's ID without a round-trip.

Append-only ledgers, a real architectural pattern: capability_proficiency, hypotheses, reasoning_steps, event_store — never UPDATEd, only INSERTed, so history is a query, never a separate audit table.

Migration strategy: sequential numbered .sql files, no rollback scripts exist — a real gap for anything beyond an early-stage project.

## Section 6 — API Architecture [DONE] (REST/auth), [PARTIAL] (pagination/versioning)

Real: REST, JSON, JWT Bearer auth or x-api-key header. Errors are consistently structured JSON with real HTTP status codes.

Not real: API versioning beyond a single /api/v1/ prefix. Pagination — most list endpoints return everything up to a fixed LIMIT, not true cursor/offset pagination. Filtering — ad hoc per-endpoint query params, no consistent filter DSL.

## Section 7 — AI Architecture [DONE] (infrastructure), [PARTIAL] (real usage — nothing configured)

Real provider abstraction (4 adapters + factory switching on AI_PROVIDER env var). Real governance logging. Real Reasoning Engine — deterministic, not AI-dependent, a genuinely different thing from the AI provider layer despite the similar name.

Human oversight, the one hard safety invariant in this codebase: opportunity-category Recommendations cannot auto-approve under any Policy, checked in code, tested adversarially.

## Section 8 — Security Architecture [DONE] (auth/RBAC), [PLANNED] (SSO/MFA)

JWT, API keys (hashed, shown once), RBAC, Helmet, rate limiting, structured logging. Tenant isolation CI-enforced for Neo4j — not currently enforced by an equivalent automated check for Postgres, a real named gap (the one Postgres tenant-scoping bug found this session was caught by manual review, not CI).

Threat model: none exists as a formal document. Real mitigations exist for specific things (parameterized queries, secrets never logged, hashed API keys) but this is defense-in-depth by convention, not a structured exercise.

## Section 9 — Scalability [PLANNED]

No caching layer, no queue beyond the DLQ pattern, no horizontal-scaling configuration, no background job scheduler beyond the synchronous Task Orchestrator. Honestly appropriate not to have built this yet — scaling work before the system has run against a live database or had a second real tenant would solve a problem that doesn't exist.

## Section 10 — Testing Architecture [DONE] (unit), [PLANNED] (integration/E2E/perf)

251+ backend tests, 26 frontend. Real, consistent convention: pure functions are unit-tested, including edge cases verifying null (unassessed) never collapses into 0 (assessed-and-failing). Repository-backed CRUD is not unit-tested without a live database — a stated, consistent limitation.

The single largest real gap: a live-database integration CI workflow exists but has never actually executed against real Postgres/Neo4j. Every green checkmark in this project's history has been against mocks or pure functions. A new team should treat this as unverified, not assumed-working.

## Section 11 — Deployment Architecture [PARTIAL]

Docker Compose exists — real, runnable locally. No staging/production environment has ever existed. CI/CD: workflow files exist, only tenant-isolation is confirmed to have real teeth. Monitoring, backup, recovery: none built — appropriately, for a system never deployed.

## Section 12 — Extension Framework [DONE] (pattern is real and consistently followed)

How a new module is actually added, verified against real history:
1. Migration: additive only — never ALTER a column type or drop one in this codebase's history.
2. Repository: exported via index.ts.
3. Business logic (if any beyond CRUD): a pure, side-effect-free function — the real standard for anything resembling scoring or detection logic, specifically because pure functions are the only thing this codebase can unit-test without a live database.
4. Routes: authMiddleware + requireRole, zod validation on every mutating endpoint, literal routes before wildcard routes at the same depth.
5. Registered in app.ts.
6. Frontend client: one file per domain.
7. Screen (if warranted): wired into App.tsx's View union and Sidebar.tsx's NAV_ITEMS.

Coding standard enforced by repeated real practice: before building anything, check whether it already exists — this codebase's development history includes multiple instances of discovering a requested feature was already real, and choosing not to duplicate it.

## Section 13 — Repository Audit

Completed: everything in Sections 1-7 marked DONE. Incomplete, honestly enumerated: API versioning/pagination strategy, formal threat model, Postgres-side CI tenant-isolation check, any real caching/scaling infrastructure, live-database CI verification.

Architecture risks, ranked:
1. Live-database behavior is entirely unverified — the highest-leverage next action for any new engineer.
2. No down-migration strategy — a bad migration in a real environment has no scripted rollback.
3. Postgres tenant-scoping has no automated check (unlike Neo4j) — relies on code review, which has already once failed to catch a real instance.

Recommendation, in order: run the existing CI pipeline against a real database, then add a Postgres-side tenant-isolation check mirroring the Neo4j one, then revisit pagination/versioning once there's a real second consumer of these APIs to design for.

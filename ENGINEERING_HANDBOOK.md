# HP Enterprise Brain — Internal Engineering Handbook

See PRODUCT_BIBLE.md (what exists, product framing) and ARCHITECTURE_BIBLE.md (system architecture, real audit) first — this document does not repeat their content. It covers what those two didn't: coding conventions, per-artifact developer guides, and rules for AI-assisted development.

Status legend: [DONE] · [PARTIAL] · [PLANNED] · [VISION]

## A correction, stated before anything else

Part 4 of the request asks "Why Laravel?" This project is not built on Laravel. It is Express + TypeScript on the backend, verified by direct repository inspection (zero .php files exist anywhere in this codebase). Answering "why Laravel" would mean inventing an architecture decision that was never made. The real technology choices are documented in ARCHITECTURE_BIBLE.md Section 1, with real rationale (Postgres for authoritative records, Neo4j for multi-hop traversal) rather than a decision this project never faced.

---

## Part 2 — Coding Standards [DONE], extracted from real, consistent practice

Naming: snake_case for Postgres columns/tables, camelCase for TypeScript, PascalCase for types/interfaces/React components. Repository classes: <Entity>Repository. Route files: <domain>.routes.ts. Migration files: 0NN_<description>.sql, sequential, never renumbered after merge.

Folder conventions: api/src/<domain>/ per bounded context; database/src/<entity>.repository.ts flat since repositories are the shared cross-domain surface; web/src/components/<domain>/ and web/src/components/workspace/ for top-level screens.

Component conventions: every workspace screen takes tenantId as a prop, fetches its own data in useEffect, and shows explicit loading/error/empty states — real, followed consistently across ~35 screens.

Repository conventions: every method takes tenantId as its first parameter (Postgres) or filters by it in every Cypher MATCH (Neo4j) — no exceptions found in this codebase's real history.

API conventions: authMiddleware + requireRole via router.use() at the top of every route file; zod validation on every mutating endpoint; literal-segment routes registered before wildcard routes at the same depth.

## Part 3 — Developer Guides: How to Add X [DONE — the real pattern, per artifact]

New Module: migration to repository (database/src/) to pure business-logic function if any scoring/detection is involved, kept side-effect-free for testability, to route file with zod validation to register in app.ts to frontend API client to screen (if warranted) to wire into App.tsx's View union and Sidebar.tsx's NAV_ITEMS.

New Digital Twin: [PARTIAL] — there is no separate "Twin framework" to extend. The real pattern (Person Twin) is one aggregation endpoint that composes existing repositories' data into one JSON response. To add a new twin: identify what already exists across repositories for that entity, write one composing endpoint, and resist creating new schema unless a genuine gap is found by checking existing repository methods first.

New Intelligence Engine (scoring/detection): write it as a pure function first (input data in, findings out, zero repository/database access inside the function itself). This is the only way this codebase can unit-test the logic without a live database. The route layer fetches real data and passes it to the pure function.

New API: see Part 2. Prefer extending an existing route file over creating a new one if the new endpoint is a natural extension of an existing domain.

New Knowledge Graph Node: add the label to the graph sync service, add a real Cypher constraint/index migration, confirm the tenant-isolation CI check passes — it will fail the build if any new query lacks tenantId, which is the intended safety net.

New Agent / Brain Studio Widget: [PLANNED/DECLINED] — both were explicitly evaluated and declined as out of scope for the current architecture. See ARCHITECTURE_BIBLE.md and this project's own development history for the specific reasoning. Do not build either without revisiting that reasoning first.

New Report: compose existing data the same way Command Center does — parallel fetches from existing, already-tested endpoints. Avoid new backend aggregation logic unless the specific number genuinely doesn't exist anywhere yet.

## Part 5 — Code Generation Rules for AI Coding Assistants [DONE, earned this session]

Drawn from real mistakes made and caught during this project's actual development:

1. Before writing any code, check whether it already exists. This codebase's real history includes many instances where a requested feature turned out to already be built.
2. Verify route ordering when adding a literal-path route to a file that has wildcard routes at the same depth. A literal route registered after a wildcard one is silently unreachable — a real, repeated bug.
3. After any large-block edit, re-view the file and confirm the enclosing function/class declaration wasn't accidentally deleted along with it. This happened twice in this codebase's real history. Check immediately, don't wait for the compiler.
4. When a change touches shared middleware (auth, validation) that gates many routes, run the full test suite immediately after the change, before adding anything new.
5. Never default an unassessed/unknown value to zero when null is the honest answer. Every scoring function in this codebase is tested specifically for this distinction.
6. Prefer a pure, testable function over inline logic in a route handler whenever the logic does more than trivial mapping. This is what makes ~250 backend tests possible without a live database.
7. Do not fabricate domain content this project has no authority over — accreditation criteria, labour-market statistics, clinical guidance, or anything where a wrong "helpful-sounding" answer could cause real harm to a real person's decision. Build the structure; leave the content for a real domain expert.

## Part 6 — Quality Standards [PARTIAL]

Definition of Done, as actually practiced: compiles clean across all 4 workspaces, full test suite passes, new pure logic has real edge-case tests, no existing behavior silently changed without being called out.

Missing, honestly: no formal PR review checklist exists (no git PR process exists at all). No accessibility checklist beyond ad hoc aria-labels. No performance checklist — nothing has been load-tested.

## Part 7 — Automation [PLANNED — genuinely minimal today]

Real: two GitHub Actions workflow files exist; only tenant-isolation.yml is confirmed to have real teeth.

Not real: no git repository with commit history exists in this working copy — branch strategy, versioning, and release checklist are all [PLANNED] in the fullest sense, not partially built. Worth a new team's attention before any process guidance here can be followed for real.

## Part 9 — Developer Portal [PARTIAL]

Getting Started / Architecture / API / Knowledge Graph / Digital Twins are all real content, spread across the two Bible documents and this handbook — not yet consolidated into a single navigable portal. Agents, Brain Studio, Marketplace: [DECLINED/PLANNED], nothing built to document.

## Part 10 — Repository Health Report [DONE, real checks run]

- Dead code: `database/src/log.repository.ts` (LogRepository) is unused — not called from any route, not exported from the package index, no consumer anywhere in api/src or events/src. Found during Postgres tenant-isolation checker triage (its flagged findings turned out to be dead code, not live bugs). Correction to this document's earlier claim of "none found" — that was accurate for what a targeted search covered at the time, not for what a deeper investigation triggered by an unrelated check would surface. Left in place, not deleted, since removing it is a product decision (was correlation-ID log search intended to ship as a feature, or should the file go) not mine to make unilaterally.
- Duplicate code: one real instance found and fixed during this engagement (a signal-to-recommendation lookup duplicated across two reasoning-engine routes, extracted into a shared helper the same session it was introduced).
- Missing tests: consistent, stated pattern — repository-backed CRUD has none, by convention.
- Security issues: Postgres lacks the automated tenant-isolation check that Neo4j has — the highest-priority real finding in this report.
- Performance issues: unknown — nothing has been load-tested.
- Recommended refactor, single highest priority: none needed architecturally. The recommended next action is operational: run the existing CI pipeline against a real database for the first time.

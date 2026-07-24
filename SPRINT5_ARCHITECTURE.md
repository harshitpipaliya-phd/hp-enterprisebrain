# SPRINT5_ARCHITECTURE.md

## Why this document exists

No specification for "Sprint 5: Enterprise Brain" (Executive/Department/Company/Knowledge/Learning/Skill/Performance Brain) exists anywhere in this repository — confirmed by search, not assumed. Per the directive's own protocol for this situation: derive it from the existing repository, validate against it, implement, document. This is that document, written before the code, not after.

## Assumptions

The seven named "brains" are **lenses over one existing graph and one existing set of engines, not seven new subsystems.** This is the only interpretation consistent with "extend, don't invent a different product" — inventing seven separate new domains with no data model justification would be exactly the forbidden move.

## Mapping, and what's actually new

| Name | What it maps to | New this sprint? |
|---|---|---|
| Skill Brain | The existing KASBA Capability model (Sprint 1) | No — already exists, not touched |
| Company Brain | The existing Intelligence Workspace + Decision Analytics (Sprint 2/4) | No — already exists |
| Knowledge Brain / Learning Brain | **MentalModel** — had a table and a Neo4j constraint since Sprint 2, with `ReasoningStep`/`Learning` foreign keys and graph relationships already declared, but no repository, service, or route ever created or updated a record. This sprint implements it for real. | **Yes — this is the real work** |
| Executive Brain | New: a cross-domain rollup endpoint (`/analytics/:tenantId/executive-summary`) combining statistics, top risks, and organizational knowledge (MentalModels) in one call | **Yes** |
| Department Brain, Performance Brain | **Not built.** See "What's deliberately not done" below. | No |

## Design: Mental Model reinforcement

A `MentalModel` is one active belief/heuristic per `domain` per tenant (e.g. `"sales-strategy"`, `"fee-collection"`). When `LearningService.extract()` produces a reusable Learning **and the caller supplies a `domain`**, it:

1. Looks for an active MentalModel in that domain
2. If none exists, creates the first one with the (already DPDP-anonymized) pattern
3. If one exists, reinforces it: appends the pattern, blends confidence as `existing×0.7 + new×0.3` (so a model can still shift if newer evidence disagrees — not frozen after its first reinforcement), increments `reinforcementCount` and `version`

This is opt-in per extraction (no `domain` = no reinforcement, existing behavior unchanged) and additive (no existing column, table, or method signature was altered — only new optional parameters).

## Consistency check against the existing repository

- Reuses the exact repository/service/routes/events/graph-sync pattern every other entity in this repo follows — no new architectural pattern introduced
- The graph relationships this closes (`(ReasoningStep)-[:APPLIES]->(MentalModel)`, `(Learning)-[:UPDATES]->(MentalModel)`) were declared in Sprint 2's `graph.sync.service.ts`, not invented now
- `tenantId` scoping present on every query, consistent with every other table

## What's deliberately not done, and why

**Department Brain and Performance Brain were not built.** A department-scoped or person-scoped analytics rollup would need to join Signal/Recommendation/Decision back through Person → Department, but none of those intelligence-layer tables carry a `personId` or `departmentId` today (only `orgId` on Signal). Adding those columns is a legitimate engineering decision I could make — but backfilling *which* department a Decision "belongs to" for existing/future records touches how the whole intelligence layer attributes work to organizational units, which is closer to a product decision (does a Decision belong to the department of the person who approved it? The department the Signal originated from? Something else?) than an inferable engineering default. Flagged rather than guessed.

## Verdict

Implemented: MentalModel (Knowledge/Learning Brain), Executive Summary rollup (Executive Brain). Confirmed already-satisfied by existing code: Skill Brain, Company Brain. Not built, needs a product decision: Department Brain, Performance Brain attribution model.

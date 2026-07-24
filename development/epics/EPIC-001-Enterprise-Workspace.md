# EPIC-001 — Enterprise Workspace

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Establish the multi-tenant organizational foundation that every other Epic assumes: tenants, people, organizational units, roles, and the persona/context surface that scopes all downstream intelligence. The Enterprise Workspace is the trust and identity boundary inside which evidence, signals, cases, and ESOs live.

## Business Problem

HP Enterprise Brain must serve multiple distinct organizations (and units within them) without leaking data or context across boundaries. Without a hardened tenant + org + role foundation, every downstream capability — evidence ingestion, case handling, ESO execution — would have to re-solve identity, authorization, and scoping from scratch, and would risk cross-tenant contamination.

## Business Value

- A single, governed identity and tenancy layer that lets the product scale to many enterprises on one codebase.
- Deterministic scoping: every graph query, API call, and ESO execution is implicitly bounded by tenant and role.
- Foundation for personalization (per-person memory, EPIC-009) and governance (bounded autonomy, EPIC-007).

## Users

- **Tenant Administrator** — provisions the org, units, and roles.
- **Org Lead / Manager** — assigns roles, views unit-level intelligence.
- **Individual Contributor** — operates within a role and persona; the subject of personalization.
- **System / Platform Operator** — manages environments (`infra/`).

## Features

- F-001.1 Tenant provisioning and isolation boundary.
- F-001.2 Org unit hierarchy (`OrgUnit` nodes).
- F-001.3 Person and Role management (`Person`, `Role` nodes).
- F-001.4 Persona / context scoping (feeds `contracts/eso/eso.schema.yaml` Block 11 `memory.scope`).
- F-001.5 Role-based access that gates ESO trust levels (Block 5 `executorPolicy.trustLevels`).

## Dependencies

- `api/` (Laravel — auth, tenancy, REST) is the implementing owner.
- `graph/migrations/001_constraints.cypher` defines `Person`, `OrgUnit`, `Role` node constraints with mandatory `tenantId`.
- `infra/` for environment provisioning.
- No upstream product dependencies — this is the root Epic.

## Required Data

- Tenant record (id, configuration).
- `Person` (id, tenantId), `OrgUnit` (id, tenantId), `Role` (id, tenantId) — per `graph/migrations/001_constraints.cypher`.
- Role → capability/trust mappings that later constrain ESO autonomy.

## Screens

> Product planning only — screen intent, not UI. Detailed wireframes live in `development/wireframes/` and `development/screens/`.

- Workspace / tenant home.
- Org unit tree.
- Role & persona management.
- User directory.

## Acceptance Criteria

1. A new tenant can be provisioned and isolated such that no Cypher query can read another tenant's `Person`, `OrgUnit`, or `Role` nodes (exit criterion #6 in `graph/README.md`).
2. Every graph node created by this Epic carries a non-null `tenantId` (enforced by `graph/migrations/001_constraints.cypher`).
3. Roles can be assigned to persons and resolve to a trust ceiling consumable by EPIC-008 execution.
4. Auth + tenancy REST surface exists in `api/` and is the only entry point for identity operations.

## Future Enhancements

- Delegated admin and sub-tenant federation.
- Persona marketplaces / shared persona templates across tenants.
- Org-unit-level learning aggregation (links to EPIC-009).

## Development Status

**Implemented.** Organization/Department/Person/Capability fully built, tested, and have working UI screens since Sprint 1.

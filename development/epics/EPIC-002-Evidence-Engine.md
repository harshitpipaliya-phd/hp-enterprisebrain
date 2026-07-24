# EPIC-002 — Evidence Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Ingest, store, and serve **provenance-bearing facts** that become the durable memory of the system. The Evidence Engine is the write-back and read surface for every observed fact, and it is what makes intelligence compound (Principle P6 in `contracts/eso/eso.schema.yaml` Block 9).

## Business Problem

Without a single, governed evidence substrate, the system cannot reason over history, cannot audit decisions, and cannot learn. Facts arrive from many executors (human, agent, software) and must be captured once, immutably, with full provenance so that any conclusion can be traced to its sources.

## Business Value

- A trustworthy, append-only record of everything the organization knows and observes.
- Provenance for every recommendation and decision (auditability, compliance).
- The compounding substrate that powers EPIC-005 (reasoning), EPIC-006 (recommendation), and EPIC-009 (learning).

## Users

- **Evidence Contributors** — executors (human/agent/software) that produce facts via ESO `evidenceHooks`.
- **Analysts** — query and inspect evidence.
- **Auditors** — trace conclusions back to source evidence.

## Features

- F-002.1 Fact ingestion with mandatory provenance (source, system, method, timestamp, confidence, agent, type, version, hash — per `graph/README.md` rules).
- F-002.2 Append-only Evidence ledger (`Evidence` node, `graph/migrations/001_constraints.cypher`).
- F-002.3 Evidence read/query API (consumer of `api/`).
- F-002.4 Write-back from ESO execution (`contracts/eso/eso.schema.yaml` Block 9 `evidenceHooks.mustLog`).
- F-002.5 Confidence scoring and provenance lineage.

## Dependencies

- `graph/` — `Evidence` node constraints + provenance rules (`graph/README.md`).
- `events/` — outbox / append-only ledgers (Rajesh).
- `contracts/eso/eso.schema.yaml` Block 9 (`evidenceHooks`) defines what must be logged.
- EPIC-001 (tenant + provenance scoping).

## Required Data

- `Evidence` node: id, tenantId, source, system, method, timestamp, confidence, agent, type, version, hash (`graph/README.md` provenance rule — cannot be backfilled).
- Linkage to the ESO and Case that produced it.

## Screens

> Product planning only.

- Evidence ledger / stream.
- Evidence detail with full provenance.
- Provenance trace (fact → source).

## Acceptance Criteria

1. Every ingested fact carries the full provenance tuple and cannot be backfilled (`graph/README.md`).
2. Evidence is append-only; no UPDATE path exists (`graph/README.md` ledger rule).
3. ESO executions emit the `mustLog` set from Block 9 (`executor, context, artifacts, score, duration, exceptions`).
4. All evidence is queryable only within its `tenantId` boundary.

## Future Enhancements

- Cross-tenant anonymized evidence pools (post-v1).
- Automated provenance conflict resolution.
- Evidence quality scoring feeding executor trust (EPIC-007/008).

## Development Status

**Backend implemented, frontend missing.** `api/src/evidence/` real and tested (2 tests) since Sprint 2 — but zero UI presence anywhere. First gap identified in the ground-truth audit; frontend being built now.

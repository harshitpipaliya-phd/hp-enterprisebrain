# Architecture_Report.md

## Layers, as actually built (not as originally named)

```
Foundation:    Tenant, Auth/RBAC, Organization, Department, Person, Capability
Intelligence:  Signal → Evidence → Reasoning → Recommendation
Decision:      Decision (confidence/explanation/trace) → Executor Resolver → ESO Runtime
               → Outcome → Learning (DPDP-anonymized)
Governance:    Policy Engine (versioned, structured rule evaluation — no eval/Function)
               Risk Engine (deterministic probability × impact scoring)
Enterprise:    Mental Model (organizational learning, domain-scoped reinforcement)
               Executive Summary (cross-domain rollup)
Autonomy:      Policy-gated auto-approval (opt-in, hard-blocked for 'opportunity' category)
```

## The chain, end to end (proven by `closed-intelligence-loop.test.ts`)

Signal → Evidence (provenance-carrying) → Reasoning (confidence = f(evidence confidence × freshness)) → Recommendation (category forced to `watch` below 0.4 confidence) → Decision (human or `system:policy-engine`, always with rationale/trace/explanation) → ESO Runtime (execution lifecycle, rollback-capable) → Outcome → Learning (DPDP-anonymized) → optionally reinforces a Mental Model.

## Security decisions worth flagging explicitly

- Policy rule evaluation is field/operator/value comparison, **not** an eval-based expression language — deliberately, to avoid a code-execution vector
- DPDP anonymization runs before any Learning is marked reusable — emails, phone numbers, ID-like tokens, and name-like sequences are redacted
- Autonomous approval has one non-overridable hard rule (opportunity category), enforced before policy evaluation runs, tested adversarially

## Data model

15 Postgres tables, 15 Neo4j node labels, 14 event domains. Every table is `tenant_id`-scoped; every Cypher query is `tenantId`-scoped — enforced by CI (`tenant-isolation.yml`), not just convention.

## What's dormant-turned-real this engagement

Two entities existed in the schema/graph since Sprint 2 with zero implementation, found by direct code search rather than assumption, and made real:
- `MentalModel` (Sprint 5)
- `PolicyService.evaluate()` had logic but no caller until Sprint 6 wired it into the Decision flow

## Full inventory

See `Build_Report.md` for build commands, `QA_Report.md` for test breakdown, `Known_Issues.md` for what remains.

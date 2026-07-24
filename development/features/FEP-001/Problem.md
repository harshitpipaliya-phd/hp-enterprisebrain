# FEP-001 — Problem Statement

## Problem

HP Enterprise Brain captures organizational intelligence across many entities (`Person`, `OrgUnit`, `Role`, `Capability`, `Evidence`, `Case`, `ESO`, `Executor`, `Outcome`, `Learning`) — all `tenantId`-scoped per `graph/migrations/001_constraints.cypher`. But there is **no single, tenant-scoped surface** that shows the health of the organization: where capabilities are weak, where processes break, where coordination fails.

Without an Organization Health Dashboard:

1. Leadership cannot see organizational health in one place — they must query individual entities.
2. Gaps detected downstream (EPIC-003 signals, EPIC-004 cases) have no consolidated home; they surface in isolation.
3. Root-cause classification (`contracts/taxonomy/root-cause.schema.yaml`, 8 families) is produced but never rolled up into an org-level view.
4. Recommendations (EPIC-006) and ESOs (EPIC-008) have no launch surface tied to the health they improve.
5. The tenant boundary (`tenantId`) exists, but its *contents* are invisible to operators.

This is a visibility gap inside the Enterprise Workspace (EPIC-001): the foundation exists, but the observability layer that makes it actionable does not.

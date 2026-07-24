# FEP-001 — Business Tests

> Business-scenario tests for the Organization Health Dashboard.

| # | Test | Expected |
|---|---|---|
| BT-01 | Tenant Administrator views whole-tenant health | sees all units; no cross-tenant data |
| BT-02 | Org Lead selects their subtree | sees only their `OrgUnit` + descendants; cannot see sibling units |
| BT-03 | Gap board renders 8 columns | exactly the families in `contracts/taxonomy/root-cause.schema.yaml` |
| BT-04 | Act on ESO above operator's trust ceiling | "Act" disabled; routed to EPIC-007 human approval |
| BT-05 | Gap already has an open Case | dashboard links to the existing `Case`/`Hypothesis`, does not spawn a duplicate |
| BT-06 | Provenance audit | Compliance Auditor can trace any score to its `Evidence` facts |
| BT-07 | No signals yet (EPIC-003 pending) | board shows positive empty state; dashboard still renders health from `Outcome`/`Learning` |

# FEP-001 — Permissions

## Permission Model

Permissions are derived from the role→trust model (F-001.5, ESO Block 5 `executorPolicy.trustLevels`). The dashboard itself is read-centric; permissions gate *scope* and *action routing*.

| Capability | Tenant Administrator | Org Lead | Individual Contributor | Compliance Auditor |
|---|---|---|---|---|
| View whole-tenant health | ✅ | ❌ (own subtree only) | ❌ (own unit) | ✅ (read-only) |
| Select org-unit scope | ✅ | ✅ (subtree) | ❌ | ✅ (read-only) |
| View provenance of facts | ✅ | ✅ | ✅ | ✅ |
| Route gap → open Case (EPIC-004) | ✅ | ✅ (subtree) | ❌ | ❌ |
| Trigger recommended ESO (EPIC-007/008) | bounded by trust ceiling | bounded by trust ceiling (subtree) | bounded by trust ceiling | ❌ |
| Export / audit view | ✅ | ❌ | ❌ | ✅ |

### Rules
- All permissions are evaluated **within `tenantId`**; cross-tenant permission does not exist.
- "Trigger ESO" never executes directly — it hands off to EPIC-007 (Decision Center) which enforces `trustLevels` (Block 5). The dashboard may only surface the action when the operator's effective autonomy ≥ the ESO's ceiling.
- Org-unit scoping follows `SCR-Org-Unit-Tree.md`: an Org Lead sees only their subtree; the Tenant Administrator sees all.

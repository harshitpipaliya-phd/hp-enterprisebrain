# Screen — Org Unit Tree

> Implementation-ready Screen Specification. Realizes **F-001.2 Org Unit Hierarchy** (EPIC-001). References engineering assets; no HTML/React.

---

## Purpose

Lets administrators and managers view and manage the tenant's organizational hierarchy as a tree, create/assign units, and scope intelligence to the right level. This is the structural backbone that downstream Epics (signals, cases, learning) read for scoping and roll-ups.

## Users

- **Tenant Administrator** — creates/restructures the org tree.
- **Org Lead / Manager** — views/manages their unit and sub-units, assigns members.
- **Individual Contributor** — sees their unit membership.

## Widgets

- Org tree panel (collapsible nodes, depth indicators).
- Unit detail drawer (name, type, parent, member count, attributes).
- Toolbar (Add Unit, Edit, Delete, Assign Members).
- Search/filter by unit name/type.
- Breadcrumb path of selected unit.

## Components

- `OrgTree` — recursive tree bound to `OrgUnit` nodes (parent refs).
- `UnitDetailDrawer` — reads selected `OrgUnit`.
- `MemberAssignmentList` — Person↔OrgUnit membership.
- `UnitTypeBadge` (division/department/team).

## Business Rules

- Every `OrgUnit` carries a non-null `tenantId`; nodes from other tenants are invisible (exit criterion #6).
- A unit may have exactly one parent (tree, not graph cycles); root unit owned by tenant.
- Deleting a unit requires re-parenting or emptying children; cannot orphan nodes.
- Member assignment is tenant-scoped and optionally role-scoped (F-001.3).
- Unit autonomy posture inherits tenant config (F-001.1) unless overridden.

## Navigation

- Entry: Tenant Home → "Org Units".
- Out: select unit → Unit Detail; "Assign Members" → Member Assignment (links F-001.3).
- Breadcrumb: Workspace / Org Units / [unit path].

## Actions

- **Add Unit** → create child under selected parent (F-001.2 flow).
- **Edit Unit** → rename/retype/re-parent.
- **Delete Unit** → with re-parent confirmation.
- **Assign Members** → open Member Assignment (Person ↔ OrgUnit).
- **Drill into unit** → scope signals/cases/learning later (EPIC-003/004/009).

## Error States

- **Save conflict** (concurrent edit): "Unit was modified elsewhere" with reload.
- **Cycle prevented**: attempting invalid re-parent shows inline error.
- **Permission denied**: non-Admin/Manager sees read-only tree.

## Loading States

- Tree skeleton while `api/` resolves `OrgUnit` set.
- Drawer spinner on unit selection.
- Optimistic add with rollback on failure.

## Empty States

- **No units yet**: "Create your first Org Unit" CTA (routes to Add Unit).
- **Unit has no members**: "No members assigned" with Assign CTA.

## Permissions

- View: any tenant member.
- Create/Edit/Delete/Assign: `Tenant Administrator` or `Org Lead` for that unit subtree (role gating F-001.5).
- All operations tenant-scoped.

## Related APIs

- `api/` (Laravel REST): `OrgUnit` CRUD; membership assignment; tree query. Consumed by `web/` org unit tree screen.

## Related Graph Nodes

- `OrgUnit` (id, tenantId) — primary; parent relationship `OrgUnit`→`OrgUnit`.
- `Person` (id, tenantId) — membership.

## Related AI Logic

- None on this screen. Org structure feeds unit-scoped roll-ups in EPIC-009 learning aggregation; no AI invocation here.

## Acceptance Criteria

1. A tenant-scoped `OrgUnit` tree of arbitrary depth renders and edits correctly.
2. Every unit shown belongs to the active tenant; no cross-tenant unit is reachable.
3. Member assignment persists and is reflected in counts; role/unit permission gates are enforced.
4. Invalid re-parent (cycle) is rejected with a clear error.

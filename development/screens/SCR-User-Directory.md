# Screen — User Directory

> Implementation-ready Screen Specification. Realizes **F-001.3 Person & Role Management** (EPIC-001). References engineering assets; no HTML/React.

---

## Purpose

Provides a searchable, tenant-scoped directory of people and their role assignments, and the management surface for creating persons, defining roles, and assigning roles (optionally unit-scoped). This establishes identity, attribution, and the role basis for autonomy gating (F-001.5).

## Users

- **Tenant Administrator** — creates persons, defines roles, assigns roles.
- **Org Lead / Manager** — assigns roles within their unit.
- **Individual Contributor** — views own record and teammates.

## Widgets

- Person list/table (name, unit, roles, status) with search + filters (by unit, role).
- Person detail drawer (identity, units, roles, linked personas F-001.4).
- Role catalog panel (defined roles, permission summary, trust ceiling).
- Toolbar (Add Person, Define Role, Assign Role, Bulk Assign).
- Role–trust indicator (ceiling per executor class, links F-001.5).

## Components

- `PersonTable` — bound to `Person` nodes + assignments.
- `PersonDetailDrawer` — identity, units, roles, personas.
- `RoleCatalog` — `Role` definitions + trust ceiling badge.
- `RoleAssignmentDialog` — Person ↔ Role (+ optional OrgUnit scope).
- `TrustCeilingBadge` — reflects Block 5 trust level.

## Business Rules

- Every `Person`/`Role` carries non-null `tenantId`; cross-tenant records invisible (exit criterion #6).
- A person's effective permissions = union of assigned roles.
- Role assignment may be scoped to an `OrgUnit` (F-001.2); unscoped = tenant-wide.
- Role → trust ceiling mapping (F-001.5) is displayed but editable only via Role & Persona Management.
- Identity operations are reachable only through `api/` auth surface.

## Navigation

- Entry: Tenant Home → "People".
- Out: select person → Person Detail; "Define Role"/"Assign Role" → dialogs (also reachable from Role & Persona Management).
- Breadcrumb: Workspace / People / [person].

## Actions

- **Add Person** → create `Person` in tenant.
- **Define Role** → create `Role` with permissions + default trust ceiling.
- **Assign Role** → Person ↔ Role (optional unit scope).
- **Bulk Assign** → multi-select persons → role.
- **Open Persona** → jump to F-001.4 persona assignment for that person.

## Error States

- **Duplicate external IdP id**: inline error on Add Person.
- **Role assignment conflict**: "Already assigned" with option to replace scope.
- **Permission denied**: non-Admin/Manager sees read-only directory.

## Loading States

- Table skeleton while `api/` resolves `Person` set + assignments.
- Drawer spinner on selection.
- Dialog submit spinner with optimistic row update + rollback.

## Empty States

- **No people yet**: "Add your first person" CTA.
- **No roles defined**: "Define a role to start assigning" CTA.
- **Filter returns none**: "No people match" with clear-filters action.

## Permissions

- View: any tenant member (own record always; others per role).
- Create/Define/Assign: `Tenant Administrator` or `Org Lead` (unit-scoped) per F-001.5.
- All operations tenant-scoped.

## Related APIs

- `api/` (Laravel — auth, tenancy, REST): `Person` CRUD, `Role` CRUD, assignment endpoints. The only entry point for identity operations. Consumed by `web/` user directory.

## Related Graph Nodes

- `Person` (id, tenantId) — primary.
- `Role` (id, tenantId) — primary.
- Relationships: `Person`→`Role`; `Role`→`OrgUnit` (scope).

## Related AI Logic

- None on this screen. Person/role identity feeds per-person `memory.scope` (F-001.4, EPIC-009) and trust gating (F-001.5, EPIC-007/008). No AI invoked here.

## Acceptance Criteria

1. Tenant-scoped person list renders with search/filter; no cross-tenant person visible.
2. Persons and roles can be created and assigned via `api/`; assignments resolve to permissions + trust ceiling.
3. Role scope (unit/tenant) is enforced and reflected in downstream gating.
4. Identity operations are only reachable through the `api/` auth surface.

# Screen — Tenant Home (Workspace)

> Implementation-ready Screen Specification. Realizes **F-001.1 Tenant Provisioning & Isolation Boundary** (EPIC-001). References engineering assets; no HTML/React.

---

## Purpose

The landing surface for a provisioned tenant. It confirms the tenant boundary is active, surfaces isolation status, and is the entry point to workspace administration (org units, people, roles, personas). It makes the `tenantId` isolation guarantee visible and operable.

## Users

- **Tenant Administrator** — primary operator; provisions and governs the tenant.
- **Platform Operator** — verifies environment/isolation status.
- **Org Lead / Manager** — enters their unit workspace from here.

## Widgets

- Tenant identity header (name, id, region, status badge).
- Isolation status panel (tenant-isolation CI status, node-count by type).
- Quick-stats tiles (Org Units, People, Roles, Active ESOs).
- Workspace navigation rail (Org Units, People, Roles & Personas, Settings).
- Recent activity feed (tenant-scoped events).

## Components

- `TenantHeader` — reads tenant record.
- `IsolationStatusCard` — reflects `.github/workflows/tenant-isolation.yml` pass/fail and the `tenantId` constraint.
- `StatTile` — counts per node type, all filtered by `tenantId`.
- `WorkspaceNavRail` — routes to sub-screens.
- `ActivityFeed` — append-only tenant events.

## Business Rules

- Every query behind this screen is implicitly scoped by `tenantId` (exit criterion #6, `graph/README.md`; enforced by `.github/workflows/tenant-isolation.yml`).
- No node from another tenant is ever addressable; cross-tenant navigation is impossible by construction.
- Tenant configuration profile (autonomy posture, default trust ceiling from F-001.1) is displayed read-only here; editing routes to Settings.
- Isolation failure (CI red) suppresses provisioning/activation actions and shows a banner.

## Navigation

- Entry: post-login tenant selection / default tenant landing.
- Out: Org Unit Tree, User Directory, Role & Persona Management, Tenant Settings.
- Breadcrumb: Workspace.

## Actions

- **Open Org Units** → F-001.2 screen.
- **Open People** → F-001.3 / User Directory screen.
- **Open Roles & Personas** → F-001.4/1.5 screen.
- **Provision sub-tenant** (future) → F-001.1 future improvement.
- **View isolation report** → expands `IsolationStatusCard`.

## Error States

- **Isolation CI failed**: red banner, provisioning/activation actions disabled, link to failing Cypher file.
- **Tenant record unavailable**: "Workspace unavailable" with retry; no partial tenant data shown.
- **Permission denied**: redirect to tenant selection (Administrator role required for admin actions).

## Loading States

- Skeleton `TenantHeader` + shimmer stat tiles while `api/` resolves tenant + counts.
- Inline spinner on `IsolationStatusCard` while CI status is fetched.

## Empty States

- **New tenant, no units/people yet**: illustrated empty state with "Create first Org Unit" CTA (routes to F-001.2).
- **No activity**: "No activity yet" with hint to provision structure.

## Permissions

- View: any authenticated member of the tenant.
- Admin actions (settings, provisioning): `Tenant Administrator` role (F-001.3 / F-001.5 trust gating).
- All actions tenant-scoped; no cross-tenant permission exists.

## Related APIs

- `api/` (Laravel — auth, tenancy, REST): tenant record read; tenant node counts; tenant-isolation status. The only entry point for identity/tenancy operations.

## Related Graph Nodes

- Implicit `tenantId` on all nodes: `Person`, `OrgUnit`, `Role`, `Capability`, `Evidence`, `Case`, `ESO`, `Executor`, `Outcome`, `Learning`, `Hypothesis` (`graph/migrations/001_constraints.cypher`).
- Counts derived from `OrgUnit`, `Person`, `Role` under the tenant.

## Related AI Logic

- None directly. Tenant autonomy posture configured here feeds trust gating (F-001.5) and execution guardrails (EPIC-008 `ai/` guardrails).

## Acceptance Criteria

1. Screen loads only for an authenticated member of the active tenant and shows only that tenant's data.
2. Isolation status reflects the tenant-isolation CI outcome; on failure, admin actions are disabled.
3. All stat counts and navigation are scoped by `tenantId`; no cross-tenant node is reachable.
4. Admin-only actions are hidden/disabled for non-Administrator roles.

# FEP-001 — UI Specification (Organization Health Dashboard)

> Specifications only. **No React, no HTML.** Implements the Organization Health Dashboard surface within the Enterprise Workspace (EPIC-001).

## Screen purpose
A tenant-scoped observability surface that shows organizational health by org unit and by the eight root-cause families, linking each gap to a Case or ESO.

## Layout regions
1. **Scope bar** — tenant + `OrgUnit` scope selector (reuses `SCR-Org-Unit-Tree.md` tree).
2. **Health overview** — per-unit health tiles + overall score.
3. **Gap board** — gaps grouped by the 8 root-cause families.
4. **Detail drawer** — selected gap: evidence, linked Case, recommended ESO(s), provenance.
5. **Activity / learning strip** — recent `Outcome`/`Learning` affecting health.

## Navigation
- Entry: Tenant Home (`SCR-Tenant-Home.md`) → "Organization Health".
- Out (handoff): gap → open `Case` (EPIC-004) or trigger ESO via Decision Center (EPIC-007).
- Breadcrumb: Workspace / Organization Health / [OrgUnit path].

## Loading / Empty / Error states
- **Loading:** skeleton health tiles + shimmer gap board while `api/` aggregates.
- **Empty:** "No signals yet" with hint that EPIC-003 produces them; "No gaps in this unit" positive state.
- **Error:** tenant record unavailable → "Workspace unavailable" + retry (no partial data); permission denied → read-only scope.

## Permissions
- View: any tenant member (scoped by role/unit per `Permissions.md`).
- Act affordances gated by `trustLevels` (Block 5) via EPIC-007.

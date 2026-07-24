# Screen — Role & Persona Management

> Implementation-ready Screen Specification. Realizes **F-001.4 Persona / Context Scoping** and **F-001.5 Role-Based Access Gating ESO Trust Levels** (EPIC-001). References engineering assets; no HTML/React.

---

## Purpose

The governance surface where administrators define persona/context templates (F-001.4) and bind ESO trust ceilings to roles (F-001.5). It connects identity (F-001.3) to context-scoped memory (ESO Block 11) and to the autonomy ladder (ESO Block 5) that gates human-in-the-loop decisions (EPIC-007) and execution (EPIC-008).

## Users

- **Tenant Administrator** — defines personas, configures role→trust ceilings.
- **Org Lead / Manager** — tailors trust ceilings and persona assignment for team roles.
- **Individual Contributor** — views assigned personas; selects active context at work time.

## Widgets

- Persona template list (name, bound role, bound unit, default memory scope).
- Persona assignment panel (Person ↔ persona, with active-context selector).
- Role→Trust matrix (roles × executor classes: human|agent|software|hybrid → ceiling observe|suggest|approve|autonomous).
- Effective-autonomy preview (min of role ceiling and ESO `trustLevels`).
- Memory-scope indicator (per-person / per-context, from ESO Block 11).

## Components

- `PersonaTemplateList` — F-001.4 templates.
- `PersonaAssignmentPanel` — Person ↔ persona + active context.
- `TrustMatrix` — role → trust ceiling per executor class (Block 5).
- `EffectiveAutonomyPreview` — computes gate per person/role/ESO.
- `MemoryScopeBadge` — reflects `contracts/eso` Block 11 `memory.scope`.

## Business Rules

- Persona templates are tenant-scoped; memory scope must be `per-person` or `per-context` (ESO Block 11 enum).
- Active persona sets the memory scope consumed by ESO `memory` block; memory state itself lives in the graph (recommended decision in `contracts/eso`).
- Trust ceiling per role is bounded by the tenant autonomy posture (F-001.1); cannot exceed it.
- Effective autonomy = min(role ceiling, ESO `trustLevels` ceiling) — never exceeds either (Block 5 + F-001.5 logic).
- Editing a role's trust ceiling is append-logged; the ESO `trustLevels` contract value is never rewritten (§5.5 envelope).

## Navigation

- Entry: Tenant Home → "Roles & Personas".
- Out: "Assign Persona" → Persona Assignment (links User Directory F-001.3); "Edit Trust" → Trust Matrix cell.
- Breadcrumb: Workspace / Roles & Personas.

## Actions

- **Define Persona Template** → name, bound role/unit, default memory scope (F-001.4).
- **Assign Persona** → Person ↔ persona; set active context.
- **Edit Trust Ceiling** → set role→executor-class ceiling (F-001.5).
- **Preview Effective Autonomy** → simulate person/ESO gate.
- **Audit Trust Change** → open change ledger entry.

## Error States

- **Invalid memory scope**: only `per-person`/`per-context` accepted (schema-enforced).
- **Ceiling exceeds tenant posture**: inline error, capped to tenant max.
- **Permission denied**: read-only for non-Admin/Manager.
- **ESO trust conflict**: if ESO `trustLevels` unavailable, preview shows "contract pending" (schema is DRAFT).

## Loading States

- Matrix/table skeleton while `api/` resolves roles + ESO `executorPolicy`.
- Spinner on persona assignment save; optimistic update + rollback.

## Empty States

- **No personas defined**: "Define a persona template" CTA (F-001.4).
- **No trust configured**: "Configure role trust ceilings" CTA (F-001.5).
- **No assignments**: "Assign personas to people" CTA.

## Permissions

- View: any tenant member (own personas always).
- Define/edit trust & personas: `Tenant Administrator` or `Org Lead` (unit-scoped) per F-001.5.
- All operations tenant-scoped; trust edits are audit-gated.

## Related APIs

- `api/` (Laravel REST): persona template + assignment endpoints; trust policy config + gating evaluation. Consumed by `web/` role & persona management and the ESOCard decision surface (`web/MIGRATION.md` `onDecision` verbs) via EPIC-007.

## Related Graph Nodes

- `Role` (id, tenantId) — trust mapping carrier.
- `Person` (id, tenantId) — role + persona assignment.
- `OrgUnit` (id, tenantId) — optional scope.
- `ESO` (id, tenantId) — source of `executorPolicy` (Block 5).
- `Executor` (id, tenantId) — per-step resolution target (EPIC-008).
- Memory state stored against `Learning`/`Outcome` ledgers (EPIC-009), tenant-scoped.

## Related AI Logic

- The trust gate computed here is consumed by `ai/` guardrails at execution (EPIC-008): effective autonomy ≤ ceiling; runtime never exceeds `trustLevels` or skips `evidenceHooks` (§5.5). The `ai/` reasoning/guardrail agents read the same Block 5 policy. No AI is invoked on this configuration screen itself.

## Acceptance Criteria

1. Persona templates can be defined/assigned tenant-scoped, with memory scope limited to `per-person`/`per-context` (Block 11).
2. Each role maps to a trust ceiling per executor class; effective autonomy = min(role, ESO `trustLevels`) and never exceeds either.
3. Actions above effective ceiling are flagged for human decision; the ESO `trustLevels` value is never rewritten.
4. All configuration is tenant-scoped and audit-logged; permission gates enforced.

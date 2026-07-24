# API (Product Layer)

> Product-facing view of the API surface. **Planning only — no endpoints authored here.**

The authoritative API implementation lives in `api/` (Laravel — auth, tenancy, REST, owner Vivek). The OpenAPI contract source lives in `contracts/openapi/` (currently scaffolded). This folder documents the *product capabilities* the API must expose, mapped to Epics.

## Capability → Epic → Engineering owner

| Capability area | Epic | Engineering reference |
|---|---|---|
| Tenancy & identity | EPIC-001 | `api/` auth + tenancy; `graph/` `Person`/`OrgUnit`/`Role` |
| Evidence ingest/query | EPIC-002 | `api/` REST; `graph/` `Evidence`; `events/` outbox |
| Signal detect/query | EPIC-003 | `contracts/taxonomy/root-cause.schema.yaml` |
| Case & hypothesis CRUD | EPIC-004 | `graph/` `Case`/`Hypothesis`; `events/` |
| Reasoning trace API | EPIC-005 | `events/` `ReasoningStep`; `ai/` |
| Recommendation API | EPIC-006 | `contracts/eso` Blocks 2/5/12 |
| Decision API | EPIC-007 | `web/MIGRATION.md` `onDecision` verbs |
| ESO execution API | EPIC-008 | `contracts/eso` Blocks 4/5/9; `ai/` |
| Outcome/learning API | EPIC-009 | `graph/` `Outcome`/`Learning`; `events/` |

## Conventions

- This folder holds product capability notes, not OpenAPI specs.
- Endpoint-level definitions belong in `contracts/openapi/` and `api/`.
- Every capability note links to its parent Epic in `development/epics/`.

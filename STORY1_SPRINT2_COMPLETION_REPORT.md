# Sprint 2 — Story 1: Signal Intelligence Engine — Completion Report

> Verified, not self-reported: every claim below was checked by running the actual build/test commands, shown inline.

---

## 0. Prerequisite: narrow canonical model completion

Before Story 1 could be built, the `Signal` graph entity had to exist (it didn't — see `CANONICAL_MODEL_LOCK.md`). Scoped strictly to the 6 entities you named:

- `graph/migrations/007_intelligence_entities.cypher` — adds `Signal`, `ReasoningStep`, `Recommendation`, `Decision`, `MentalModel`, `Policy` node constraints (id UNIQUE, tenantId NOT NULL). No relationships added here — those come from each story's own sync service, same pattern as Organization/Department/Person.
- `database/migrations/008_intelligence_entities.sql` — adds the matching 6 Postgres tables.
- `reference/architecture/CANONICAL_MODEL_LOCK.md` updated to reflect 16/21 entities now present (was 10/21). **Still not marked LOCKED** — `Skill`, `Source`, `Task` remain missing (not needed by any Sprint 2 story, intentionally left out of scope), and zero relationships are defined at the schema level (relationships are created at write-time by sync services, per existing convention).
- Flagged, not resolved: the `Policy` graph node (executor autonomy policy) shares its name with the unrelated `Policy` value in the 8-family root-cause taxonomy. Left as-is since renaming either is an architecture decision outside this pass's scope.

---

## 1. What was built

| Layer | File(s) | Status |
|---|---|---|
| PostgreSQL | `database/migrations/008_intelligence_entities.sql` (signals table) | ✅ |
| Repository | `database/src/signal.repository.ts` | ✅ |
| Service | `api/src/signal/signal.service.ts` | ✅ |
| REST API | `api/src/signal/signal.routes.ts` — `POST/GET /api/v1/signals`, `PATCH /:tenantId/:id/status` | ✅ |
| Neo4j sync | `api/src/graph/graph.sync.service.ts` — `syncSignal`, event subscriptions, stats/orphan tracking updated | ✅ |
| Events | `events/bus.ts` — `SignalEvents.Detected`, `SignalEvents.StatusChanged` | ✅ |
| Web UI | `web/src/components/signal/SignalDashboard.tsx` + `web/src/api/signal.ts`, wired into `App.tsx` via "View Signals" | ✅ |
| Tests | `api/tests/signal.test.ts` — 5 tests | ✅ |
| Tenant isolation | Every query scoped by `tenant_id`/`tenantId`; passes `tenant-isolation.yml` CI pattern | ✅ |

**Signal sources supported** (per your spec): attendance, leave, performance, capability, learning, recruitment, tasks, external — enforced as a typed enum (`SIGNAL_SOURCES`), not a free string, so an invalid source is rejected at the API boundary (`400`), not silently accepted.

**Signal fields**: id, tenantId, orgId, source, severity, confidence, timestamp (createdDate), relatedEntityType/relatedEntityId, status, metadata — matches your spec exactly.

---

## 2. What's a stub, on purpose

There is no live connector code pushing real attendance/leave/performance events into the Signal API yet — Story 1 built the **engine** (ingest, store, sync, expose, transition status), not the eight upstream integrations themselves. The `POST /api/v1/signals` endpoint is the ingestion point any connector would call. Building the actual attendance/leave/etc. connectors wasn't specified as part of Story 1's deliverable list (your spec asks for "support signals from" those sources at the schema/API level, which is what's built) — flagging this explicitly so it's a decision, not a silent gap.

---

## 3. Verification (commands run, not claimed)

```
cd contracts && npm run generate        → OK
cd database && npx tsc                  → 0 errors
cd events && npx tsc                    → 0 errors
cd api && npx tsc                       → 0 errors
cd api && node --test dist/tests/*.test.js
  → # tests 88, # pass 88, # fail 0   (83 pre-existing + 5 new signal tests)
cd web && npx tsc --noEmit              → 0 errors
```

No live Postgres/Neo4j available in this environment — `signal.repository.ts` and `graph.sync.service.ts`'s `syncSignal` are structurally verified (compile clean, follow the exact tested pattern of `capability.repository.ts`/`syncCapability`) but not run against a live database. Recommend you run `npm run db:migrate` and a manual `POST /api/v1/signals` against your local Postgres/Neo4j before treating this as fully integration-verified.

---

## 4. Files created/modified

**Created:** `graph/migrations/007_intelligence_entities.cypher`, `database/migrations/008_intelligence_entities.sql`, `database/src/signal.repository.ts`, `api/src/signal/signal.service.ts`, `api/src/signal/signal.routes.ts`, `api/tests/signal.test.ts`, `web/src/api/signal.ts`, `web/src/components/signal/SignalDashboard.tsx`

**Modified:** `database/src/index.ts`, `events/bus.ts`, `events/index.ts`, `api/src/app.ts`, `api/src/graph/graph.sync.service.ts`, `web/src/App.tsx`, `web/src/components/organization/OrganizationDetails.tsx`, `reference/architecture/CANONICAL_MODEL_LOCK.md`

---

## 5. Decision

**Story 1: COMPLETE AND VERIFIED** to the extent verifiable without a live database. Ready for Story 2 (Evidence Engine), which will consume `Signal` records the same way `Evidence` already exists as a node per the original canonical model.

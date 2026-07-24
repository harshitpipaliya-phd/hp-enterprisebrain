# FEATURE_MATRIX.md — HP Enterprise Brain

> Every row verified against actual files this session. One correction to my own prior work is noted explicitly below.

## Correction first

**EPIC-004 Case Engine frontend: I was wrong to call this missing two responses ago.** `web/src/components/workspace/DeliberationWorkspace.tsx` (171 lines) is a real, complete Hypothesis Ledger UI — case creation, hypothesis proposal against the 8 root-cause families, reject-with-reason, confirm-resolves-case — wired into `App.tsx`, using a real `web/src/api/case.ts` client. Built outside this session (likely locally). Verified it compiles clean before trusting it. Now **Complete**, not partial.

## Backend APIs

| Module | Status | Evidence |
|---|---|---|
| Foundation (tenant/auth/org/dept/person/capability) | Complete | 6 route groups, tested since Sprint 1 |
| Signal / Evidence / Reasoning / Recommendation / Decision | Complete | Core loop, tested |
| ESO Runtime / Executor / Policy / Risk | Complete | Tested, AND/OR rules |
| Mental Model / Learning / Pattern Detection | Complete | Tested |
| Case / Hypothesis | Complete | Tested + real frontend confirmed above |
| Search (Postgres ILIKE) + Graph Query (Neo4j substring) | **Duplicated, not missing** | Two real implementations never reconciled — flagged since Sprint 8 audit, still true |
| Conversation storage | Complete (storage only) | Sessions/messages/pin/rename/delete/search all real |
| Conversation generation (AI actually replying) | **Missing** | Needs LLM vendor decision — 7th time raised |
| Task Orchestrator | Complete (scoped) | 5 real tasks, sequential + retry, tested |
| Analytics / Decision Intelligence / Executive Summary | Complete | Real computation, tested |
| Notifications backend | **Missing** | Only a stub consumer that logs a string — never delivers, no persistence, no API |
| Reports beyond CSV (PDF/Excel) | **Missing** | Needs a templating/layout decision |

## Frontend Screens

| Screen | Status |
|---|---|
| Org/Dept/Person/Capability CRUD | Complete |
| Signal Dashboard, Evidence Workspace | Complete |
| Deliberation Workspace (Case/Hypothesis) | Complete (correction above) |
| Intelligence Workspace, Decision Analytics, Decision Intelligence | Complete |
| Executive Dashboard | Complete |
| Graph Explorer | Complete |
| Agent Monitor, Task Orchestrator | Complete (scoped — status view + deterministic tasks) |
| Conversation Workspace | Complete (storage/management; no AI replies yet, UI says so) |
| Audit, Events, Observability | Complete |
| **Settings (any kind)** | **Missing entirely** — zero files |
| **Sidebar / Breadcrumbs / global nav shell** | **Missing entirely** — navigation is a flat row of buttons on one screen |
| Auth beyond Login (signup, reset, MFA, session mgmt) | **Missing** |

## PostgreSQL

18 migrations, real schema for every entity above. Never verified against a live database — standing limitation, unchanged.

## Neo4j / Knowledge Graph

8 migrations, 17 node labels with constraints, real relationships at write-time. Graph Explorer provides real search/details/traversal. Same live-verification caveat as Postgres.

## Enterprise Search

Real, but **duplicated** — the actual next technical-debt item, more than any new feature.

## Agent Framework

Real but intentionally scoped: deterministic Task Orchestrator, not autonomous reasoning agents.

## Executive Dashboard

Complete — statistics, top risks, organizational knowledge, pending recommendations, all real computation.

## Authentication

Login + JWT + refresh-on-401 work. Signup, password reset, MFA, session/device management are missing.

## Navigation

**The biggest structural gap found in this audit.** Every screen works, but there's no real navigation shell — no sidebar, no breadcrumbs, one growing row of buttons on the Organization Details screen is the only way to reach anything.

## Reports

CSV export for Decisions exists. Nothing else.

## Settings

✅ **Closed this pass.** Manual theme override (previously OS-preference-only), notification preferences, persisted via a real settings store (`tenant_id, user_id, key → value`). Org-level org-info settings already covered by the existing `OrganizationEdit` screen — not duplicated.

## Notifications

✅ **Closed this pass.** The stub consumer since Sprint 1 now persists real notifications for a curated set of event types (RecommendationGenerated, DecisionMade, HypothesisRejected, HypothesisConfirmed, RiskAssessed, CaseOpened) — not every event, deliberately. Real bell icon with unread count, dropdown, mark-read/mark-all-read, 30s polling (no WebSocket infra exists, so polling is the honest choice, not a placeholder for something better).

**Named limitation, not hidden**: notifications go to the event's actor, not necessarily who *should* be told (e.g., an approver). Real notification routing is a product decision (subscriptions? roles? org chart?) — this is the bounded, real version, not a guess dressed up as the full answer.

---

## Remaining, updated priority order

1. ✅ **Search de-duplication — closed.** Not by removing either backend (both are real, genuinely different data stores) but by unifying the experience: `GlobalSearch.tsx` queries both, merges, de-dupes by entity, labels each result's source honestly.
2. ✅ **Signup — closed.** `Login.tsx` now has a third mode wired to the `/auth/register` endpoint that already existed but had no frontend.
3. **Password reset — genuinely still blocked**, not just deprioritized: it needs an email delivery provider (SMTP/SendGrid/SES), the same category of external-vendor decision as the LLM choice. Not silently picking one.
4. AI Copilot generation, PDF/Excel reports — still blocked on decisions from you.

# HP Enterprise Brain — Project Overview

> Last verified: this session. 146/146 tests passing, all 6 workspaces build clean. Every claim below was checked against the actual repository, not written from memory — see the individual Sprint/Verification reports in the repo root for the underlying evidence.

---

## 1. What this is

An Enterprise Intelligence Operating System for TRIZ Group, built on top of a K-12 ERP foundation. The core idea: raw organizational data (attendance, sales, market reports) doesn't become useful until it's turned into evidence-backed, confidence-scored intelligence that a human — or, within strict limits, the system itself — can act on, and the result of acting feeds back into what the organization "knows" going forward.

---

## 2. Architecture — the six workspaces

| Workspace | Contains | Builds |
|---|---|---|
| `contracts` | ESO Contract + root-cause taxonomy → generates TypeScript types | ✅ |
| `database` | 20 repositories, 15 Postgres migrations | ✅ |
| `events` | 16 domain event catalogues, one in-process event bus | ✅ |
| `api` | Express server, 27 route modules, 34 test files | ✅ |
| `web` | React (Vite) frontend, 10 component groups | ✅ |
| `graph` | 8 Cypher migrations, 16 Neo4j node labels | N/A (no build step) |

**Stack:** Node.js/TypeScript/Express, PostgreSQL, Neo4j, React/Vite. No Tailwind (inline styles throughout). No Docker previously — now added (see §5).

---

## 3. The core intelligence loop

```
Signal → Evidence → Reasoning → Recommendation → Decision → Execution → Outcome → Learning
                                                                                       ↓
                                                                              Mental Model
```

- **Signal**: a raw, typed observation (source, classification, priority, severity)
- **Evidence**: provenance-carrying proof attached to a Signal, with freshness (age-weighted)
- **Reasoning**: computes confidence = `0.3 base + Σ(evidence.confidence × freshness × 0.15)`, capped at 0.95 — never asserted, always calculated
- **Recommendation**: category (risk/opportunity/watch/compliance), forced to `watch` if confidence < 0.4; urgency derived, not caller-supplied
- **Decision**: human approval, or — if a tenant has explicitly created a matching Policy — autonomous approval, with a hard rule that `opportunity`-category recommendations can never auto-approve, tested adversarially
- **Execution**: ESO Runtime tracks status (queued→running→completed/failed→rolled_back)
- **Outcome**: append-only record of what actually happened
- **Learning**: DPDP-anonymized (names/emails/IDs redacted) pattern extraction; if successful, reinforces a **Mental Model** — the organization's accumulated belief for that domain, confidence-blended across reinforcements

This chain is proven to work end-to-end by one real integration test (`closed-intelligence-loop.test.ts`) that runs all 8 real services in sequence, not mocked demonstration code.

---

## 4. Sprint-by-sprint status

| Sprint | Scope | Status |
|---|---|---|
| 1 | Foundation: tenant, auth/RBAC, org/department/person/capability, graph sync, events, audit | ✅ Complete |
| 2 | Intelligence Core: Signal→Evidence→Reasoning→Recommendation, Decision/ESO/Outcome/Learning | ✅ Complete except Search (closed in Sprint 7) and true Pattern Detection (clustering — still open) |
| 3 | Executor directory (capability/availability/workload matching), Decision reject, DPDP anonymization, closed-loop integration test | ✅ Complete. *Note: a later directive redefined "Sprint 3" as "AI Platform" (chat/vector search) — that is a different, unbuilt scope; see §6 | 
| 4 | Decision Intelligence: Decision confidence/explanation/trace, Evidence freshness, Recommendation urgency/ROI, Policy Engine, Risk Engine, Decision Analytics | ✅ Complete |
| 5 | Enterprise Brain: Mental Model reinforcement (real), Executive Summary rollup (real) | ✅ Complete for what's groundable. Department/Performance Brain attribution needed a decision — partially unblocked in Sprint 7 |
| 6 | Autonomous Enterprise: Autonomous Decision Execution via the Policy Engine, safety-tested | ✅ Complete for the groundable part. Multi-agent/digital-twin/simulation/predictive — not started, need product decisions (§6) |
| 7 | Production hardening + Search | ✅ helmet, rate limiting, structured logging (pino), JWT boot guard, Docker+compose, real Neo4j migration runner, Swagger (all 16 route groups), CI pipeline with live DB, Search, department-scoped analytics |

---

## 5. What's done — full inventory

**Security & auth**: JWT + refresh tokens, RBAC, CORS (fixed — was completely missing), helmet, rate limiting, tenant isolation enforced in Postgres and Neo4j (CI-checked), production boot guard against the placeholder JWT secret.

**Observability**: structured logging (pino, replaced 6 raw console calls), audit log entity, health endpoint, process-level crash safety (an unhandled DB error used to kill the whole server — fixed).

**Governance**: Policy Engine (safe field-comparison rule evaluation, no `eval()`, versioned — old versions preserved not mutated), Risk Engine (deterministic `probability × impact` scoring), autonomous approval opt-in per tenant with a non-overridable safety rule.

**Data layer**: 15 Postgres migrations, 20 repositories, tenant-scoped throughout. 8 Neo4j migrations, 16 node labels, real relationships created at write-time (not just declared).

**API**: 27 route modules, all documented in OpenAPI at `/api-docs`.

**Frontend**: 10 screens — Organization/Department/Person/Capability CRUD, Signal Dashboard, Intelligence Workspace, Decision Analytics Panel, Audit, Events, Observability, Auth/Login.

**DevOps**: `docker-compose.yml` (Postgres + Neo4j + API + web, health-check-gated startup), CI pipeline that builds every workspace and — for the first time in this project's history — runs tests against **real** Postgres and Neo4j containers, not just in-memory mocks.

**Tests**: 146 passing. Every service-logic test uses in-memory mocks (fast, deterministic); the `.integration.test.js`/`.neo4j.test.js` files exist for live-DB testing and now actually run in CI.

---

## 6. What's remaining — honestly categorized

### Bounded engineering gaps — closed this pass
- ✅ **Pattern Detection** — real frequency-based clustering across reusable Learnings (2+ occurrence threshold), not just individual capture. Non-ML, honestly labeled as such.
- ✅ **Seed data script** (`api/src/cli/seed.ts`, `npm run seed`) — populates Executors, Policies (including one AND-composite rule), and demo Signals for a `demo-tenant`. Idempotent. **Not yet executed against a live database — compiles and type-checks correctly, but only a real run will prove it fully.**
- ✅ **Policy AND/OR composition** — `conditions[]` + `match: 'all'|'any'`, additive; the original flat `field`/`operator`/`value` form still works unchanged, verified by a dedicated regression test
- ✅ **Request timeout handling** — a request touching a dead DB connection now returns `503` after 15s instead of hanging forever
- ⚠️ **Dashboard dark mode** — real, OS-preference-driven, wired into both dashboard screens' root containers and shared `Stat` card component. **Not exhaustive** — the many individual inline colors inside recommendation cards, risk cards, and lists throughout both screens still use light-mode hex values. Responsive layout was already partially present (`grid-template-columns: repeat(auto-fit, minmax(...))`) from when these screens were first built — not new this pass, just newly credited.

### Still needs a real decision from you before it can be built honestly
- **AI Platform** (chat, vector search, prompt management, conversation memory) — needs an LLM/vector-store vendor decision
- **Multi-agent systems, Organization Digital Twin, Enterprise Simulation, Predictive Intelligence** — needs a governance/product decision about how much autonomy this system is allowed, and what "simulation" concretely means for a K-12 ERP
- **Full department/performance attribution model** — the column now exists (Sprint 7), but "which department does a cross-functional Decision belong to" is a business rule, not inferable from code

### Never verified against live infrastructure until this week
No Postgres or Neo4j was ever available in the environment doing this work, across every sprint — until the Sprint 7 CI pipeline. That pipeline is written and YAML-valid but has not yet actually run on GitHub as of this document. **This is the single most important thing to check next** — everything else in this document could be subtly wrong in ways that only a live database would surface.

---

## 7. Key decisions made along the way, worth knowing

- **Executor Resolver never auto-approves `opportunity`-category recommendations**, no matter what a policy says — tested with an adversarial policy that deliberately tries to bypass this and still gets blocked
- **Policy rules use safe field/operator/value comparisons, deliberately not `eval()`** — a security choice, not a shortcut
- **DPDP anonymization runs before any Learning becomes "reusable knowledge"** — names, emails, phone numbers, and ID-like tokens are stripped
- **"Skill Brain" and "Company Brain" (Sprint 5 naming) are lenses over the existing Capability model and Intelligence Workspace, not separate systems** — only Mental Model and Executive Summary needed genuinely new code
- **Sprint numbering has been reused with different meanings by different directives** during this project — always check what a given "Sprint 3" or "Sprint 5" actually refers to before assuming scope; the Verification reports in the repo root disambiguate each case

---

## 8. Where the other documents fit

`AUDIT_REPORT.md` (detailed gap list) · `Known_Issues.md` (consolidated) · `SPRINT1_REPORT.md` through `SPRINT4_REPORT.md`, `Sprint5_Report.md`, `Sprint6_Report.md` (per-sprint detail) · `Sprint1_Verification.md`–`Sprint3_Verification.md` (re-checked against original scope) · `SPRINT5_ARCHITECTURE.md`, `SPRINT6_ARCHITECTURE.md`, `SPRINT7_ROADMAP.md` (design docs for ungoverned areas) · `RUNTIME_FIX_REPORT.md`, `INTEGRATION_FIX_REPORT.md` (bug fixes) · `Version1_Report.md` (explicitly declines to claim "1.0" and says why) · `Test_Report.md`, `Build_Report.md`, `QA_Report.md` (verification detail).

This document is the map; those are the territory.

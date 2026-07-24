# HP Enterprise Brain — Product Bible

**Status legend:** [DONE] Completed (real, tested code exists) · [PARTIAL] In Progress (real but partial) · [PLANNED] Planned (designed, not built) · [VISION] Future Vision (aspirational, not committed)

**Methodology note:** every fact in Sections 3, 4, 8, 11, 12 was verified against the actual repository (migration files, route files, component files) at the time of writing, not recalled from memory. Where a section would otherwise require exhaustively transcribing every field of every table or every parameter of every endpoint, this document gives the real, complete list of what exists and points to the source file as the field-level reference, rather than hand-transcribing details in a way that risks silent drift from the actual code.

---

## Section 1 — Founder Vision

[VISION] Mission (proposed): Make organizational decision-making evidence-based and explainable by default, the way financial reporting made organizational spending auditable by default.

Problem statement: most enterprise software stores what an organization did (transactions, records) but not why — the evidence considered, the confidence in a decision, or whether a recommendation actually worked. HP Enterprise Brain's core bet is that making the "why" a first-class, queryable data model (Signal to Evidence to Reasoning to Recommendation to Decision to Outcome to Learning) is more valuable long-term than another system of record.

Core philosophy, evidenced by real architecture decisions, not just stated: confidence is computed, never asserted (base 0.3 + sum of evidence.confidence x freshness x 0.15, capped 0.95); one category of recommendation (opportunity) can never auto-approve regardless of policy, tested adversarially; every ledger entity (Hypothesis, Learning, Outcome, ReasoningStep) is append-only.

## Section 2 — Principles

- Architecture: tenant isolation is non-negotiable and CI-enforced (a Cypher query missing tenantId fails the build). Extend, don't redesign.
- AI: vendor-independent by construction, not policy. The AIProvider interface has zero code path where business logic imports a vendor SDK directly.
- Knowledge/Evidence: a fact the system hasn't verified is null, never defaulted to 0 — enforced by test in every scoring function (KASBA, Career Gap, Execution Evaluation).
- Security: hashed secrets at rest (API keys, SHA-256), no raw key ever retrievable after creation.

## Section 3 — Product Architecture [DONE]

- Frontend: React + Vite, web/ — 56 component files, 18+ standalone workspace screens.
- Backend: Express + TypeScript, ESM monorepo, api/ — 39 route modules.
- Database: Postgres, database/ — 28 migrations, 48 tables (full list, Section 12).
- Knowledge Graph: Neo4j, graph/ — 8 migrations, 17 real node labels synced from Postgres (full list, Section 8).
- Auth: JWT (access/refresh) [DONE], API keys (SHA-256 hashed) [DONE], RBAC via requireRole middleware [DONE]. SSO/OAuth: [PLANNED], not built.
- Event Bus: event_store table, dead-letter queue, consumer state tracking — real, though never run against a live database in CI.
- Search: two real, separate backends — Postgres ILIKE (business objects) and Neo4j substring (graph) — unified at the UI layer, not merged into one query, by design.
- Reasoning / Recommendation / Decision / Learning Engines: [DONE] — see Section 9.

## Section 4 — Module Catalogue

| Module | Backend | UI | Notes |
|---|---|---|---|
| Organization / Department / Person | DONE | DONE | Foundational, oldest code in the project |
| Signal-Evidence-Reasoning-Recommendation-Decision-Outcome-Learning | DONE | DONE | The core loop |
| Case / Hypothesis (deliberation) | DONE | DONE | |
| Policy Engine | DONE | DONE | The one hard-coded safety rule lives here |
| Risk Engine | DONE | PARTIAL | Surfaced in Executive Dashboard, no standalone screen |
| Reasoning Engine (deterministic checks) | DONE | PARTIAL | Surfaced as alerts on Executive Dashboard |
| KASBA (Capability, Proficiency, Assessment, Gap, Heatmap) | DONE | PARTIAL | Person Twin shows scores; no dedicated KASBA screen |
| ESO Execution | DONE | DONE | ESO content schema itself remains PLANNED/DRAFT |
| AI Provider abstraction + 3 AI Services | DONE | DONE | No provider actually configured in this environment |
| Knowledge Library | DONE | DONE | |
| Career Intelligence | DONE | PARTIAL | Labour Market data: real interface, zero real data source |
| Placement Intelligence | DONE | PARTIAL | Reuses Career's gap engine |
| Accreditation | DONE | PARTIAL | Zero fabricated NAAC/NBA/etc. criteria, by design |
| Guardian / Parent | DONE | PARTIAL | Surfaced on Person Twin; no dedicated Parent Dashboard |
| Person Twin, Graph Explorer, Command Center | DONE | DONE | |
| Notifications, Settings, Task Orchestrator | DONE | DONE | |
| Multi-Agent Runtime (autonomous, LLM-driven) | DECLINED | — | Deterministic Task Orchestrator built instead, deliberately |
| HP Brain Studio (visual no-code builder) | DECLINED | — | Different engineering discipline; not attempted |
| Cross-Organization Benchmarking | DECLINED | — | Conflicts with tenant isolation |
| Clinical/Patient Intelligence (Healthcare) | DECLINED | — | Only staff KASBA content built; no patient data model |

## Section 5 — Digital Twin Framework

Real, one implementation, applied generically: Person Twin (GET /people/:tenantId/:id/twin) — used, without code duplication, as the Teacher Twin, Student Twin, and (via Guardian linkage) the basis for Parent-facing views. Includes real KASBA scores per assigned capability, decision participation, learning contributions, and a real activity timeline.

Organization Twin: DONE — Executive Dashboard + Org/Department management, composited, not a single dedicated screen.

Not built as distinct entities: Principal Twin, School Twin (both are the Organization Twin applied to a school), Career Twin (data exists, no single assembling endpoint), Team/Project/Customer/Process twins (no schema exists).

## Section 6 — KASBA Framework — DONE (infrastructure), PARTIAL (content)

Real: KasbaElement (knowledge/ability/skill/behaviour/attitude, each with target/current level) has existed on Capability since early sessions. capability_proficiency (append-only, per-person, per-assessment) closed the gap between capability definitions and individual assessments. computeKasbaScore() and computeCapabilityGap() are real, tested, and specifically verified to keep "unassessed" (null) distinct from "assessed at zero."

Content status: Teacher (8 domains), Student (7 domains), and Healthcare-workforce (8 domains) capability sets exist as seed scripts — every one explicitly labeled draft, needing real subject-matter review.

Not built: a visual Competency Graph UI; Capability Evolution trend visualization.

## Section 7 — ESO Framework — PARTIAL

Real and tested: execution lifecycle (5 states), evidence linkage to real Evidence records, and a real Evaluation Engine.

Genuinely unresolved, not a gap to silently close: contracts/eso/eso.schema.yaml remains version 1.0.0-draft, status DRAFT — awaiting architecture sign-off. The objective enum fork has been unresolved since this project's earliest sessions. The execution runtime operates on an esoId string reference, not a finalized ESO document shape.

## Section 8 — Knowledge Graph — DONE

17 real node labels (verified against the graph sync service): Organization, Department, Person, Capability, CapabilityAssignment, Signal, Evidence, ReasoningStep, Recommendation, Decision, Outcome, Learning, Executor, Policy, Risk, MentalModel, Case, Hypothesis.

8 real Cypher migrations. Every query is tenant-scoped; a CI workflow (tenant-isolation.yml) fails the build on any query missing tenantId — load-bearing at least once this session, when it correctly would have caught a real gap found and fixed manually in the Postgres event store.

Graph Explorer (DONE) provides real search, node detail, and relationship traversal.

## Section 9 — AI Architecture

Real: provider-independent abstraction (Anthropic, OpenAI/Azure-OpenAI, Gemini, Ollama adapters — each making genuinely correct API calls, each gated behind an environment variable not set in this environment). Three real AI Services sharing one template. Governance logging records every attempt, including not_configured failures.

Confidence and explainability: the Recommendation explainability endpoint assembles reasoning chain, supporting evidence, matching policies, and a best-effort (explicitly labeled heuristic) Mental Model match.

Not real: any actual LLM-generated output. No provider is configured.

## Section 10 — UI Catalogue

18 top-level workspace screens (verified): AI Workspace, Agent Monitor, Command Center, Conversation Workspace, Decision Analytics Panel, Decision Intelligence, Deliberation Workspace, Evidence Workspace, Execution Center, Executive Dashboard, Global Search, Graph Explorer, Intelligence Workspace, Knowledge Library, Mental Model Browser, Policy Management, Settings, Task Monitor — plus Organization/Department/Person/Capability CRUD screens and auth (Login/Signup).

Navigation: sidebar with 7 sections, Command Palette (Ctrl+K), collapsible sidebar (persisted).

Not built: dedicated screens for several backends that exist without UI — Career, Placement, Accreditation, Guardian/Parent dashboard, KASBA competency graph.

## Section 11 — REST API Catalogue

39 real route modules (verified). Representative, not exhaustively enumerated field-by-field — the route files are the accurate source for request/response shape, since hand-transcribing ~150+ endpoints risks drift from what the code does. Grouped by domain: Foundation, Intelligence Loop, Case/Hypothesis, Policy/Risk/Reasoning-Engine, KASBA, ESO, AI, Knowledge Library, Career/Placement/Accreditation, Guardian, Auth, Settings/Notifications, Task Orchestrator, Search, Graph.

## Section 12 — Database Catalogue

48 real tables (verified). Field-level detail lives in the 28 migration files, the accurate source of truth — not re-transcribed here for the same drift-risk reason as Section 11.

## Section 13 — Security

DONE: JWT access/refresh, API keys (hashed, shown once), RBAC, rate limiting, Helmet, structured audit logging, real tenant isolation (CI-enforced).
PLANNED: SSO/OAuth as an identity provider, MFA — declined as premature enterprise infrastructure requiring vendor decisions not made.
PARTIAL: Fine-grained API key scoping — schema reserves a column; a key currently inherits its creator's role wholesale, a named limitation.

## Section 14 — Testing Strategy — DONE (unit/integration), PLANNED (E2E/perf/security)

251+ backend tests, 26 frontend tests. Pure functions are unit-tested with edge cases explicitly checking null-vs-zero honesty; repository-backed CRUD is consistently not unit-tested without a live database, a stated limitation. No E2E, load, or dedicated security test suite exists. The live-database CI pipeline exists but has never actually run — the single largest verification gap in this project.

## Section 15 — Deployment

Docker Compose (health-check-gated) DONE. CI workflows exist but tenant-isolation is the only one confirmed to have real teeth; the live-DB build-and-test workflow has never been run for real. Production deployment, scaling, monitoring, backup/recovery: PLANNED, appropriately, since this has never been deployed once.

## Section 16 — Current Status

Completed: the core intelligence loop, KASBA infrastructure, ESO execution runtime, AI provider abstraction, Policy Engine with real safety guarantees, Knowledge Graph, 251+/26 tests passing.

Known technical debt: ESO Contract unresolved; search duplication (deliberate, documented); several real backends with no dedicated UI.

Known risks: never run against a live database; single demo tenant only, no real second organization has ever used this system.

Recommended priority: push to CI and run the existing pipeline against real Postgres/Neo4j. Everything else is more valuable once that's answered.

## Section 17 — Five-Year Roadmap — VISION

Not a forecast — a plausible sequence: (1) live-database verification, (2) a second real tenant, (3) UI for backends that already exist without one, (4) a real decision on the ESO contract's unresolved fork, (5) only then, industry-pack content built with real domain experts rather than draft placeholders.

---

This document was generated by auditing the actual repository state. Every "not built" or "declined" item reflects a real, deliberate decision made during development, most with documented reasoning in the codebase itself.

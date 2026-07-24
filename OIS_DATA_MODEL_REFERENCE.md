# HP Enterprise Brain — Data Model Reference (v0.1, Internal)

## What this document is, and isn't

This documents the data model **one implementation** — HP Enterprise Brain — actually contains, verified against its 48 Postgres tables and 8 Neo4j graph migrations as they exist today. It is **not** an open standard, is not comparable to HTTP, OAuth, or Kubernetes, and has no external adopters, governance body, or RFC process. Those became standards through years of independent multi-vendor implementation and formal review — a single document can't confer that status.

What follows is accurate to the real schema. Where the underlying design is still genuinely unsettled inside this project, that's stated, not smoothed over.

---

## Standard 1 — Organizational Digital Twin (ODT) — real, stable

Core entities and their real relationships: Organization to Department to Person, with Capability assignable to any of the three via capability_assignments (target_type, target_id). Policy, Decision, Learning, and Evidence are independent top-level entities linked by foreign key, not owned by any one of the above.

## Standard 2 — Capability Model (KASBA) — real, with one honest gap closed late

Each Capability carries five KasbaElement fields (knowledge, ability, skill, behaviour, attitude), each with targetLevel/currentLevel, real since Sprint 1. What was missing until recently: per-person assessment data. capability_proficiency (append-only, one row per assessment) closes that — computeKasbaScore() and computeCapabilityGap() are the real, tested scoring functions, and both deliberately return null rather than 0 for anything never actually assessed.

## Standard 3 — Executable Skill Objects (ESO) — genuinely still draft, not settled

contracts/eso/eso.schema.yaml is version 1.0.0-draft, status DRAFT — awaiting architecture sign-off, unresolved since this project's earliest sessions: the objective enum (DEVELOP/PERFORM/ASSESS/DECIDE) hasn't been signed off. The runtime around ESOs is real and tested (eso_executions, five-state lifecycle, evidence linkage, evaluation scoring) — but it operates on an esoId string, not a finalized ESO document shape. Any specification claiming ESO structure is standardized would describe something this project's own architecture hasn't finished deciding.

## Standard 4 — Enterprise Memory — real

Decision, Outcome, Learning, Policy are append-only/immutable where the domain calls for it. KnowledgeAsset holds content this pipeline doesn't auto-generate — playbooks, SOPs, best practices a person documents directly.

## Standard 5 — Decision Intelligence — real

confidence = base 0.3 + sum(evidence.confidence x freshness x 0.15), capped at 0.95, never asserted higher without evidence backing it. Recommendation.category = 'opportunity' can never auto-approve, regardless of any Policy — the one hard-coded, non-overridable safety rule in this system, tested adversarially.

## Standard 6 — Knowledge Graph Ontology — real, 17 node labels

Organization, Department, Person, Capability, Signal, Evidence, ReasoningStep, Recommendation, Decision, Outcome, Learning, Executor, Policy, Risk, MentalModel, Case, Hypothesis — 8 real Cypher migrations, every query tenant-scoped and CI-enforced.

## Standard 7 — AI Governance — real, honestly incomplete

ai_executions logs every AI call attempt — success, failure, or not-configured — before any real AI vendor key is even present. What isn't real: any actual LLM output, since no provider is configured in this environment. The provider abstraction is vendor-independent by construction, not just by policy statement.

## Standard 8 — Interoperability — not attempted

No other Enterprise Brain implementation exists to interoperate with. Left as a gap rather than a fabricated exchange format for a scenario with no second party.

---

## What real standardization would actually require

Not another document from me: a second independent implementation by a different team, a neutral body to hold the spec, and real-world validation across organizations that didn't build the reference implementation. None of that exists yet. This is a starting point for that conversation, not a substitute for it.

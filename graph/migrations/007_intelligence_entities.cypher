// Migration: 007_intelligence_entities.cypher
// Scope: Canonical Model completion (narrow) — adds the 6 entities Sprint 2 depends on.
// Source of gap: reference/architecture/CANONICAL_MODEL_LOCK.md §2 (Entity Catalogue).
// Adds (:Signal) (:ReasoningStep) (:Recommendation) (:Decision) (:MentalModel) (:Policy)
// node constraints only. Does NOT edit any shipped migration 001-006.
// Does NOT add the remaining out-of-scope entities (Source, Skill, Task) — those are
// not required by any Sprint 2 story and are intentionally left for a later pass.
// Does NOT add relationships — per graph/README.md, relationships are created by each
// story's sync service at write-time (see Organization/Department/Person pattern).

CREATE CONSTRAINT signal_id             IF NOT EXISTS FOR (n:Signal) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT signal_tenant         IF NOT EXISTS FOR (n:Signal) REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT reasoning_step_id     IF NOT EXISTS FOR (n:ReasoningStep) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT reasoning_step_tenant IF NOT EXISTS FOR (n:ReasoningStep) REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT recommendation_id     IF NOT EXISTS FOR (n:Recommendation) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT recommendation_tenant IF NOT EXISTS FOR (n:Recommendation) REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT decision_id           IF NOT EXISTS FOR (n:Decision) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT decision_tenant       IF NOT EXISTS FOR (n:Decision) REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT mental_model_id       IF NOT EXISTS FOR (n:MentalModel) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT mental_model_tenant   IF NOT EXISTS FOR (n:MentalModel) REQUIRE n.tenantId IS NOT NULL;

// NOTE: this graph node is distinct from the "Policy" string value in the 8-family
// root-cause taxonomy (contracts/taxonomy/root-cause.schema.yaml). This node represents
// an executor autonomy/governance policy (per ESO Block 5 executorPolicy), not a
// root-cause classification. Same name, different concept — flagged, not renamed,
// since renaming either is an architecture decision outside this narrow pass.
CREATE CONSTRAINT policy_id             IF NOT EXISTS FOR (n:Policy) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT policy_tenant         IF NOT EXISTS FOR (n:Policy) REQUIRE n.tenantId IS NOT NULL;

-- Migration: 014_mental_model_reinforcement.sql
-- Sprint 5: Enterprise Brain — Organizational Learning
--
-- MentalModel has existed since the Sprint 2 narrow canonical-model completion,
-- with a Neo4j constraint and dormant foreign keys from ReasoningStep and Learning
-- (mental_model_id columns, (r)-[:APPLIES]->(m) and (l)-[:UPDATES]->(m) graph
-- relationships already declared) — but no repository, service, or route ever
-- created or updated a MentalModel record. This migration adds the two columns
-- needed to make reinforcement real; it does not touch any existing column.

ALTER TABLE mental_models ADD COLUMN confidence NUMERIC NOT NULL DEFAULT 0.5;
ALTER TABLE mental_models ADD COLUMN reinforcement_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mental_models MODIFY COLUMN domain VARCHAR(255) NOT NULL;
CREATE INDEX idx_mental_models_domain ON mental_models (tenant_id, domain);

-- Migration: 010_outcomes_learnings.sql
-- Story: Sprint 2 Story 7 (Outcome Engine) + Story 8 (Learning Engine)
-- Outcome and Learning graph constraints already existed pre-Sprint-1
-- (graph/migrations/001_constraints.cypher). This adds the missing Postgres tables.

CREATE TABLE IF NOT EXISTS outcomes (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  decision_id       VARCHAR(36) REFERENCES decisions(id),
  result            TEXT NOT NULL DEFAULT 'pending',
  metrics           JSON NOT NULL DEFAULT '{}',
  kpis              JSON NOT NULL DEFAULT '{}',
  evidence_ids      JSON NOT NULL DEFAULT '[]',
  feedback          TEXT,
  confidence        NUMERIC NOT NULL DEFAULT 0.5,
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_outcomes_tenant ON outcomes (tenant_id);
CREATE INDEX idx_outcomes_decision ON outcomes (tenant_id, decision_id);

CREATE TABLE IF NOT EXISTS learnings (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  outcome_id        VARCHAR(36) REFERENCES outcomes(id),
  mental_model_id   VARCHAR(36) REFERENCES mental_models(id),
  pattern           TEXT NOT NULL,
  description       TEXT,
  confidence        NUMERIC NOT NULL DEFAULT 0.5,
  reusable          BOOLEAN NOT NULL DEFAULT true,
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_learnings_tenant ON learnings (tenant_id);
CREATE INDEX idx_learnings_outcome ON learnings (tenant_id, outcome_id);

-- Migration: 008_intelligence_entities.sql
-- Scope: Canonical Model completion (narrow) — adds the 6 tables Sprint 2 depends on.
-- Source of gap: reference/architecture/CANONICAL_MODEL_LOCK.md §2 (Entity Catalogue).
-- Reversible: DROP TABLE IF EXISTS ...;

CREATE TABLE IF NOT EXISTS signals (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  org_id               VARCHAR(36) NOT NULL,
  source               TEXT NOT NULL,
  classification       TEXT NOT NULL DEFAULT 'unclassified',
  priority             TEXT NOT NULL DEFAULT 'normal',
  severity             TEXT NOT NULL DEFAULT 'low',
  confidence           NUMERIC NOT NULL DEFAULT 0.5,
  related_entity_type  TEXT,
  related_entity_id    VARCHAR(36),
  status               VARCHAR(255) NOT NULL DEFAULT 'new',
  metadata             JSON NOT NULL DEFAULT '{}',
  created_by           TEXT NOT NULL,
  created_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_signals_tenant ON signals (tenant_id);
CREATE INDEX idx_signals_status ON signals (tenant_id, status);

CREATE TABLE IF NOT EXISTS reasoning_steps (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  case_id              VARCHAR(36),
  signal_id            VARCHAR(36) REFERENCES signals(id),
  mental_model_id      VARCHAR(36),
  step_order           INTEGER NOT NULL,
  description          TEXT NOT NULL,
  confidence_score     NUMERIC NOT NULL DEFAULT 0.5,
  created_by           TEXT NOT NULL,
  created_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_reasoning_steps_tenant ON reasoning_steps (tenant_id);
CREATE INDEX idx_reasoning_steps_signal ON reasoning_steps (tenant_id, signal_id);

CREATE TABLE IF NOT EXISTS recommendations (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  reasoning_step_id    VARCHAR(36) REFERENCES reasoning_steps(id),
  category             TEXT NOT NULL DEFAULT 'watch',
  title                TEXT NOT NULL,
  description          TEXT,
  priority             TEXT NOT NULL DEFAULT 'medium',
  confidence           NUMERIC NOT NULL DEFAULT 0.5,
  impact               TEXT,
  cost                 TEXT,
  risk                 TEXT,
  dependencies         JSON NOT NULL DEFAULT '[]',
  status               TEXT NOT NULL DEFAULT 'pending',
  created_by           TEXT NOT NULL,
  created_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_recommendations_tenant ON recommendations (tenant_id);

CREATE TABLE IF NOT EXISTS decisions (
  id                     VARCHAR(36) PRIMARY KEY,
  tenant_id              VARCHAR(36) NOT NULL,
  recommendation_id      VARCHAR(36) REFERENCES recommendations(id),
  decided_by             VARCHAR(36) NOT NULL,
  executor_type          TEXT NOT NULL DEFAULT 'human',
  rationale              TEXT NOT NULL,
  alternatives_considered JSON NOT NULL DEFAULT '[]',
  status                 TEXT NOT NULL DEFAULT 'approved',
  created_date           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_decisions_tenant ON decisions (tenant_id);

CREATE TABLE IF NOT EXISTS mental_models (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  domain               TEXT NOT NULL,
  rules                JSON NOT NULL DEFAULT '{}',
  version              INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'active',
  created_by           TEXT NOT NULL,
  created_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_mental_models_tenant ON mental_models (tenant_id);

CREATE TABLE IF NOT EXISTS policies (
  id                     VARCHAR(36) PRIMARY KEY,
  tenant_id              VARCHAR(36) NOT NULL,
  name                   TEXT NOT NULL,
  scope                  TEXT NOT NULL,
  allowed_executor_classes JSON NOT NULL DEFAULT '[]',
  trust_levels            JSON NOT NULL DEFAULT '[]',
  routing_criteria        JSON NOT NULL DEFAULT '{}',
  escalation_path         JSON NOT NULL DEFAULT '[]',
  status                  TEXT NOT NULL DEFAULT 'active',
  created_by              TEXT NOT NULL,
  created_date            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_policies_tenant ON policies (tenant_id);

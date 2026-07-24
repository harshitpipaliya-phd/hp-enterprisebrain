-- Migration: 011_eso_executions.sql
-- Story: Sprint 2 Story 5 - ESO Runtime
-- Tracks execution status of an ESO (referenced by id only) against the ESO graph
-- node that already existed pre-Sprint-1. Does NOT touch contracts/eso/eso.schema.yaml
-- and does NOT require the D7 objective-enum decision to be resolved — this is
-- runtime status tracking, not contract authoring.

CREATE TABLE IF NOT EXISTS eso_executions (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  eso_id            VARCHAR(36) NOT NULL,
  decision_id       VARCHAR(36) REFERENCES decisions(id),
  status            TEXT NOT NULL DEFAULT 'queued',
  executed_by       TEXT NOT NULL,
  executor_type     TEXT NOT NULL DEFAULT 'human',
  input             JSON NOT NULL DEFAULT '{}',
  output            JSON,
  error             TEXT,
  started_date      TIMESTAMP,
  completed_date    TIMESTAMP,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_eso_executions_tenant ON eso_executions (tenant_id);
CREATE INDEX idx_eso_executions_eso ON eso_executions (tenant_id, eso_id);

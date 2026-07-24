-- Migration: 009_evidence.sql
-- Story: Sprint 2 Story 2 - Evidence Engine
-- Evidence graph constraint already existed pre-Sprint-1 (graph/migrations/001_constraints.cypher).
-- This adds the missing Postgres table.

CREATE TABLE IF NOT EXISTS evidence (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  signal_id         VARCHAR(36) REFERENCES signals(id),
  source            TEXT NOT NULL,
  evidence_type     VARCHAR(36) NOT NULL DEFAULT 'observation',
  content           JSON NOT NULL DEFAULT '{}',
  provenance        JSON NOT NULL DEFAULT '{}',
  confidence        NUMERIC NOT NULL DEFAULT 0.5,
  hash              TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'active',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_evidence_tenant ON evidence (tenant_id);
CREATE INDEX idx_evidence_signal ON evidence (tenant_id, signal_id);

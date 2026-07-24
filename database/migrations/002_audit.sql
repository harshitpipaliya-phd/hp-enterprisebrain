-- Migration: 002_audit.sql
-- Story: S1-STORY-003 Organization Management
-- Creates the audit_logs table for organization create/update/archive actions.
-- Reversible: DROP TABLE IF EXISTS audit_logs;

CREATE TABLE IF NOT EXISTS audit_logs (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  entity_type     VARCHAR(255) NOT NULL,
  entity_id       VARCHAR(36) NOT NULL,
  action          TEXT NOT NULL,
  actor_id        VARCHAR(36) NOT NULL,
  actor_name      TEXT NOT NULL,
  changes         JSON,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

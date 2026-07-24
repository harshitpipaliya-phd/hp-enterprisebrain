-- Migration: 007_observability.sql
-- Story: S1-STORY-009 Enterprise Audit & Observability
-- Extends audit_logs and adds metrics, health checks, and structured logs.
-- Reversible: DROP TABLE IF EXISTS ...;

ALTER TABLE audit_logs ADD COLUMN org_id TEXT;
ALTER TABLE audit_logs ADD COLUMN session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN correlation_id TEXT;
ALTER TABLE audit_logs ADD COLUMN event_id TEXT;
ALTER TABLE audit_logs ADD COLUMN source TEXT DEFAULT 'api';
ALTER TABLE audit_logs ADD COLUMN execution_time INTEGER;
ALTER TABLE audit_logs ADD COLUMN status TEXT DEFAULT 'success';
ALTER TABLE audit_logs ADD COLUMN request_id TEXT;
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX idx_audit_logs_source ON audit_logs(source);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

CREATE TABLE IF NOT EXISTS metrics (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  tags JSON,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_metrics_tenant_id ON metrics(tenant_id);
CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_recorded_at ON metrics(recorded_at);

CREATE TABLE IF NOT EXISTS health_checks (
  id VARCHAR(36) PRIMARY KEY,
  check_name VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  details JSON,
  response_time INTEGER,
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_health_checks_name ON health_checks(check_name);
CREATE INDEX idx_health_checks_status ON health_checks(status);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at);

CREATE TABLE IF NOT EXISTS logs (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36),
  org_id VARCHAR(36),
  level VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  module TEXT,
  user_id VARCHAR(36),
  request_id VARCHAR(36),
  correlation_id VARCHAR(36),
  execution_time INTEGER,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_logs_tenant_id ON logs(tenant_id);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_logs_correlation_id ON logs(correlation_id);

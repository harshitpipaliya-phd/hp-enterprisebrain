-- Migration: 020_ai_governance.sql
-- AI Intelligence Integration Sprint: execution governance. Logged
-- regardless of which provider is configured — even a ProviderNotConfigured
-- failure gets a row.

CREATE TABLE IF NOT EXISTS ai_executions (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  user_id           VARCHAR(36) NOT NULL,
  service_name      TEXT NOT NULL,
  prompt_template_id VARCHAR(36),
  provider          VARCHAR(36) NOT NULL,
  model             TEXT,
  status            TEXT NOT NULL,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  latency_ms        INTEGER,
  estimated_cost_usd NUMERIC,
  error             TEXT,
  entity_type       TEXT,
  entity_id         VARCHAR(36),
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_ai_executions_tenant ON ai_executions (tenant_id, created_date DESC);

ALTER TABLE prompt_templates ADD COLUMN category TEXT;
ALTER TABLE prompt_templates ADD COLUMN default_model TEXT;
ALTER TABLE prompt_templates ADD COLUMN default_temperature NUMERIC DEFAULT 0.7;

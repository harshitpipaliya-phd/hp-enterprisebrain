-- Migration: 013_decision_intelligence.sql
-- Sprint 4: Decision Intelligence Engine
-- Adds genuinely missing fields to existing entities (no duplication) and one new
-- entity (risks — Risk was never part of any prior canonical entity list; adding
-- it here is the one addition, not a redesign of anything existing).

ALTER TABLE decisions ADD COLUMN confidence NUMERIC NOT NULL DEFAULT 0.5;
ALTER TABLE decisions ADD COLUMN explanation TEXT;
ALTER TABLE decisions ADD COLUMN trace JSON NOT NULL DEFAULT '[]';

ALTER TABLE evidence ADD COLUMN observed_date TIMESTAMP;
UPDATE evidence SET observed_date = created_date WHERE observed_date IS NULL;

ALTER TABLE recommendations ADD COLUMN urgency TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE recommendations ADD COLUMN expected_roi NUMERIC;

ALTER TABLE policies ADD COLUMN policy_type TEXT NOT NULL DEFAULT 'executor_autonomy';
ALTER TABLE policies ADD COLUMN rules JSON NOT NULL DEFAULT '[]';
ALTER TABLE policies ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE policies ADD COLUMN previous_version_id VARCHAR(36) REFERENCES policies(id);
ALTER TABLE policies MODIFY COLUMN policy_type VARCHAR(255) NOT NULL DEFAULT 'executor_autonomy';
CREATE INDEX idx_policies_type ON policies (tenant_id, policy_type);

CREATE TABLE IF NOT EXISTS risks (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  decision_id       VARCHAR(36) REFERENCES decisions(id),
  recommendation_id VARCHAR(36) REFERENCES recommendations(id),
  category          TEXT NOT NULL,
  probability        NUMERIC NOT NULL DEFAULT 0.5,
  impact            TEXT NOT NULL DEFAULT 'medium',
  score             NUMERIC NOT NULL DEFAULT 0,
  mitigation        TEXT,
  status            TEXT NOT NULL DEFAULT 'open',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_risks_tenant ON risks (tenant_id);
CREATE INDEX idx_risks_decision ON risks (tenant_id, decision_id);

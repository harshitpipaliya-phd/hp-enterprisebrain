-- Migration: 005_capability.sql
-- Story: S1-STORY-006 Capability (KASBA) Foundation
-- Creates the capabilities table with KASBA elements, plus capability_assignments
-- and capability_versions for linkage, versioning and audit.
-- Reversible: DROP TABLE IF EXISTS ...;

CREATE TABLE IF NOT EXISTS capabilities (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  org_id            VARCHAR(36) NOT NULL,
  capability_code   VARCHAR(255) NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  category          VARCHAR(255) NOT NULL DEFAULT 'general',
  capability_type   TEXT NOT NULL DEFAULT 'competency',
  difficulty        TEXT NOT NULL DEFAULT 'intermediate',
  criticality       TEXT NOT NULL DEFAULT 'medium',
  version           INTEGER NOT NULL DEFAULT 1,
  status            VARCHAR(255) NOT NULL DEFAULT 'active',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  knowledge         JSON,
  ability           JSON,
  skill             JSON,
  behaviour         JSON,
  attitude          JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_capabilities_tenant_code ON capabilities(tenant_id, capability_code);
CREATE INDEX idx_capabilities_tenant_id ON capabilities(tenant_id);
CREATE INDEX idx_capabilities_org_id ON capabilities(org_id);
CREATE INDEX idx_capabilities_category ON capabilities(category);
CREATE INDEX idx_capabilities_status ON capabilities(status);

CREATE TABLE IF NOT EXISTS capability_versions (
  id            VARCHAR(36) PRIMARY KEY,
  capability_id VARCHAR(36) NOT NULL,
  tenant_id     VARCHAR(36) NOT NULL,
  version       INTEGER NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  capability_type TEXT,
  difficulty    TEXT,
  criticality   TEXT,
  knowledge     JSON,
  ability       JSON,
  skill         JSON,
  behaviour     JSON,
  attitude      JSON,
  created_by    TEXT NOT NULL,
  created_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_capability_versions_cap ON capability_versions(capability_id);
CREATE INDEX idx_capability_versions_tenant ON capability_versions(tenant_id);

CREATE TABLE IF NOT EXISTS capability_assignments (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  capability_id VARCHAR(36) NOT NULL,
  target_type   VARCHAR(255) NOT NULL,
  target_id     VARCHAR(36) NOT NULL,
  assigned_by   TEXT NOT NULL,
  assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        TEXT NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_capability_assignments_uniq ON capability_assignments(tenant_id, capability_id, target_type, target_id);
CREATE INDEX idx_capability_assignments_tenant ON capability_assignments(tenant_id);
CREATE INDEX idx_capability_assignments_cap ON capability_assignments(capability_id);
CREATE INDEX idx_capability_assignments_target ON capability_assignments(target_type, target_id);

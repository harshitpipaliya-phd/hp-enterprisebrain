-- Migration: 001_organization.sql
-- Story: S1-STORY-003 Organization Management
-- Creates the organizations table with all required fields.
-- Reversible: DROP TABLE IF EXISTS organizations;

CREATE TABLE IF NOT EXISTS organizations (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  name            TEXT NOT NULL,
  legal_name      TEXT,
  org_code        VARCHAR(255) NOT NULL UNIQUE,
  industry        TEXT,
  country         TEXT,
  timezone        TEXT DEFAULT 'UTC',
  currency        TEXT DEFAULT 'USD',
  logo            TEXT,
  status          VARCHAR(255) NOT NULL DEFAULT 'active',
  created_by      TEXT NOT NULL,
  created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organizations_tenant_org_code_unique UNIQUE (tenant_id, org_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_status ON organizations(status);

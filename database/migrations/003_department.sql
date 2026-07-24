-- Migration: 003_department.sql
-- Story: S1-STORY-004 Department Management
-- Creates the departments table with hierarchy and head assignment.
-- Reversible: DROP TABLE IF EXISTS departments;

CREATE TABLE IF NOT EXISTS departments (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  department_type      TEXT NOT NULL DEFAULT 'department',
  parent_department_id VARCHAR(36),
  head_id              VARCHAR(36),
  org_id               VARCHAR(36) NOT NULL,
  status               VARCHAR(255) NOT NULL DEFAULT 'active',
  created_by           TEXT NOT NULL,
  created_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX idx_departments_org_id ON departments(org_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX idx_departments_status ON departments(status);

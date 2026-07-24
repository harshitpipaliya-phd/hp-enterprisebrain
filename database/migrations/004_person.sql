-- Migration: 004_person.sql
-- Story: S1-STORY-005 People Management
-- Creates the people table with identity fields, employment info, and relationships.
-- Reversible: DROP TABLE IF EXISTS people;

CREATE TABLE IF NOT EXISTS people (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  employee_id         VARCHAR(36) NOT NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  display_name        TEXT,
  email               VARCHAR(255) NOT NULL,
  phone               TEXT,
  profile_photo       TEXT,
  gender              TEXT,
  date_of_birth       DATE,
  employment_type     TEXT NOT NULL DEFAULT 'full_time',
  employment_status   TEXT NOT NULL DEFAULT 'active',
  joining_date        DATE,
  department_id       VARCHAR(36),
  manager_id          VARCHAR(36),
  designation         TEXT,
  location            TEXT,
  reporting_manager_id VARCHAR(36),
  org_id              VARCHAR(36) NOT NULL,
  status              VARCHAR(255) NOT NULL DEFAULT 'active',
  created_by          TEXT NOT NULL,
  created_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_people_tenant_employee_id ON people(tenant_id, employee_id);
CREATE UNIQUE INDEX idx_people_tenant_email ON people(tenant_id, email);
CREATE INDEX idx_people_tenant_id ON people(tenant_id);
CREATE INDEX idx_people_org_id ON people(org_id);
CREATE INDEX idx_people_department_id ON people(department_id);
CREATE INDEX idx_people_manager_id ON people(manager_id);
CREATE INDEX idx_people_status ON people(status);

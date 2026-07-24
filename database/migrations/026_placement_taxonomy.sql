-- Migration: 026_placement_taxonomy.sql
-- Placement Intelligence sprint, scoped. Company and Job Role entities —
-- structural only. Distinction from the Labour Market Provider case:
-- salary/hiring-pattern fields here are the INSTITUTION'S OWN record of
-- its own real placement relationships — not external market data being
-- fabricated. Safe to build as a real data-entry structure.

CREATE TABLE IF NOT EXISTS placement_companies (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  name              TEXT NOT NULL,
  industry          TEXT,
  preferred_skills  JSON NOT NULL DEFAULT '[]',
  notes             TEXT,
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS placement_job_roles (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  company_id        VARCHAR(36) NOT NULL REFERENCES placement_companies(id),
  title             TEXT NOT NULL,
  description       TEXT,
  min_salary        NUMERIC,
  max_salary        NUMERIC,
  status            TEXT NOT NULL DEFAULT 'open',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_placement_job_roles_company ON placement_job_roles (tenant_id, company_id);

-- Identical shape to occupation_capability_requirements (Career
-- Intelligence sprint) deliberately — the same gap-analysis function
-- serves both career pathways and job roles, no new algorithm needed.
CREATE TABLE IF NOT EXISTS job_role_capability_requirements (
  tenant_id       VARCHAR(36) NOT NULL,
  job_role_id     VARCHAR(36) NOT NULL REFERENCES placement_job_roles(id),
  capability_id   VARCHAR(36) NOT NULL REFERENCES capabilities(id),
  required_level  NUMERIC NOT NULL DEFAULT 3,
  PRIMARY KEY (job_role_id, capability_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_job_role_requirements_tenant ON job_role_capability_requirements (tenant_id);

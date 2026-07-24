-- Migration: 024_career_taxonomy.sql
-- Career Intelligence sprint, scoped. Real schema for career clusters,
-- occupations, and pathways — structure only. Deliberately NOT
-- pre-populated with fabricated occupations, salary figures, or demand
-- data. A school or a real labour-market data import populates this
-- table with real content; this migration only creates the place for it.

CREATE TABLE IF NOT EXISTS career_clusters (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  code          VARCHAR(255) NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    TEXT NOT NULL,
  created_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE UNIQUE INDEX idx_career_clusters_code ON career_clusters (tenant_id, code);

CREATE TABLE IF NOT EXISTS occupations (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  cluster_id        VARCHAR(36) REFERENCES career_clusters(id),
  occupation_code   VARCHAR(255) NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE UNIQUE INDEX idx_occupations_code ON occupations (tenant_id, occupation_code);

-- The link that makes gap analysis possible: which existing Capability
-- records a given occupation requires, and at what target level. Reuses
-- the real Capability entity rather than duplicating competency data.
CREATE TABLE IF NOT EXISTS occupation_capability_requirements (
  tenant_id       VARCHAR(36) NOT NULL,
  occupation_id   VARCHAR(36) NOT NULL REFERENCES occupations(id),
  capability_id   VARCHAR(36) NOT NULL REFERENCES capabilities(id),
  required_level  NUMERIC NOT NULL DEFAULT 3,
  PRIMARY KEY (occupation_id, capability_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_occupation_requirements_tenant ON occupation_capability_requirements (tenant_id);

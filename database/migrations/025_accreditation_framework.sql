-- Migration: 025_accreditation_framework.sql
-- Higher Education Intelligence sprint, scoped. Generic structural
-- container for accreditation compliance tracking — deliberately NOT
-- pre-populated with NAAC/NBA/NIRF/ABET/AACSB criteria. Those are real,
-- current, formally defined by external accreditation bodies; inventing
-- them here would risk an institution submitting fabricated criteria in a
-- real accreditation review. A real accreditation office enters the real,
-- current criteria; this migration only creates the place for that
-- content and its supporting evidence to live.

CREATE TABLE IF NOT EXISTS accreditation_frameworks (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  name          TEXT NOT NULL,
  cycle_label   TEXT,
  created_by    TEXT NOT NULL,
  created_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accreditation_criteria (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  framework_id    VARCHAR(36) NOT NULL REFERENCES accreditation_frameworks(id),
  criterion_code  TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'not_started',
  created_by      TEXT NOT NULL,
  created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_accreditation_criteria_framework ON accreditation_criteria (tenant_id, framework_id);

-- Reuses the existing Evidence entity — a criterion is satisfied by real
-- institutional evidence, not a new evidence subsystem.
CREATE TABLE IF NOT EXISTS criterion_evidence (
  tenant_id     VARCHAR(36) NOT NULL,
  criterion_id  VARCHAR(36) NOT NULL REFERENCES accreditation_criteria(id),
  evidence_id   VARCHAR(36) NOT NULL REFERENCES evidence(id),
  linked_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (criterion_id, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_criterion_evidence_tenant ON criterion_evidence (tenant_id);

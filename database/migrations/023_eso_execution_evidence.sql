-- Migration: 023_eso_execution_evidence.sql
-- ESO Engine sprint, scoped. Real gap: EsoExecution never linked to actual
-- Evidence records. Reuses the existing Evidence entity rather than
-- inventing a new Document/Image/Video evidence subsystem — no file
-- storage infrastructure exists in this project.

CREATE TABLE IF NOT EXISTS eso_execution_evidence (
  tenant_id     VARCHAR(36) NOT NULL,
  execution_id  VARCHAR(36) NOT NULL REFERENCES eso_executions(id),
  evidence_id   VARCHAR(36) NOT NULL REFERENCES evidence(id),
  linked_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (execution_id, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_eso_execution_evidence_tenant ON eso_execution_evidence (tenant_id);

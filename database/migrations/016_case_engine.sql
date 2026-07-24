-- Migration: 016_case_engine.sql
-- EPIC-004 Case Engine — designed before Sprint 1, never implemented until now.
-- Case and Hypothesis graph constraints have existed since graph/migrations/
-- 001_constraints.cypher; this is the first migration to give them a Postgres
-- table, per EPIC-004's own acceptance criteria (F-004.1 through F-004.5).

-- Case state machine per EPIC-004 F-004.4: open -> investigating ->
-- hypothesized -> resolved -> closed.
CREATE TABLE IF NOT EXISTS cases (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  signal_id         VARCHAR(36) REFERENCES signals(id), -- F-004.1: case creation from signals
  title             TEXT NOT NULL,
  description       TEXT,
  status            VARCHAR(255) NOT NULL DEFAULT 'open', -- open | investigating | hypothesized | resolved | closed
  resolved_hypothesis_id VARCHAR(36), -- set when the case concludes; FK added after hypotheses table exists
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_cases_tenant ON cases (tenant_id);
CREATE INDEX idx_cases_signal ON cases (tenant_id, signal_id);
CREATE INDEX idx_cases_status ON cases (tenant_id, status);

-- Append-only per EPIC-004 F-004.2 ("Hypothesis node, append-only") and the
-- same graph/README.md ledger convention every other append-only entity in
-- this schema follows (ReasoningStep, Outcome, Learning). A hypothesis is
-- never edited or deleted once recorded — rejecting one means recording a
-- new hypothesis with status='rejected', not erasing the attempt. That
-- rejection trail IS the deliberation record §8 asks for.
CREATE TABLE IF NOT EXISTS hypotheses (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  case_id           VARCHAR(36) NOT NULL REFERENCES cases(id),
  statement         TEXT NOT NULL, -- the hypothesis itself, e.g. "Low homework completion is a Motivation issue, not a Capability gap"
  root_cause_family TEXT NOT NULL, -- one of the 8 families in contracts/taxonomy/root-cause.schema.yaml — validated in code against the generated type, not re-declared here as a CHECK constraint, so the contract stays the single source of truth
  confidence        NUMERIC NOT NULL DEFAULT 0.5,
  status            TEXT NOT NULL DEFAULT 'proposed', -- proposed | supported | rejected | confirmed
  supporting_evidence_ids JSON NOT NULL DEFAULT '[]', -- entity references the response cited, once retrieval exists
  rejected_reason   TEXT, -- set when status = rejected: what evidence/probe ruled it out
  proposed_by       TEXT NOT NULL, -- actor id, human or 'system:reasoning-engine'
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_hypotheses_tenant ON hypotheses (tenant_id);
CREATE INDEX idx_hypotheses_case ON hypotheses (tenant_id, case_id);

ALTER TABLE cases ADD CONSTRAINT fk_cases_resolved_hypothesis
  FOREIGN KEY (resolved_hypothesis_id) REFERENCES hypotheses(id);

-- F-004.5: Case <-> Evidence <-> ESO linkage. Evidence already exists
-- (Sprint 2); this join table is the missing link, not a new Evidence concept.
-- tenant_id is carried here too, even though case_id/evidence_id are already
-- tenant-scoped by their own foreign keys — every table in this schema has
-- carried tenant_id without exception since Sprint 1; a join table isn't a
-- reason to break that.
CREATE TABLE IF NOT EXISTS case_evidence (
  tenant_id    VARCHAR(36) NOT NULL,
  case_id      VARCHAR(36) NOT NULL REFERENCES cases(id),
  evidence_id  VARCHAR(36) NOT NULL REFERENCES evidence(id),
  linked_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (case_id, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_case_evidence_tenant ON case_evidence (tenant_id);

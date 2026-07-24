-- Migration: 022_kasba_task_hierarchy.sql
-- KASBA Intelligence Engine (Sprint 15, scoped). Two real, additive gaps in
-- the existing model — Capability already has real K/A/S/B/A fields since
-- Sprint 1, not redesigned here. What's missing:
--
-- 1. Task hierarchy: Capability -> Task -> SubTask never existed as an
--    explicit table.
-- 2. Per-person proficiency: KasbaElement.targetLevel/currentLevel live on
--    the Capability DEFINITION, not on a specific person's assignment —
--    there was no way to record an individual's actual assessed level.

CREATE TABLE IF NOT EXISTS capability_tasks (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  capability_id     VARCHAR(36) NOT NULL REFERENCES capabilities(id),
  parent_task_id    VARCHAR(36) REFERENCES capability_tasks(id),
  name              TEXT NOT NULL,
  description       TEXT,
  evidence_required BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'active',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_capability_tasks_capability ON capability_tasks (tenant_id, capability_id);
CREATE INDEX idx_capability_tasks_parent ON capability_tasks (tenant_id, parent_task_id);

-- Per-person proficiency snapshot. Real scores go here as actually
-- assessed — a row with all-null levels means "assigned, not yet
-- assessed", the honest default, not a fabricated starting score.
CREATE TABLE IF NOT EXISTS capability_proficiency (
  id                    VARCHAR(36) PRIMARY KEY,
  tenant_id             VARCHAR(36) NOT NULL,
  assignment_id         VARCHAR(36) NOT NULL REFERENCES capability_assignments(id),
  knowledge_level       NUMERIC,
  ability_level         NUMERIC,
  skill_level           NUMERIC,
  behaviour_level       NUMERIC,
  attitude_level        NUMERIC,
  evidence_confidence   NUMERIC,
  assessed_by           TEXT,
  assessed_date         TIMESTAMP,
  created_date          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_capability_proficiency_assignment ON capability_proficiency (tenant_id, assignment_id);

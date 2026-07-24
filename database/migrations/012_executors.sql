-- Migration: 012_executors.sql
-- Story: Sprint 3 Story 5 - Executor Resolver (capability/availability/workload matching)
-- The (:Executor) graph node was constrained pre-Sprint-1 but never had a Postgres
-- table or any populated data. This is the real gap: without executor records,
-- capability/availability/workload matching has nothing to match against.

CREATE TABLE IF NOT EXISTS executors (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  executor_type     VARCHAR(255) NOT NULL,
  name              TEXT NOT NULL,
  person_id         VARCHAR(36) REFERENCES people(id),
  capability_tags   JSON NOT NULL DEFAULT '[]',
  trust_level       NUMERIC NOT NULL DEFAULT 0.5,
  max_concurrent    INTEGER NOT NULL DEFAULT 1,
  current_workload  INTEGER NOT NULL DEFAULT 0,
  available         BOOLEAN NOT NULL DEFAULT true,
  status            TEXT NOT NULL DEFAULT 'active',
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_executors_tenant ON executors (tenant_id);
CREATE INDEX idx_executors_type ON executors (tenant_id, executor_type);

-- Migration: 015_department_scoped_signals.sql
-- Sprint 7: Department-scoped analytics.
--
-- Attribution decision (from SPRINT5_ARCHITECTURE.md's open question): a
-- Signal attributes to the department of the org unit it concerns, when known
-- — NOT to the department of whoever happened to create it. This column is
-- nullable and additive; a Signal with no department_id simply doesn't show
-- up in department-scoped views, it still shows up everywhere else exactly
-- as before. No existing column, default, or query is changed.

ALTER TABLE signals ADD COLUMN department_id TEXT;
ALTER TABLE signals MODIFY COLUMN department_id VARCHAR(36);
CREATE INDEX idx_signals_department ON signals (tenant_id, department_id);

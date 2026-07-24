-- Migration: 019_notifications_and_settings.sql
-- Product completion pass: closes two gaps FEATURE_MATRIX.md found as
-- genuinely missing (not blocked on any decision) — real notification
-- persistence (the consumer existed since Sprint 1 as a logging stub, never
-- delivering anything) and a settings store (zero settings existed before).

CREATE TABLE IF NOT EXISTS notifications (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  user_id           VARCHAR(36) NOT NULL,
  type              TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  entity_type       TEXT,
  entity_id         VARCHAR(36),
  read_date         TIMESTAMP,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_notifications_user ON notifications (tenant_id, user_id, created_date DESC);
CREATE INDEX idx_notifications_unread ON notifications (tenant_id, user_id);

-- Simple key-value settings store, tenant-scoped and optionally user-scoped.
-- Postgres primary keys can't contain NULL, so tenant-wide settings use the
-- sentinel user_id '_org_' rather than NULL — explicit and queryable, not a
-- NULL-handling edge case.
CREATE TABLE IF NOT EXISTS settings (
  tenant_id   VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL DEFAULT '_org_',
  `key`       VARCHAR(255) NOT NULL,
  value       JSON NOT NULL,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, user_id, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

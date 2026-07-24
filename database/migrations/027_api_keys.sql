-- Migration: 027_api_keys.sql
-- Public API Platform sprint, scoped to the one piece that's real,
-- bounded, and needs no vendor decision: API keys for programmatic access.
-- Keys are hashed at rest (SHA-256) — the same discipline as password
-- storage. The raw key is shown to the user exactly once, at creation.

CREATE TABLE IF NOT EXISTS api_keys (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  user_id       VARCHAR(36) NOT NULL,
  name          TEXT NOT NULL,
  key_hash      VARCHAR(255) NOT NULL,
  key_prefix    TEXT NOT NULL,
  scopes        JSON NOT NULL DEFAULT '[]',
  last_used_date TIMESTAMP,
  revoked_date  TIMESTAMP,
  created_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_date  TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_tenant ON api_keys (tenant_id, user_id);

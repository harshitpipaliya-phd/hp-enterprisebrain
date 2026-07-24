CREATE TABLE IF NOT EXISTS tenants (
  id              VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  region          VARCHAR(100) NOT NULL DEFAULT 'default',
  status          VARCHAR(50) NOT NULL DEFAULT 'provisioning',
  created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
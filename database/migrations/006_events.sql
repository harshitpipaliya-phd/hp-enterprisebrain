-- Migration: 006_events.sql
-- Story: S1-STORY-008 Enterprise Event Backbone
-- Creates the event store (outbox) table with append-only semantics.
-- Reversible: DROP TABLE IF EXISTS event_store;

CREATE TABLE IF NOT EXISTS event_store (
  id                VARCHAR(36) PRIMARY KEY,
  type              VARCHAR(255) NOT NULL,
  tenant_id         VARCHAR(36) NOT NULL,
  entity_type       VARCHAR(255) NOT NULL,
  entity_id         VARCHAR(36) NOT NULL,
  actor_id          VARCHAR(36) NOT NULL,
  payload           JSON NOT NULL,
  metadata          JSON,
  correlation_id    VARCHAR(36),
  causation_id      VARCHAR(36),
  idempotency_key   VARCHAR(36),
  status            VARCHAR(255) NOT NULL DEFAULT 'pending',
  retry_count       INTEGER NOT NULL DEFAULT 0,
  last_retry_at     TIMESTAMP,
  failure_reason    TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at      TIMESTAMP,
  completed_at      TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_event_store_tenant_id ON event_store(tenant_id);
CREATE INDEX idx_event_store_type ON event_store(type);
CREATE INDEX idx_event_store_entity ON event_store(entity_type, entity_id);
CREATE INDEX idx_event_store_status ON event_store(status);
CREATE INDEX idx_event_store_created_at ON event_store(created_at);
CREATE INDEX idx_event_store_correlation ON event_store(correlation_id);
CREATE UNIQUE INDEX idx_event_store_idempotency ON event_store(idempotency_key);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id                VARCHAR(36) PRIMARY KEY,
  event_id          VARCHAR(36) NOT NULL REFERENCES event_store(id),
  consumer_name     VARCHAR(255) NOT NULL,
  error_message     TEXT NOT NULL,
  error_stack       TEXT,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  max_retries       INTEGER NOT NULL DEFAULT 3,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_dlq_event_id ON dead_letter_queue(event_id);
CREATE INDEX idx_dlq_consumer ON dead_letter_queue(consumer_name);
CREATE INDEX idx_dlq_created_at ON dead_letter_queue(created_at);

CREATE TABLE IF NOT EXISTS consumer_state (
  id                VARCHAR(36) PRIMARY KEY,
  consumer_name     VARCHAR(255) NOT NULL UNIQUE,
  last_processed_event_id VARCHAR(36) REFERENCES event_store(id),
  last_processed_at TIMESTAMP,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_state_name ON consumer_state(consumer_name);

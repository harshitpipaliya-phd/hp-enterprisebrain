-- Migration: 018_conversation_pinning.sql
-- Sprint 9 (scoped): Conversation Management UI needs pinning and soft-delete,
-- neither of which existed on conversation_sessions (migration 017). Additive
-- only — no existing column touched.

ALTER TABLE conversation_sessions ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE conversation_sessions ADD COLUMN deleted_date TIMESTAMP;
CREATE INDEX idx_conversation_sessions_pinned ON conversation_sessions (tenant_id, pinned);

-- Migration: 017_conversation_engine.sql
-- Sprint 9 (partial, deliberately): conversation storage.
--
-- This is the ONE part of "AI Copilot" that doesn't depend on an LLM vendor
-- decision — sessions, messages, prompt templates are the same schema no
-- matter which provider eventually answers a message. Actual generation,
-- streaming, and retrieval are NOT built here — see the accompanying report
-- for why those specifically need your decision first, not more engineering.

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  org_id            VARCHAR(36),
  title             TEXT NOT NULL DEFAULT 'New conversation',
  context_type      TEXT, -- e.g. 'case', 'signal', 'general' — what this conversation is scoped to, if anything
  context_entity_id VARCHAR(36), -- the Case/Signal/etc id, if context_type is set
  created_by        VARCHAR(255) NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_conversation_sessions_tenant ON conversation_sessions (tenant_id);
CREATE INDEX idx_conversation_sessions_user ON conversation_sessions (tenant_id, created_by);

-- Append-only, same convention as every other ledger in this schema — a
-- conversation's history is never edited or deleted, only added to.
CREATE TABLE IF NOT EXISTS conversation_messages (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  session_id        VARCHAR(36) NOT NULL REFERENCES conversation_sessions(id),
  `role`            TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content           TEXT NOT NULL,
  citations         JSON NOT NULL DEFAULT '[]', -- entity references the response cited, once retrieval exists
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_conversation_messages_session ON conversation_messages (tenant_id, session_id);

-- Prompt templates: the one piece of "AI Copilot" that's genuinely just
-- data, reusable across whichever provider gets chosen. Versioned the same
-- way Policy already is — a new row per version, not an in-place edit.
CREATE TABLE IF NOT EXISTS prompt_templates (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  name              TEXT NOT NULL,
  template          TEXT NOT NULL, -- with {{variable}} placeholders
  variables         JSON NOT NULL DEFAULT '[]',
  version           INTEGER NOT NULL DEFAULT 1,
  previous_version_id VARCHAR(36) REFERENCES prompt_templates(id),
  status            TEXT NOT NULL DEFAULT 'active',
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_prompt_templates_tenant ON prompt_templates (tenant_id);

-- Migration: 028_guardians.sql
-- Parent Intelligence MVP milestone. The one genuinely new entity across
-- this 8-milestone document. Structural only: a guardian's identity,
-- contact info, and relationship to a student. Deliberately does NOT
-- include "Communication Intelligence" or "Engagement Analytics" tables —
-- those would need real parent-teacher communication records or
-- engagement events that don't exist; fabricating analytics over data
-- that isn't there would be worse than not building it.

CREATE TABLE IF NOT EXISTS guardians (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  student_person_id VARCHAR(36) NOT NULL REFERENCES people(id),
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  relationship      TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  created_by        TEXT NOT NULL,
  created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_guardians_student ON guardians (tenant_id, student_person_id);

// Canonical data model v0 -- constraints.
// Labels are domain nouns (Engineering Blueprint section 6).
// tenantId NOT NULL on every node -- exit criterion #6.
// tenantId included so the CI tenant-isolation guard passes.

CREATE CONSTRAINT person_id       IF NOT EXISTS FOR (n:Person)     REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT person_tenant   IF NOT EXISTS FOR (n:Person)     REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT orgunit_id      IF NOT EXISTS FOR (n:OrgUnit)    REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT orgunit_tenant  IF NOT EXISTS FOR (n:OrgUnit)    REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT role_id         IF NOT EXISTS FOR (n:Role)       REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT role_tenant     IF NOT EXISTS FOR (n:Role)       REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT capability_id     IF NOT EXISTS FOR (n:Capability) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT capability_tenant IF NOT EXISTS FOR (n:Capability) REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT evidence_id     IF NOT EXISTS FOR (n:Evidence)   REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT evidence_tenant IF NOT EXISTS FOR (n:Evidence)   REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT case_id         IF NOT EXISTS FOR (n:Case)       REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT case_tenant     IF NOT EXISTS FOR (n:Case)       REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT eso_id          IF NOT EXISTS FOR (n:ESO)        REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT eso_tenant      IF NOT EXISTS FOR (n:ESO)        REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT executor_id     IF NOT EXISTS FOR (n:Executor)   REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT executor_tenant IF NOT EXISTS FOR (n:Executor)   REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT outcome_id      IF NOT EXISTS FOR (n:Outcome)    REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT outcome_tenant  IF NOT EXISTS FOR (n:Outcome)    REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT learning_id     IF NOT EXISTS FOR (n:Learning)   REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT learning_tenant IF NOT EXISTS FOR (n:Learning)   REQUIRE n.tenantId IS NOT NULL;

CREATE CONSTRAINT hypothesis_id     IF NOT EXISTS FOR (n:Hypothesis) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT hypothesis_tenant IF NOT EXISTS FOR (n:Hypothesis) REQUIRE n.tenantId IS NOT NULL;

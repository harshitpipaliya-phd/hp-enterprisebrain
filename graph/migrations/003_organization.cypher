// Migration: 003_organization.cypher
// Story: S1-STORY-003 Organization Management
// Adds (:Organization) node constraints for tenant isolation.
// Does NOT edit shipped migrations 001_constraints.cypher or 002_tenant.cypher.

CREATE CONSTRAINT organization_id       IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT organization_tenant   IF NOT EXISTS FOR (n:Organization) REQUIRE n.tenantId IS NOT NULL;
CREATE CONSTRAINT organization_code     IF NOT EXISTS FOR (n:Organization) REQUIRE n.orgCode IS NOT NULL;

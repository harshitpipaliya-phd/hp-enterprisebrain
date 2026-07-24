// Migration: 004_department.cypher
// Story: S1-STORY-004 Department Management
// Adds (:Department) node constraints for tenant isolation.
// Does NOT edit shipped migrations 001_constraints.cypher, 002_tenant.cypher, or 003_organization.cypher.

CREATE CONSTRAINT department_id       IF NOT EXISTS FOR (n:Department) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT department_tenant   IF NOT EXISTS FOR (n:Department) REQUIRE n.tenantId IS NOT NULL;
CREATE CONSTRAINT department_org_id   IF NOT EXISTS FOR (n:Department) REQUIRE n.orgId IS NOT NULL;

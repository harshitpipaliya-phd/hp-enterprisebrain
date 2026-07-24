// Migration: 006_capability.cypher
// Story: S1-STORY-006 Capability (KASBA) Foundation
// Adds (:Capability) node constraints for tenant isolation and identity.
// Does NOT edit shipped migrations 001_constraints.cypher, 002_tenant.cypher,
// 003_organization.cypher, 004_department.cypher, or 005_person.cypher.

CREATE CONSTRAINT capability_id         IF NOT EXISTS FOR (n:Capability) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT capability_tenant     IF NOT EXISTS FOR (n:Capability) REQUIRE n.tenantId IS NOT NULL;
CREATE CONSTRAINT capability_code      IF NOT EXISTS FOR (n:Capability) REQUIRE n.capabilityCode IS NOT NULL;

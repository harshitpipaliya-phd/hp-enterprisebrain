// Migration: 005_person.cypher
// Story: S1-STORY-005 People Management
// Adds (:Person) node constraints for tenant isolation and identity.
// Does NOT edit shipped migrations 001_constraints.cypher, 002_tenant.cypher, 003_organization.cypher, or 004_department.cypher.

CREATE CONSTRAINT person_id         IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT person_tenant     IF NOT EXISTS FOR (n:Person) REQUIRE n.tenantId IS NOT NULL;
CREATE CONSTRAINT person_employee_id IF NOT EXISTS FOR (n:Person) REQUIRE n.employeeId IS NOT NULL;
CREATE CONSTRAINT person_email      IF NOT EXISTS FOR (n:Person) REQUIRE n.email IS NOT NULL;

// Migration: 008_risk.cypher
// Sprint 4 Story 6: Risk Engine — Risk was never part of any prior canonical
// entity list. This is the one new graph node label this sprint adds.
// Does NOT edit any shipped migration 001-007.

CREATE CONSTRAINT risk_id     IF NOT EXISTS FOR (n:Risk) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT risk_tenant IF NOT EXISTS FOR (n:Risk) REQUIRE n.tenantId IS NOT NULL;

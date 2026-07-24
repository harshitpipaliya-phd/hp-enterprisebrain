import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config.js';

/**
 * Neo4j integration (Sprint 1, Story 1).
 *
 * The driver is the only place that talks to Neo4j. Every session returned by
 * `sessionFor(tenantId)` is tenant-scoped: callers MUST pass tenantId and the
 * repository layer injects it into every Cypher (exit criterion #6; enforced by
 * .github/workflows/tenant-isolation.yml — any MATCH/MERGE without tenantId fails CI).
 */

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD),
      // Same real gap as the Postgres pool (database/src/connection.ts):
      // no timeout meant an unreachable Neo4j hung for a long default
      // instead of failing fast for health checks / load balancers.
      { connectionTimeout: 3000 },
    );
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Open a session already bound to a tenant. The tenantId is captured here so it
 * cannot be omitted downstream. All repository queries run through this session.
 */
export function sessionFor(tenantId: string): TenantSession {
  if (!tenantId) throw new Error('tenantId is required for every Neo4j session');
  const s = getDriver().session();
  (s as unknown as { tenantId: string }).tenantId = tenantId;
  return s as TenantSession;
}

export type TenantSession = Session & { tenantId: string };

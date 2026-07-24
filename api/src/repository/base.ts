import type { TenantSession } from '../neo4j/client.js';

/**
 * Repository Foundation (Sprint 1, Story 1).
 *
 * Base class for all entity repositories. It guarantees one invariant:
 *   EVERY Cypher executed through `run` contains the tenantId predicate.
 *
 * This mirrors the CI rule in .github/workflows/tenant-isolation.yml
 * (any MATCH/MERGE without `tenantId` fails the build) and the graph rule in
 * graph/README.md ("Every node carries tenantId").
 */

export interface QueryResult {
  records: Array<Record<string, unknown>>;
}

export abstract class BaseRepository {
  constructor(protected session: TenantSession) {}

  /** The tenant this repository is bound to. */
  get tenantId(): string {
    return this.session.tenantId;
  }

  /**
   * Execute a Cypher query. The query MUST include a `tenantId` parameter and a
   * matching predicate; we assert the parameter is present before executing so a
   * missing-tenantId query fails fast instead of reaching Neo4j.
   */
  protected async run(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<QueryResult> {
    if (!('tenantId' in params) || params.tenantId == null) {
      throw new Error(
        'BaseRepository: every query requires a tenantId parameter (exit criterion #6).',
      );
    }
    if (!/tenantId/i.test(cypher)) {
      throw new Error(
        'BaseRepository: Cypher must reference tenantId in a MATCH/MERGE/WHERE clause.',
      );
    }
    const res = await this.session.run(cypher, params);
    return {
      records: res.records.map((r) => r.toObject() as Record<string, unknown>),
    };
  }

  /** Close the underlying session. */
  async close(): Promise<void> {
    await this.session.close();
  }
}

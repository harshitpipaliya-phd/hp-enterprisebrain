export class BaseRepository {
    session;
    constructor(session) {
        this.session = session;
    }
    /** The tenant this repository is bound to. */
    get tenantId() {
        return this.session.tenantId;
    }
    /**
     * Execute a Cypher query. The query MUST include a `tenantId` parameter and a
     * matching predicate; we assert the parameter is present before executing so a
     * missing-tenantId query fails fast instead of reaching Neo4j.
     */
    async run(cypher, params = {}) {
        if (!('tenantId' in params) || params.tenantId == null) {
            throw new Error('BaseRepository: every query requires a tenantId parameter (exit criterion #6).');
        }
        if (!/tenantId/i.test(cypher)) {
            throw new Error('BaseRepository: Cypher must reference tenantId in a MATCH/MERGE/WHERE clause.');
        }
        const res = await this.session.run(cypher, params);
        return {
            records: res.records.map((r) => r.toObject()),
        };
    }
    /** Close the underlying session. */
    async close() {
        await this.session.close();
    }
}

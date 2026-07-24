import { getPool } from './connection.js';
export const SEARCHABLE_ENTITIES = ['signal', 'evidence', 'recommendation', 'decision', 'learning'];
export class SearchRepository {
    async search(tenantId, query, entityTypes) {
        const types = entityTypes && entityTypes.length > 0 ? entityTypes : SEARCHABLE_ENTITIES;
        const pattern = `%${query}%`;
        const results = [];
        const pool = getPool();
        if (types.includes('signal')) {
            const [rows] = await pool.query(`SELECT id, source AS headline, created_date FROM signals WHERE tenant_id = ? AND (LOWER(source) LIKE LOWER(?) OR LOWER(classification) LIKE LOWER(?)) ORDER BY created_date DESC LIMIT 20`, [tenantId, pattern, pattern]);
            results.push(...rows.map((row) => this.mapRow('signal', row)));
        }
        if (types.includes('evidence')) {
            const [rows] = await pool.query(`SELECT id, source AS headline, created_date FROM evidence WHERE tenant_id = ? AND (LOWER(source) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?)) ORDER BY created_date DESC LIMIT 20`, [tenantId, pattern, pattern]);
            results.push(...rows.map((row) => this.mapRow('evidence', row)));
        }
        if (types.includes('recommendation')) {
            const [rows] = await pool.query(`SELECT id, title AS headline, created_date FROM recommendations WHERE tenant_id = ? AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)) ORDER BY created_date DESC LIMIT 20`, [tenantId, pattern, pattern]);
            results.push(...rows.map((row) => this.mapRow('recommendation', row)));
        }
        if (types.includes('decision')) {
            const [rows] = await pool.query(`SELECT id, rationale AS headline, created_date FROM decisions WHERE tenant_id = ? AND LOWER(rationale) LIKE LOWER(?) ORDER BY created_date DESC LIMIT 20`, [tenantId, pattern]);
            results.push(...rows.map((row) => this.mapRow('decision', row)));
        }
        if (types.includes('learning')) {
            const [rows] = await pool.query(`SELECT id, pattern AS headline, created_date FROM learnings WHERE tenant_id = ? AND LOWER(pattern) LIKE LOWER(?) ORDER BY created_date DESC LIMIT 20`, [tenantId, pattern]);
            results.push(...rows.map((row) => this.mapRow('learning', row)));
        }
        return results.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    }
    mapRow(entityType, row) {
        return {
            entityType,
            id: String(row.id),
            headline: String(row.headline ?? ''),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

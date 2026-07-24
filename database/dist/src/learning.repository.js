import { getPool } from './connection.js';
export class LearningRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO learnings (id, tenant_id, outcome_id, mental_model_id, pattern, description, confidence, reusable, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?)`, [
            id, input.tenantId, input.outcomeId ?? null, input.mentalModelId ?? null, input.pattern,
            input.description ?? null, input.confidence ?? 0.5, input.reusable ?? true, input.createdBy, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM learnings WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM learnings WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    async findReusable(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM learnings WHERE tenant_id = ? AND reusable = 1 ORDER BY confidence DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            outcomeId: row.outcome_id,
            mentalModelId: row.mental_model_id,
            pattern: String(row.pattern),
            description: row.description,
            confidence: Number(row.confidence),
            reusable: Boolean(row.reusable),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

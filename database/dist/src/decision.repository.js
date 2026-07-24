import { getPool } from './connection.js';
export const EXECUTOR_TYPES = ['human', 'ai_agent', 'software', 'hybrid'];
export class DecisionRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO decisions (id, tenant_id, recommendation_id, decided_by, executor_type, rationale, alternatives_considered, confidence, explanation, trace, status, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [
            id, input.tenantId, input.recommendationId ?? null, input.decidedBy, input.executorType, input.rationale,
            JSON.stringify(input.alternativesConsidered ?? []), input.confidence ?? 0.5, input.explanation ?? null,
            JSON.stringify(input.trace ?? []), input.status ?? 'approved', now,
        ]);
        const [rows] = await pool.query('SELECT * FROM decisions WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM decisions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM decisions WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            recommendationId: row.recommendation_id,
            decidedBy: String(row.decided_by),
            executorType: row.executor_type,
            rationale: String(row.rationale),
            alternativesConsidered: row.alternatives_considered ?? [],
            confidence: Number(row.confidence ?? 0.5),
            explanation: row.explanation,
            trace: row.trace ?? [],
            status: String(row.status),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

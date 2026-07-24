import { getPool } from './connection.js';
export const RISK_CATEGORIES = ['operational', 'financial', 'compliance', 'reputational', 'strategic'];
export const RISK_IMPACTS = ['low', 'medium', 'high', 'critical'];
export const RISK_STATUSES = ['open', 'mitigated', 'accepted', 'realized'];
export class RiskRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO risks (id, tenant_id, decision_id, recommendation_id, category, probability, impact, score, mitigation, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,'open',?,?,?)`, [
            id, input.tenantId, input.decisionId ?? null, input.recommendationId ?? null, input.category,
            input.probability, input.impact, input.score, input.mitigation ?? null,
            input.createdBy, now, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM risks WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM risks WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByDecision(tenantId, decisionId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM risks WHERE tenant_id = ? AND decision_id = ? ORDER BY score DESC', [tenantId, decisionId]);
        return rows.map((r) => this.mapRow(r));
    }
    async list(tenantId, status) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (status) {
            clauses.push('status = ?');
            params.push(status);
        }
        const [rows] = await pool.query(`SELECT * FROM risks WHERE ${clauses.join(' AND ')} ORDER BY score DESC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async mitigate(tenantId, id, mitigation) {
        const pool = getPool();
        await pool.execute(`UPDATE risks SET status = 'mitigated', mitigation = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`, [mitigation, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM risks WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            decisionId: row.decision_id,
            recommendationId: row.recommendation_id,
            category: row.category,
            probability: Number(row.probability),
            impact: row.impact,
            score: Number(row.score),
            mitigation: row.mitigation,
            status: row.status,
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

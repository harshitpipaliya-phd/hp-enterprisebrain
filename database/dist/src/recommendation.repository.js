import { getPool } from './connection.js';
export const RECOMMENDATION_CATEGORIES = ['risk', 'opportunity', 'watch', 'compliance'];
export class RecommendationRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO recommendations (id, tenant_id, reasoning_step_id, category, title, description, priority, urgency, confidence, impact, expected_roi, cost, risk, dependencies, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?)`, [
            id, input.tenantId, input.reasoningStepId ?? null, input.category, input.title, input.description ?? null,
            input.priority ?? 'medium', input.urgency ?? 'normal', input.confidence, input.impact ?? null, input.expectedRoi ?? null,
            input.cost ?? null, input.risk ?? null,
            JSON.stringify(input.dependencies ?? []), input.createdBy, now, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM recommendations WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM recommendations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, status) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (status) {
            clauses.push('status = ?');
            params.push(status);
        }
        const [rows] = await pool.query(`SELECT * FROM recommendations WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async updateStatus(tenantId, id, status) {
        const pool = getPool();
        await pool.execute(`UPDATE recommendations SET status = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`, [status, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM recommendations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            reasoningStepId: row.reasoning_step_id,
            category: row.category,
            title: String(row.title),
            description: row.description,
            priority: String(row.priority),
            urgency: String(row.urgency ?? 'normal'),
            confidence: Number(row.confidence),
            impact: row.impact,
            expectedRoi: row.expected_roi != null ? Number(row.expected_roi) : null,
            cost: row.cost,
            risk: row.risk,
            dependencies: row.dependencies ?? [],
            status: String(row.status),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

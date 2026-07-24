import { getPool } from './connection.js';
export class ReasoningStepRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO reasoning_steps (id, tenant_id, case_id, signal_id, mental_model_id, step_order, description, confidence_score, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.caseId ?? null, input.signalId ?? null, input.mentalModelId ?? null, input.stepOrder, input.description, input.confidenceScore, input.createdBy, now]);
        const [rows] = await pool.query('SELECT * FROM reasoning_steps WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findBySignal(tenantId, signalId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM reasoning_steps WHERE tenant_id = ? AND signal_id = ? ORDER BY step_order ASC', [tenantId, signalId]);
        return rows.map((r) => this.mapRow(r));
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM reasoning_steps WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            caseId: row.case_id,
            signalId: row.signal_id,
            mentalModelId: row.mental_model_id,
            stepOrder: Number(row.step_order),
            description: String(row.description),
            confidenceScore: Number(row.confidence_score),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

import { getPool } from './connection.js';
export const OUTCOME_RESULTS = ['success', 'failure', 'partial', 'pending'];
export class OutcomeRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO outcomes (id, tenant_id, decision_id, result, metrics, kpis, evidence_ids, feedback, confidence, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
            id, input.tenantId, input.decisionId ?? null, input.result,
            JSON.stringify(input.metrics ?? {}), JSON.stringify(input.kpis ?? {}), JSON.stringify(input.evidenceIds ?? []),
            input.feedback ?? null, input.confidence ?? 0.5, input.createdBy, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM outcomes WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM outcomes WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByDecision(tenantId, decisionId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM outcomes WHERE tenant_id = ? AND decision_id = ? ORDER BY created_date DESC', [tenantId, decisionId]);
        return rows.map((r) => this.mapRow(r));
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM outcomes WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            decisionId: row.decision_id,
            result: row.result,
            metrics: row.metrics ?? {},
            kpis: row.kpis ?? {},
            evidenceIds: row.evidence_ids ?? [],
            feedback: row.feedback,
            confidence: Number(row.confidence),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

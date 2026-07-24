import { getPool } from './connection.js';
export const CASE_STATUSES = ['open', 'investigating', 'hypothesized', 'resolved', 'closed'];
export class CaseRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO cases (id, tenant_id, signal_id, title, description, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,'open',?,?,?)`, [id, input.tenantId, input.signalId ?? null, input.title, input.description ?? null, input.createdBy, now, now]);
        const [rows] = await pool.query('SELECT * FROM cases WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM cases WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findBySignal(tenantId, signalId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM cases WHERE tenant_id = ? AND signal_id = ? ORDER BY created_date DESC', [tenantId, signalId]);
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
        const [rows] = await pool.query(`SELECT * FROM cases WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async transition(tenantId, id, status, resolvedHypothesisId) {
        const pool = getPool();
        await pool.execute(`UPDATE cases SET status = ?, resolved_hypothesis_id = COALESCE(?, resolved_hypothesis_id), updated_date = NOW() WHERE id = ?`, [status, resolvedHypothesisId ?? null, id]);
        const [rows] = await pool.query('SELECT * FROM cases WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async linkEvidence(tenantId, caseId, evidenceId) {
        const pool = getPool();
        const [existing] = await pool.query('SELECT id FROM case_evidence WHERE tenant_id = ? AND case_id = ? AND evidence_id = ?', [tenantId, caseId, evidenceId]);
        if (!existing.length) {
            await pool.execute('INSERT INTO case_evidence (tenant_id, case_id, evidence_id) VALUES (?,?,?)', [tenantId, caseId, evidenceId]);
        }
    }
    async getLinkedEvidenceIds(tenantId, caseId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT evidence_id FROM case_evidence WHERE tenant_id = ? AND case_id = ?', [tenantId, caseId]);
        return rows.map((r) => String(r.evidence_id));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            signalId: row.signal_id,
            title: String(row.title),
            description: row.description,
            status: row.status,
            resolvedHypothesisId: row.resolved_hypothesis_id,
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

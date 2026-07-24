import { getPool } from './connection.js';
export const ESO_EXECUTION_STATUSES = ['queued', 'running', 'completed', 'failed', 'rolled_back'];
export class EsoExecutionRepository {
    async queue(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO eso_executions (id, tenant_id, eso_id, decision_id, status, executed_by, executor_type, input, created_date)
       VALUES (?,?,?,?,'queued',?,?,?,?)`, [id, input.tenantId, input.esoId, input.decisionId ?? null, input.executedBy, input.executorType, JSON.stringify(input.input ?? {}), now]);
        const [rows] = await pool.query('SELECT * FROM eso_executions WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM eso_executions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByEso(tenantId, esoId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM eso_executions WHERE tenant_id = ? AND eso_id = ? ORDER BY created_date DESC', [tenantId, esoId]);
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
        const [rows] = await pool.query(`SELECT * FROM eso_executions WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC LIMIT 100`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async transition(tenantId, id, status, patch = {}) {
        const pool = getPool();
        const isStart = status === 'running';
        const isEnd = status === 'completed' || status === 'failed' || status === 'rolled_back';
        await pool.execute(`UPDATE eso_executions SET status = ?, output = COALESCE(?, output), error = COALESCE(?, error), started_date = CASE WHEN ? THEN NOW() ELSE started_date END, completed_date = CASE WHEN ? THEN NOW() ELSE completed_date END WHERE tenant_id = ? AND id = ?`, [status, patch.output ? JSON.stringify(patch.output) : null, patch.error ?? null, isStart ? 1 : 0, isEnd ? 1 : 0, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM eso_executions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            esoId: String(row.eso_id),
            decisionId: row.decision_id,
            status: row.status,
            executedBy: String(row.executed_by),
            executorType: String(row.executor_type),
            input: row.input ?? {},
            output: row.output,
            error: row.error,
            startedDate: row.started_date ? new Date(row.started_date).toISOString() : null,
            completedDate: row.completed_date ? new Date(row.completed_date).toISOString() : null,
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
    async linkEvidence(tenantId, executionId, evidenceId) {
        const pool = getPool();
        const [existing] = await pool.query('SELECT id FROM eso_execution_evidence WHERE tenant_id = ? AND execution_id = ? AND evidence_id = ?', [tenantId, executionId, evidenceId]);
        if (!existing.length) {
            await pool.execute('INSERT INTO eso_execution_evidence (tenant_id, execution_id, evidence_id) VALUES (?,?,?)', [tenantId, executionId, evidenceId]);
        }
    }
    async getLinkedEvidenceIds(tenantId, executionId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT evidence_id FROM eso_execution_evidence WHERE tenant_id = ? AND execution_id = ?', [tenantId, executionId]);
        return rows.map((r) => String(r.evidence_id));
    }
}

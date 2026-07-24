import { getPool } from './connection.js';
export class AccreditationRepository {
    async createFramework(tenantId, name, cycleLabel, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO accreditation_frameworks (id, tenant_id, name, cycle_label, created_by) VALUES (?,?,?,?,?)', [id, tenantId, name, cycleLabel ?? null, createdBy]);
        const [rows] = await pool.query('SELECT * FROM accreditation_frameworks WHERE id = ?', [id]);
        return this.mapFramework(rows[0]);
    }
    async listFrameworks(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM accreditation_frameworks WHERE tenant_id = ? ORDER BY name', [tenantId]);
        return rows.map((r) => this.mapFramework(r));
    }
    async createCriterion(tenantId, frameworkId, criterionCode, description, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO accreditation_criteria (id, tenant_id, framework_id, criterion_code, description, created_by) VALUES (?,?,?,?,?,?)', [id, tenantId, frameworkId, criterionCode, description, createdBy]);
        const [rows] = await pool.query('SELECT * FROM accreditation_criteria WHERE id = ?', [id]);
        return this.mapCriterion(rows[0]);
    }
    async listCriteria(tenantId, frameworkId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM accreditation_criteria WHERE tenant_id = ? AND framework_id = ? ORDER BY criterion_code', [tenantId, frameworkId]);
        return rows.map((r) => this.mapCriterion(r));
    }
    async linkEvidence(tenantId, criterionId, evidenceId) {
        const pool = getPool();
        const [existing] = await pool.query('SELECT id FROM criterion_evidence WHERE tenant_id = ? AND criterion_id = ? AND evidence_id = ?', [tenantId, criterionId, evidenceId]);
        if (!existing.length) {
            await pool.execute('INSERT INTO criterion_evidence (tenant_id, criterion_id, evidence_id) VALUES (?,?,?)', [tenantId, criterionId, evidenceId]);
        }
        await pool.execute(`UPDATE accreditation_criteria SET status = 'in_progress' WHERE tenant_id = ? AND id = ? AND status = 'not_started'`, [tenantId, criterionId]);
    }
    async getLinkedEvidenceCount(tenantId, criterionId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT COUNT(*) AS c FROM criterion_evidence WHERE tenant_id = ? AND criterion_id = ?', [tenantId, criterionId]);
        return Number(rows[0].c);
    }
    async setStatus(tenantId, criterionId, status) {
        const pool = getPool();
        await pool.execute('UPDATE accreditation_criteria SET status = ? WHERE tenant_id = ? AND id = ?', [status, tenantId, criterionId]);
        const [rows] = await pool.query('SELECT * FROM accreditation_criteria WHERE tenant_id = ? AND id = ?', [tenantId, criterionId]);
        return rows.length ? this.mapCriterion(rows[0]) : null;
    }
    mapFramework(row) {
        return { id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), cycleLabel: row.cycle_label };
    }
    mapCriterion(row) {
        return { id: String(row.id), tenantId: String(row.tenant_id), frameworkId: String(row.framework_id), criterionCode: String(row.criterion_code), description: String(row.description), status: String(row.status) };
    }
}

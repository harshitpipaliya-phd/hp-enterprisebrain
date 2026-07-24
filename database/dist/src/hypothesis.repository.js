import { getPool } from './connection.js';
export const HYPOTHESIS_STATUSES = ['proposed', 'supported', 'rejected', 'confirmed'];
export class HypothesisRepository {
    async propose(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO hypotheses (id, tenant_id, case_id, statement, root_cause_family, confidence, status, supporting_evidence_ids, proposed_by, created_date)
       VALUES (?,?,?,?,?,?,'proposed',?,?,?)`, [
            id, input.tenantId, input.caseId, input.statement, input.rootCauseFamily,
            input.confidence ?? 0.5, JSON.stringify(input.supportingEvidenceIds ?? []), input.proposedBy, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM hypotheses WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async recordOutcome(tenantId, caseId, originalHypothesisId, status, proposedBy, rejectedReason, additionalEvidenceIds) {
        const original = await this.findById(tenantId, originalHypothesisId);
        if (!original)
            throw new Error('hypothesis_not_found');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        const mergedEvidence = [...new Set([...original.supportingEvidenceIds, ...(additionalEvidenceIds ?? [])])];
        await pool.execute(`INSERT INTO hypotheses (id, tenant_id, case_id, statement, root_cause_family, confidence, status, supporting_evidence_ids, rejected_reason, proposed_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
            id, tenantId, caseId, original.statement, original.rootCauseFamily,
            original.confidence, status, JSON.stringify(mergedEvidence), rejectedReason ?? null, proposedBy, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM hypotheses WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM hypotheses WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByCase(tenantId, caseId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM hypotheses WHERE tenant_id = ? AND case_id = ? ORDER BY created_date ASC', [tenantId, caseId]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            caseId: String(row.case_id),
            statement: String(row.statement),
            rootCauseFamily: row.root_cause_family,
            confidence: Number(row.confidence),
            status: row.status,
            supportingEvidenceIds: row.supporting_evidence_ids ?? [],
            rejectedReason: row.rejected_reason,
            proposedBy: String(row.proposed_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

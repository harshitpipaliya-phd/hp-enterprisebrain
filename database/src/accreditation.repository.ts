import { getPool } from './connection.js';

export interface AccreditationFramework { id: string; tenantId: string; name: string; cycleLabel: string | null }
export interface AccreditationCriterion { id: string; tenantId: string; frameworkId: string; criterionCode: string; description: string; status: string }

export class AccreditationRepository {
  async createFramework(tenantId: string, name: string, cycleLabel: string | undefined, createdBy: string): Promise<AccreditationFramework> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO accreditation_frameworks (id, tenant_id, name, cycle_label, created_by) VALUES (?,?,?,?,?)',
      [id, tenantId, name, cycleLabel ?? null, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM accreditation_frameworks WHERE id = ?', [id]);
    return this.mapFramework(rows[0]);
  }

  async listFrameworks(tenantId: string): Promise<AccreditationFramework[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM accreditation_frameworks WHERE tenant_id = ? ORDER BY name', [tenantId]);
    return rows.map((r) => this.mapFramework(r));
  }

  async createCriterion(tenantId: string, frameworkId: string, criterionCode: string, description: string, createdBy: string): Promise<AccreditationCriterion> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO accreditation_criteria (id, tenant_id, framework_id, criterion_code, description, created_by) VALUES (?,?,?,?,?,?)',
      [id, tenantId, frameworkId, criterionCode, description, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM accreditation_criteria WHERE id = ?', [id]);
    return this.mapCriterion(rows[0]);
  }

  async listCriteria(tenantId: string, frameworkId: string): Promise<AccreditationCriterion[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM accreditation_criteria WHERE tenant_id = ? AND framework_id = ? ORDER BY criterion_code', [tenantId, frameworkId]);
    return rows.map((r) => this.mapCriterion(r));
  }

  async linkEvidence(tenantId: string, criterionId: string, evidenceId: string): Promise<void> {
    const pool = getPool();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM criterion_evidence WHERE tenant_id = ? AND criterion_id = ? AND evidence_id = ?',
      [tenantId, criterionId, evidenceId]
    );
    if (!existing.length) {
      await pool.execute<any>(
        'INSERT INTO criterion_evidence (tenant_id, criterion_id, evidence_id) VALUES (?,?,?)',
        [tenantId, criterionId, evidenceId]
      );
    }
    await pool.execute<any>(
      `UPDATE accreditation_criteria SET status = 'in_progress' WHERE tenant_id = ? AND id = ? AND status = 'not_started'`,
      [tenantId, criterionId]
    );
  }

  async getLinkedEvidenceCount(tenantId: string, criterionId: string): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT COUNT(*) AS c FROM criterion_evidence WHERE tenant_id = ? AND criterion_id = ?', [tenantId, criterionId]);
    return Number(rows[0].c);
  }

  async setStatus(tenantId: string, criterionId: string, status: string): Promise<AccreditationCriterion | null> {
    const pool = getPool();
    await pool.execute<any>(
      'UPDATE accreditation_criteria SET status = ? WHERE tenant_id = ? AND id = ?',
      [status, tenantId, criterionId]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM accreditation_criteria WHERE tenant_id = ? AND id = ?', [tenantId, criterionId]);
    return rows.length ? this.mapCriterion(rows[0]) : null;
  }

  private mapFramework(row: Record<string, unknown>): AccreditationFramework {
    return { id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), cycleLabel: row.cycle_label as string | null };
  }
  private mapCriterion(row: Record<string, unknown>): AccreditationCriterion {
    return { id: String(row.id), tenantId: String(row.tenant_id), frameworkId: String(row.framework_id), criterionCode: String(row.criterion_code), description: String(row.description), status: String(row.status) };
  }
}

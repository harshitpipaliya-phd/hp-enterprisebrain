import { getPool } from './connection.js';

export const CASE_STATUSES = ['open', 'investigating', 'hypothesized', 'resolved', 'closed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export interface Case {
  id: string;
  tenantId: string;
  signalId: string | null;
  title: string;
  description: string | null;
  status: CaseStatus;
  resolvedHypothesisId: string | null;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateCaseInput {
  tenantId: string;
  signalId?: string | null;
  title: string;
  description?: string | null;
  createdBy: string;
}

export class CaseRepository {
  async create(input: CreateCaseInput): Promise<Case> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO cases (id, tenant_id, signal_id, title, description, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,'open',?,?,?)`,
      [id, input.tenantId, input.signalId ?? null, input.title, input.description ?? null, input.createdBy, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM cases WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Case | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM cases WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findBySignal(tenantId: string, signalId: string): Promise<Case[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM cases WHERE tenant_id = ? AND signal_id = ? ORDER BY created_date DESC', [tenantId, signalId]);
    return rows.map((r) => this.mapRow(r));
  }

  async list(tenantId: string, status?: CaseStatus): Promise<Case[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (status) { clauses.push('status = ?'); params.push(status); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM cases WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async transition(tenantId: string, id: string, status: CaseStatus, resolvedHypothesisId?: string | null): Promise<Case | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE cases SET status = ?, resolved_hypothesis_id = COALESCE(?, resolved_hypothesis_id), updated_date = NOW() WHERE id = ?`,
      [status, resolvedHypothesisId ?? null, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM cases WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async linkEvidence(tenantId: string, caseId: string, evidenceId: string): Promise<void> {
    const pool = getPool();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM case_evidence WHERE tenant_id = ? AND case_id = ? AND evidence_id = ?',
      [tenantId, caseId, evidenceId]
    );
    if (!existing.length) {
      await pool.execute<any>(
        'INSERT INTO case_evidence (tenant_id, case_id, evidence_id) VALUES (?,?,?)',
        [tenantId, caseId, evidenceId]
      );
    }
  }

  async getLinkedEvidenceIds(tenantId: string, caseId: string): Promise<string[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT evidence_id FROM case_evidence WHERE tenant_id = ? AND case_id = ?', [tenantId, caseId]);
    return rows.map((r) => String(r.evidence_id));
  }

  private mapRow(row: Record<string, unknown>): Case {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      signalId: row.signal_id as string | null,
      title: String(row.title),
      description: row.description as string | null,
      status: row.status as CaseStatus,
      resolvedHypothesisId: row.resolved_hypothesis_id as string | null,
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

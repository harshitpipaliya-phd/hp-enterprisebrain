import { getPool } from './connection.js';

export const ESO_EXECUTION_STATUSES = ['queued', 'running', 'completed', 'failed', 'rolled_back'] as const;
export type EsoExecutionStatus = (typeof ESO_EXECUTION_STATUSES)[number];

export interface EsoExecution {
  id: string;
  tenantId: string;
  esoId: string;
  decisionId: string | null;
  status: EsoExecutionStatus;
  executedBy: string;
  executorType: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedDate: string | null;
  completedDate: string | null;
  createdDate: string;
}

export interface QueueExecutionInput {
  tenantId: string;
  esoId: string;
  decisionId?: string | null;
  executedBy: string;
  executorType: string;
  input?: Record<string, unknown>;
}

export class EsoExecutionRepository {
  async queue(input: QueueExecutionInput): Promise<EsoExecution> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO eso_executions (id, tenant_id, eso_id, decision_id, status, executed_by, executor_type, input, created_date)
       VALUES (?,?,?,?,'queued',?,?,?,?)`,
      [id, input.tenantId, input.esoId, input.decisionId ?? null, input.executedBy, input.executorType, JSON.stringify(input.input ?? {}), now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM eso_executions WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<EsoExecution | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM eso_executions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByEso(tenantId: string, esoId: string): Promise<EsoExecution[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM eso_executions WHERE tenant_id = ? AND eso_id = ? ORDER BY created_date DESC',
      [tenantId, esoId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async list(tenantId: string, status?: EsoExecutionStatus): Promise<EsoExecution[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (status) { clauses.push('status = ?'); params.push(status); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM eso_executions WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC LIMIT 100`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async transition(tenantId: string, id: string, status: EsoExecutionStatus, patch: { output?: Record<string, unknown>; error?: string } = {}): Promise<EsoExecution | null> {
    const pool = getPool();
    const isStart = status === 'running';
    const isEnd = status === 'completed' || status === 'failed' || status === 'rolled_back';
    await pool.execute<any>(
      `UPDATE eso_executions SET status = ?, output = COALESCE(?, output), error = COALESCE(?, error), started_date = CASE WHEN ? THEN NOW() ELSE started_date END, completed_date = CASE WHEN ? THEN NOW() ELSE completed_date END WHERE tenant_id = ? AND id = ?`,
      [status, patch.output ? JSON.stringify(patch.output) : null, patch.error ?? null, isStart ? 1 : 0, isEnd ? 1 : 0, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM eso_executions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): EsoExecution {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      esoId: String(row.eso_id),
      decisionId: row.decision_id as string | null,
      status: row.status as EsoExecutionStatus,
      executedBy: String(row.executed_by),
      executorType: String(row.executor_type),
      input: (row.input as Record<string, unknown>) ?? {},
      output: row.output as Record<string, unknown> | null,
      error: row.error as string | null,
      startedDate: row.started_date ? new Date(row.started_date as string).toISOString() : null,
      completedDate: row.completed_date ? new Date(row.completed_date as string).toISOString() : null,
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }

  async linkEvidence(tenantId: string, executionId: string, evidenceId: string): Promise<void> {
    const pool = getPool();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM eso_execution_evidence WHERE tenant_id = ? AND execution_id = ? AND evidence_id = ?',
      [tenantId, executionId, evidenceId]
    );
    if (!existing.length) {
      await pool.execute<any>(
        'INSERT INTO eso_execution_evidence (tenant_id, execution_id, evidence_id) VALUES (?,?,?)',
        [tenantId, executionId, evidenceId]
      );
    }
  }

  async getLinkedEvidenceIds(tenantId: string, executionId: string): Promise<string[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT evidence_id FROM eso_execution_evidence WHERE tenant_id = ? AND execution_id = ?', [tenantId, executionId]);
    return rows.map((r) => String(r.evidence_id));
  }
}

import { getPool } from './connection.js';

export interface ReasoningStep {
  id: string;
  tenantId: string;
  caseId: string | null;
  signalId: string | null;
  mentalModelId: string | null;
  stepOrder: number;
  description: string;
  confidenceScore: number;
  createdBy: string;
  createdDate: string;
}

export interface CreateReasoningStepInput {
  tenantId: string;
  caseId?: string | null;
  signalId?: string | null;
  mentalModelId?: string | null;
  stepOrder: number;
  description: string;
  confidenceScore: number;
  createdBy: string;
}

export class ReasoningStepRepository {
  async create(input: CreateReasoningStepInput): Promise<ReasoningStep> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO reasoning_steps (id, tenant_id, case_id, signal_id, mental_model_id, step_order, description, confidence_score, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.caseId ?? null, input.signalId ?? null, input.mentalModelId ?? null, input.stepOrder, input.description, input.confidenceScore, input.createdBy, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM reasoning_steps WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findBySignal(tenantId: string, signalId: string): Promise<ReasoningStep[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM reasoning_steps WHERE tenant_id = ? AND signal_id = ? ORDER BY step_order ASC',
      [tenantId, signalId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findById(tenantId: string, id: string): Promise<ReasoningStep | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM reasoning_steps WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): ReasoningStep {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      caseId: row.case_id as string | null,
      signalId: row.signal_id as string | null,
      mentalModelId: row.mental_model_id as string | null,
      stepOrder: Number(row.step_order),
      description: String(row.description),
      confidenceScore: Number(row.confidence_score),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

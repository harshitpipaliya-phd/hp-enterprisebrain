import { getPool } from './connection.js';

export const EXECUTOR_TYPES = ['human', 'ai_agent', 'software', 'hybrid'] as const;
export type ExecutorType = (typeof EXECUTOR_TYPES)[number];

export interface DecisionTraceStep {
  step: string;
  detail: Record<string, unknown>;
}

export interface Decision {
  id: string;
  tenantId: string;
  recommendationId: string | null;
  decidedBy: string;
  executorType: ExecutorType;
  rationale: string;
  alternativesConsidered: unknown[];
  confidence: number;
  explanation: string | null;
  trace: DecisionTraceStep[];
  status: string;
  createdDate: string;
}

export interface CreateDecisionInput {
  tenantId: string;
  recommendationId?: string | null;
  decidedBy: string;
  executorType: ExecutorType;
  rationale: string;
  alternativesConsidered?: unknown[];
  confidence?: number;
  explanation?: string | null;
  trace?: DecisionTraceStep[];
  status?: string;
}

export class DecisionRepository {
  async create(input: CreateDecisionInput): Promise<Decision> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO decisions (id, tenant_id, recommendation_id, decided_by, executor_type, rationale, alternatives_considered, confidence, explanation, trace, status, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, input.tenantId, input.recommendationId ?? null, input.decidedBy, input.executorType, input.rationale,
        JSON.stringify(input.alternativesConsidered ?? []), input.confidence ?? 0.5, input.explanation ?? null,
        JSON.stringify(input.trace ?? []), input.status ?? 'approved', now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM decisions WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Decision | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM decisions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string): Promise<Decision[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM decisions WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): Decision {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      recommendationId: row.recommendation_id as string | null,
      decidedBy: String(row.decided_by),
      executorType: row.executor_type as ExecutorType,
      rationale: String(row.rationale),
      alternativesConsidered: (row.alternatives_considered as unknown[]) ?? [],
      confidence: Number(row.confidence ?? 0.5),
      explanation: row.explanation as string | null,
      trace: (row.trace as DecisionTraceStep[]) ?? [],
      status: String(row.status),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

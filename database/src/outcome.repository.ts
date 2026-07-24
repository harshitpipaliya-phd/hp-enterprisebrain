import { getPool } from './connection.js';

export const OUTCOME_RESULTS = ['success', 'failure', 'partial', 'pending'] as const;
export type OutcomeResult = (typeof OUTCOME_RESULTS)[number];

export interface Outcome {
  id: string;
  tenantId: string;
  decisionId: string | null;
  result: OutcomeResult;
  metrics: Record<string, unknown>;
  kpis: Record<string, unknown>;
  evidenceIds: string[];
  feedback: string | null;
  confidence: number;
  createdBy: string;
  createdDate: string;
}

export interface CreateOutcomeInput {
  tenantId: string;
  decisionId?: string | null;
  result: OutcomeResult;
  metrics?: Record<string, unknown>;
  kpis?: Record<string, unknown>;
  evidenceIds?: string[];
  feedback?: string | null;
  confidence?: number;
  createdBy: string;
}

export class OutcomeRepository {
  async create(input: CreateOutcomeInput): Promise<Outcome> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO outcomes (id, tenant_id, decision_id, result, metrics, kpis, evidence_ids, feedback, confidence, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, input.tenantId, input.decisionId ?? null, input.result,
        JSON.stringify(input.metrics ?? {}), JSON.stringify(input.kpis ?? {}), JSON.stringify(input.evidenceIds ?? []),
        input.feedback ?? null, input.confidence ?? 0.5, input.createdBy, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM outcomes WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Outcome | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM outcomes WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByDecision(tenantId: string, decisionId: string): Promise<Outcome[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM outcomes WHERE tenant_id = ? AND decision_id = ? ORDER BY created_date DESC',
      [tenantId, decisionId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async list(tenantId: string): Promise<Outcome[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM outcomes WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): Outcome {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      decisionId: row.decision_id as string | null,
      result: row.result as OutcomeResult,
      metrics: (row.metrics as Record<string, unknown>) ?? {},
      kpis: (row.kpis as Record<string, unknown>) ?? {},
      evidenceIds: (row.evidence_ids as string[]) ?? [],
      feedback: row.feedback as string | null,
      confidence: Number(row.confidence),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

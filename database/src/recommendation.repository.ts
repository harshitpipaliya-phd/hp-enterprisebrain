import { getPool } from './connection.js';

export const RECOMMENDATION_CATEGORIES = ['risk', 'opportunity', 'watch', 'compliance'] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export interface Recommendation {
  id: string;
  tenantId: string;
  reasoningStepId: string | null;
  category: RecommendationCategory;
  title: string;
  description: string | null;
  priority: string;
  urgency: string;
  confidence: number;
  impact: string | null;
  expectedRoi: number | null;
  cost: string | null;
  risk: string | null;
  dependencies: unknown[];
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateRecommendationInput {
  tenantId: string;
  reasoningStepId?: string | null;
  category: RecommendationCategory;
  title: string;
  description?: string | null;
  urgency?: string;
  expectedRoi?: number | null;
  priority?: string;
  confidence: number;
  impact?: string | null;
  cost?: string | null;
  risk?: string | null;
  dependencies?: unknown[];
  createdBy: string;
}

export class RecommendationRepository {
  async create(input: CreateRecommendationInput): Promise<Recommendation> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO recommendations (id, tenant_id, reasoning_step_id, category, title, description, priority, urgency, confidence, impact, expected_roi, cost, risk, dependencies, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?)`,
      [
        id, input.tenantId, input.reasoningStepId ?? null, input.category, input.title, input.description ?? null,
        input.priority ?? 'medium', input.urgency ?? 'normal', input.confidence, input.impact ?? null, input.expectedRoi ?? null,
        input.cost ?? null, input.risk ?? null,
        JSON.stringify(input.dependencies ?? []), input.createdBy, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM recommendations WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Recommendation | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM recommendations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, status?: string): Promise<Recommendation[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (status) { clauses.push('status = ?'); params.push(status); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM recommendations WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<Recommendation | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE recommendations SET status = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`,
      [status, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM recommendations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): Recommendation {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      reasoningStepId: row.reasoning_step_id as string | null,
      category: row.category as RecommendationCategory,
      title: String(row.title),
      description: row.description as string | null,
      priority: String(row.priority),
      urgency: String(row.urgency ?? 'normal'),
      confidence: Number(row.confidence),
      impact: row.impact as string | null,
      expectedRoi: row.expected_roi != null ? Number(row.expected_roi) : null,
      cost: row.cost as string | null,
      risk: row.risk as string | null,
      dependencies: (row.dependencies as unknown[]) ?? [],
      status: String(row.status),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

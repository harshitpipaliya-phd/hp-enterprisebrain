import { getPool } from './connection.js';

export const RISK_CATEGORIES = ['operational', 'financial', 'compliance', 'reputational', 'strategic'] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_IMPACTS = ['low', 'medium', 'high', 'critical'] as const;
export type RiskImpact = (typeof RISK_IMPACTS)[number];

export const RISK_STATUSES = ['open', 'mitigated', 'accepted', 'realized'] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export interface Risk {
  id: string;
  tenantId: string;
  decisionId: string | null;
  recommendationId: string | null;
  category: RiskCategory;
  probability: number;
  impact: RiskImpact;
  score: number;
  mitigation: string | null;
  status: RiskStatus;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateRiskInput {
  tenantId: string;
  decisionId?: string | null;
  recommendationId?: string | null;
  category: RiskCategory;
  probability: number;
  impact: RiskImpact;
  mitigation?: string | null;
  createdBy: string;
}

export class RiskRepository {
  async create(input: CreateRiskInput & { score: number }): Promise<Risk> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO risks (id, tenant_id, decision_id, recommendation_id, category, probability, impact, score, mitigation, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,'open',?,?,?)`,
      [
        id, input.tenantId, input.decisionId ?? null, input.recommendationId ?? null, input.category,
        input.probability, input.impact, input.score, input.mitigation ?? null,
        input.createdBy, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM risks WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Risk | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM risks WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByDecision(tenantId: string, decisionId: string): Promise<Risk[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM risks WHERE tenant_id = ? AND decision_id = ? ORDER BY score DESC', [tenantId, decisionId]);
    return rows.map((r) => this.mapRow(r));
  }

  async list(tenantId: string, status?: RiskStatus): Promise<Risk[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (status) { clauses.push('status = ?'); params.push(status); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM risks WHERE ${clauses.join(' AND ')} ORDER BY score DESC`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async mitigate(tenantId: string, id: string, mitigation: string): Promise<Risk | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE risks SET status = 'mitigated', mitigation = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`,
      [mitigation, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM risks WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): Risk {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      decisionId: row.decision_id as string | null,
      recommendationId: row.recommendation_id as string | null,
      category: row.category as RiskCategory,
      probability: Number(row.probability),
      impact: row.impact as RiskImpact,
      score: Number(row.score),
      mitigation: row.mitigation as string | null,
      status: row.status as RiskStatus,
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

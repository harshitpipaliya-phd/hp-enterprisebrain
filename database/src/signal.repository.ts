import { getPool } from './connection.js';

export const SIGNAL_SOURCES = [
  'attendance',
  'leave',
  'performance',
  'capability',
  'learning',
  'recruitment',
  'tasks',
  'external',
] as const;
export type SignalSource = (typeof SIGNAL_SOURCES)[number];

export const SIGNAL_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number];

export const SIGNAL_STATUSES = ['new', 'triaged', 'evidenced', 'resolved', 'dismissed'] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

export const SIGNAL_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type SignalPriority = (typeof SIGNAL_PRIORITIES)[number];

export interface Signal {
  id: string;
  tenantId: string;
  orgId: string;
  departmentId: string | null;
  source: SignalSource;
  classification: string;
  priority: SignalPriority;
  severity: SignalSeverity;
  confidence: number;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: SignalStatus;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateSignalInput {
  tenantId: string;
  orgId: string;
  departmentId?: string | null;
  source: SignalSource;
  classification?: string;
  priority?: SignalPriority;
  severity?: SignalSeverity;
  confidence?: number;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateSignalStatusInput {
  status: SignalStatus;
}

export class SignalRepository {
  async create(input: CreateSignalInput): Promise<Signal> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO signals (id, tenant_id, org_id, department_id, source, classification, priority, severity, confidence, related_entity_type, related_entity_id, status, metadata, created_by, created_date, updated_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`,
      [
        id, input.tenantId, input.orgId, input.departmentId ?? null, input.source,
        input.classification ?? 'unclassified', input.priority ?? 'normal',
        input.severity ?? 'low', input.confidence ?? 0.5,
        input.relatedEntityType ?? null, input.relatedEntityId ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.createdBy, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM signals WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Signal | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM signals WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, orgId?: string, status?: SignalStatus, source?: SignalSource, departmentId?: string): Promise<Signal[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined | null> = [tenantId];
    if (orgId) { clauses.push(`org_id = ?`); params.push(orgId); }
    if (status) { clauses.push(`status = ?`); params.push(status); }
    if (source) { clauses.push(`source = ?`); params.push(source); }
    if (departmentId) { clauses.push(`department_id = ?`); params.push(departmentId); }
    const sql = `SELECT * FROM signals WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async updateStatus(tenantId: string, id: string, patch: UpdateSignalStatusInput): Promise<Signal | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE signals SET status = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`,
      [patch.status, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM signals WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): Signal {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      orgId: String(row.org_id),
      departmentId: row.department_id as string | null,
      source: row.source as SignalSource,
      classification: String(row.classification ?? 'unclassified'),
      priority: row.priority as SignalPriority,
      severity: row.severity as SignalSeverity,
      confidence: Number(row.confidence),
      relatedEntityType: row.related_entity_type as string | null,
      relatedEntityId: row.related_entity_id as string | null,
      status: row.status as SignalStatus,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

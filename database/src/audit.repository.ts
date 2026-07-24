import { getPool } from './connection.js';

export interface AuditLog {
  id: string;
  tenantId: string;
  orgId?: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  changes: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  eventId?: string;
  source?: string;
  executionTime?: number;
  status?: string;
  requestId?: string;
  createdAt: string;
}

export class AuditRepository {
  async create(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO audit_logs (id, tenant_id, org_id, entity_type, entity_id, action, actor_id, actor_name, changes, ip_address, user_agent, session_id, correlation_id, event_id, source, execution_time, status, request_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, log.tenantId, log.orgId ?? null, log.entityType, log.entityId, log.action, log.actorId, log.actorName, log.changes ? JSON.stringify(log.changes) : null, log.ipAddress ?? null, log.userAgent ?? null, log.sessionId ?? null, log.correlationId ?? null, log.eventId ?? null, log.source ?? 'api', log.executionTime ?? null, log.status ?? 'success', log.requestId ?? null, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM audit_logs WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<AuditLog[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM audit_logs WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [tenantId, entityType, entityId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findByTenant(tenantId: string, limit = 100): Promise<AuditLog[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?', [tenantId, limit]);
    return rows.map((r) => this.mapRow(r));
  }

  async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM audit_logs WHERE correlation_id = ? ORDER BY created_at DESC', [correlationId]);
    return rows.map((r) => this.mapRow(r));
  }

  async findByEventId(eventId: string): Promise<AuditLog[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM audit_logs WHERE event_id = ? ORDER BY created_at DESC', [eventId]);
    return rows.map((r) => this.mapRow(r));
  }

  async search(tenantId: string, query: string, limit = 100): Promise<AuditLog[]> {
    const pool = getPool();
    const pattern = `%${query}%`;
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM audit_logs WHERE tenant_id = ? AND (LOWER(action) LIKE LOWER(?) OR LOWER(entity_type) LIKE LOWER(?) OR LOWER(actor_name) LIKE LOWER(?)) ORDER BY created_at DESC LIMIT ?`,
      [tenantId, pattern, pattern, pattern, limit]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async count(tenantId?: string): Promise<number> {
    const pool = getPool();
    const [rows] = tenantId
      ? await pool.query<any[]>('SELECT count(*) as count FROM audit_logs WHERE tenant_id = ?', [tenantId])
      : await pool.query<any[]>('SELECT count(*) as count FROM audit_logs');
    return Number(rows[0].count);
  }

  async countByAction(tenantId: string): Promise<Record<string, number>> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT action, count(*) as count FROM audit_logs WHERE tenant_id = ? GROUP BY action', [tenantId]);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[String(row.action)] = Number(row.count);
    }
    return counts;
  }

  async getActivityTimeline(tenantId: string, limit = 50): Promise<AuditLog[]> {
    return this.findByTenant(tenantId, limit);
  }

  private mapRow(row: Record<string, unknown>): AuditLog {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      orgId: row.org_id as string | undefined,
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      action: String(row.action),
      actorId: String(row.actor_id),
      actorName: String(row.actor_name),
      changes: row.changes as Record<string, unknown> | null,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      sessionId: row.session_id as string | undefined,
      correlationId: row.correlation_id as string | undefined,
      eventId: row.event_id as string | undefined,
      source: row.source as string | undefined,
      executionTime: row.execution_time as number | undefined,
      status: row.status as string | undefined,
      requestId: row.request_id as string | undefined,
      createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : '',
    };
  }
}

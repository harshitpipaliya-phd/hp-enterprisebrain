import { getPool } from './connection.js';

export interface LogEntry {
  id: string;
  tenantId: string | null;
  orgId: string | null;
  level: string;
  message: string;
  module: string | null;
  userId: string | null;
  requestId: string | null;
  correlationId: string | null;
  executionTime: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class LogsRepository {
  async log(entry: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await pool.execute<any>(
      `INSERT INTO logs (id, tenant_id, org_id, level, message, module, user_id, request_id, correlation_id, execution_time, metadata, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, entry.tenantId ?? null, entry.orgId ?? null, entry.level, entry.message, entry.module ?? null, entry.userId ?? null, entry.requestId ?? null, entry.correlationId ?? null, entry.executionTime ?? null, entry.metadata ? JSON.stringify(entry.metadata) : null, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM logs WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findByTenant(tenantId: string, level?: string, limit = 100): Promise<LogEntry[]> {
    const pool = getPool();
    let sql: string;
    const params: (string | number)[] = [];
    if (level) {
      sql = 'SELECT * FROM logs WHERE tenant_id = ? AND level = ? ORDER BY created_at DESC LIMIT ?';
      params.push(tenantId, level, limit);
    } else {
      sql = 'SELECT * FROM logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?';
      params.push(tenantId, limit);
    }
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async findByCorrelationId(correlationId: string): Promise<LogEntry[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM logs WHERE correlation_id = ? ORDER BY created_at DESC', [correlationId]);
    return rows.map((r) => this.mapRow(r));
  }

  async findByLevel(level: string, limit = 100): Promise<LogEntry[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM logs WHERE level = ? ORDER BY created_at DESC LIMIT ?', [level, limit]);
    return rows.map((r) => this.mapRow(r));
  }

  async countErrors(tenantId?: string): Promise<number> {
    const pool = getPool();
    let rows: any[];
    if (tenantId) {
      [rows] = await pool.query<any[]>(
        'SELECT count(*) as count FROM logs WHERE tenant_id = ? AND level IN (?,?)',
        [tenantId, 'ERROR', 'FATAL']
      );
    } else {
      [rows] = await pool.query<any[]>(
        "SELECT count(*) as count FROM logs WHERE level IN ('ERROR','FATAL')"
      );
    }
    return Number(rows[0].count);
  }

  private mapRow(row: Record<string, unknown>): LogEntry {
    return {
      id: String(row.id),
      tenantId: row.tenant_id as string | null,
      orgId: row.org_id as string | null,
      level: String(row.level),
      message: String(row.message),
      module: row.module as string | null,
      userId: row.user_id as string | null,
      requestId: row.request_id as string | null,
      correlationId: row.correlation_id as string | null,
      executionTime: row.execution_time as number | null,
      metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
      createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : '',
    };
  }
}

import { getPool } from './connection.js';

export interface Metric {
  id: string;
  tenantId: string | null;
  metricName: string;
  metricValue: number;
  tags: Record<string, unknown> | null;
  recordedAt: string;
}

export class MetricsRepository {
  async record(tenantId: string | null, metricName: string, metricValue: number, tags?: Record<string, unknown>): Promise<Metric> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.execute<any>(
      `INSERT INTO metrics (id, tenant_id, metric_name, metric_value, tags, recorded_at) VALUES (?,?,?,?,?,?)`,
      [id, tenantId, metricName, metricValue, tags ? JSON.stringify(tags) : null, new Date().toISOString()]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM metrics WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findByTenant(tenantId: string, metricName?: string, limit = 100): Promise<Metric[]> {
    const pool = getPool();
    let sql: string;
    const params: (string | number)[] = [];
    if (metricName) {
      sql = 'SELECT * FROM metrics WHERE tenant_id = ? AND metric_name = ? ORDER BY recorded_at DESC LIMIT ?';
      params.push(tenantId, metricName, limit);
    } else {
      sql = 'SELECT * FROM metrics WHERE tenant_id = ? ORDER BY recorded_at DESC LIMIT ?';
      params.push(tenantId, limit);
    }
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async getAggregates(tenantId: string, metricName: string): Promise<{ avg: number; min: number; max: number; count: number }> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT avg(metric_value) as avg, min(metric_value) as min, max(metric_value) as max, count(*) as count FROM metrics WHERE tenant_id = ? AND metric_name = ?',
      [tenantId, metricName]
    );
    const row = rows[0];
    return { avg: Number(row.avg), min: Number(row.min), max: Number(row.max), count: Number(row.count) };
  }

  private mapRow(row: Record<string, unknown>): Metric {
    return {
      id: String(row.id),
      tenantId: row.tenant_id as string | null,
      metricName: String(row.metric_name),
      metricValue: Number(row.metric_value),
      tags: row.tags ? JSON.parse(String(row.tags)) : null,
      recordedAt: row.recorded_at ? new Date(row.recorded_at as string).toISOString() : '',
    };
  }
}

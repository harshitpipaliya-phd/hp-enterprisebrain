import { getPool } from './connection.js';
export class MetricsRepository {
    async record(tenantId, metricName, metricValue, tags) {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.execute(`INSERT INTO metrics (id, tenant_id, metric_name, metric_value, tags, recorded_at) VALUES (?,?,?,?,?,?)`, [id, tenantId, metricName, metricValue, tags ? JSON.stringify(tags) : null, new Date().toISOString()]);
        const [rows] = await pool.query('SELECT * FROM metrics WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findByTenant(tenantId, metricName, limit = 100) {
        const pool = getPool();
        let sql;
        const params = [];
        if (metricName) {
            sql = 'SELECT * FROM metrics WHERE tenant_id = ? AND metric_name = ? ORDER BY recorded_at DESC LIMIT ?';
            params.push(tenantId, metricName, limit);
        }
        else {
            sql = 'SELECT * FROM metrics WHERE tenant_id = ? ORDER BY recorded_at DESC LIMIT ?';
            params.push(tenantId, limit);
        }
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async getAggregates(tenantId, metricName) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT avg(metric_value) as avg, min(metric_value) as min, max(metric_value) as max, count(*) as count FROM metrics WHERE tenant_id = ? AND metric_name = ?', [tenantId, metricName]);
        const row = rows[0];
        return { avg: Number(row.avg), min: Number(row.min), max: Number(row.max), count: Number(row.count) };
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: row.tenant_id,
            metricName: String(row.metric_name),
            metricValue: Number(row.metric_value),
            tags: row.tags ? JSON.parse(String(row.tags)) : null,
            recordedAt: row.recorded_at ? new Date(row.recorded_at).toISOString() : '',
        };
    }
}

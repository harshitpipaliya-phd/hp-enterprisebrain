import { getPool } from './connection.js';
export class LogsRepository {
    async log(entry) {
        const pool = getPool();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await pool.execute(`INSERT INTO logs (id, tenant_id, org_id, level, message, module, user_id, request_id, correlation_id, execution_time, metadata, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id, entry.tenantId ?? null, entry.orgId ?? null, entry.level, entry.message, entry.module ?? null, entry.userId ?? null, entry.requestId ?? null, entry.correlationId ?? null, entry.executionTime ?? null, entry.metadata ? JSON.stringify(entry.metadata) : null, now]);
        const [rows] = await pool.query('SELECT * FROM logs WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findByTenant(tenantId, level, limit = 100) {
        const pool = getPool();
        let sql;
        const params = [];
        if (level) {
            sql = 'SELECT * FROM logs WHERE tenant_id = ? AND level = ? ORDER BY created_at DESC LIMIT ?';
            params.push(tenantId, level, limit);
        }
        else {
            sql = 'SELECT * FROM logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?';
            params.push(tenantId, limit);
        }
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async findByCorrelationId(correlationId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM logs WHERE correlation_id = ? ORDER BY created_at DESC', [correlationId]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByLevel(level, limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM logs WHERE level = ? ORDER BY created_at DESC LIMIT ?', [level, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async countErrors(tenantId) {
        const pool = getPool();
        let rows;
        if (tenantId) {
            [rows] = await pool.query('SELECT count(*) as count FROM logs WHERE tenant_id = ? AND level IN (?,?)', [tenantId, 'ERROR', 'FATAL']);
        }
        else {
            [rows] = await pool.query("SELECT count(*) as count FROM logs WHERE level IN ('ERROR','FATAL')");
        }
        return Number(rows[0].count);
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: row.tenant_id,
            orgId: row.org_id,
            level: String(row.level),
            message: String(row.message),
            module: row.module,
            userId: row.user_id,
            requestId: row.request_id,
            correlationId: row.correlation_id,
            executionTime: row.execution_time,
            metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        };
    }
}

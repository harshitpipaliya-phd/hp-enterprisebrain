// tenant-scope-exempt-file: system health checks (DB/service connectivity)
// are infrastructure-level, not tenant data — no method in this file
// should ever be tenant-scoped.
import { getPool } from './connection.js';
export class HealthCheckRepository {
    async record(checkName, status, details, responseTime) {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.execute(`INSERT INTO health_checks (id, check_name, status, details, response_time, checked_at) VALUES (?,?,?,?,?,?)`, [id, checkName, status, details ? JSON.stringify(details) : null, responseTime ?? null, new Date().toISOString()]);
        const [rows] = await pool.query('SELECT * FROM health_checks WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async getLatest(checkName) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM health_checks WHERE check_name = ? ORDER BY checked_at DESC LIMIT ?', [checkName, 1]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async getHistory(checkName, limit = 50) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM health_checks WHERE check_name = ? ORDER BY checked_at DESC LIMIT ?', [checkName, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async getSummary() {
        const pool = getPool();
        const [rows] = await pool.query(`
      SELECT check_name, status, checked_at, response_time
      FROM health_checks h1
      INNER JOIN (
        SELECT check_name, MAX(checked_at) AS max_checked_at
        FROM health_checks
        GROUP BY check_name
      ) h2 ON h1.check_name = h2.check_name AND h1.checked_at = h2.max_checked_at
    `);
        const summary = {};
        for (const row of rows) {
            summary[String(row.check_name)] = {
                status: String(row.status),
                lastChecked: row.checked_at ? new Date(row.checked_at).toISOString() : '',
                responseTime: row.response_time,
            };
        }
        return summary;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            checkName: String(row.check_name),
            status: String(row.status),
            details: row.details ? JSON.parse(String(row.details)) : null,
            responseTime: row.response_time,
            checkedAt: row.checked_at ? new Date(row.checked_at).toISOString() : '',
        };
    }
}

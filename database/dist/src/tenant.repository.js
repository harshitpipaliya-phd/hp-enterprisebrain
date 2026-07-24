import { getPool } from './connection.js';
export class TenantRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO tenants (id, name, region, status, created_date) VALUES (?,?,?,'provisioning',?)`, [id, input.name, input.region ?? 'default', now]);
        const [rows] = await pool.query('SELECT * FROM tenants WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM tenants WHERE id = ?', [id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async activate(id) {
        const pool = getPool();
        await pool.execute(`UPDATE tenants SET status = 'active' WHERE id = ?`, [id]);
    }
    async stats(tenantId) {
        const pool = getPool();
        const [[deptRows], [peopleRows], [roleRows], [esoRows]] = await Promise.all([
            pool.query('SELECT COUNT(*) AS c FROM departments WHERE tenant_id = ?', [tenantId]),
            pool.query('SELECT COUNT(*) AS c FROM people WHERE tenant_id = ?', [tenantId]),
            pool.query('SELECT COUNT(DISTINCT designation) AS c FROM people WHERE tenant_id = ? AND designation IS NOT NULL', [tenantId]),
            pool.query('SELECT COUNT(*) AS c FROM eso_executions WHERE tenant_id = ?', [tenantId]),
        ]);
        return {
            orgUnits: Number(deptRows[0]?.c ?? 0),
            people: Number(peopleRows[0]?.c ?? 0),
            roles: Number(roleRows[0]?.c ?? 0),
            esos: Number(esoRows[0]?.c ?? 0),
        };
    }
    mapRow(row) {
        return {
            id: String(row.id),
            name: String(row.name),
            region: String(row.region),
            status: String(row.status),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

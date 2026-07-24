import { getPool } from './connection.js';
export class AuthUserRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO auth_users (id, tenant_id, email, name, role, password_hash, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.email, input.name, input.role ?? 'member', input.passwordHash, now, now]);
        const [rows] = await pool.query('SELECT * FROM auth_users WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findByEmail(tenantId, email) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM auth_users WHERE tenant_id = ? AND email = ?', [tenantId, email]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM auth_users WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async updatePassword(tenantId, id, passwordHash) {
        const pool = getPool();
        await pool.execute('UPDATE auth_users SET password_hash = ? WHERE tenant_id = ? AND id = ?', [passwordHash, tenantId, id]);
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            email: String(row.email),
            name: String(row.name),
            role: String(row.role),
            passwordHash: String(row.password_hash),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

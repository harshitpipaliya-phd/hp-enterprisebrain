import { getPool } from './connection.js';
const ORG_SENTINEL = '_org_';
export class SettingsRepository {
    async get(tenantId, key, userId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT value FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?', [tenantId, userId ?? ORG_SENTINEL, key]);
        return rows.length ? rows[0].value : null;
    }
    async set(tenantId, key, value, userId) {
        const pool = getPool();
        const scopedUserId = userId ?? ORG_SENTINEL;
        const [existing] = await pool.query('SELECT id FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?', [tenantId, scopedUserId, key]);
        const serialized = JSON.stringify(value);
        if (existing.length) {
            await pool.execute('UPDATE settings SET value = ?, updated_date = NOW() WHERE tenant_id = ? AND user_id = ? AND key = ?', [serialized, tenantId, scopedUserId, key]);
        }
        else {
            await pool.execute(`INSERT INTO settings (tenant_id, user_id, key, value, updated_date) VALUES (?,?,?,?,NOW())`, [tenantId, scopedUserId, key, serialized]);
        }
        const [rows] = await pool.query('SELECT * FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?', [tenantId, scopedUserId, key]);
        return this.mapRow(rows[0]);
    }
    async listForScope(tenantId, userId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM settings WHERE tenant_id = ? AND user_id = ?', [tenantId, userId ?? ORG_SENTINEL]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            tenantId: String(row.tenant_id), userId: String(row.user_id), key: String(row.key), value: row.value,
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

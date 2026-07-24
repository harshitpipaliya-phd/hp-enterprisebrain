import { getPool } from './connection.js';
export class NotificationRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO notifications (id, tenant_id, user_id, type, title, body, entity_type, entity_id, created_date)
       VALUES (?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.userId, input.type, input.title, input.body ?? null, input.entityType ?? null, input.entityId ?? null, now]);
        const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async listForUser(tenantId, userId, unreadOnly = false) {
        const pool = getPool();
        const clauses = ['tenant_id = ?', 'user_id = ?'];
        const params = [tenantId, userId];
        if (unreadOnly)
            clauses.push('read_date IS NULL');
        const [rows] = await pool.query(`SELECT * FROM notifications WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC LIMIT 50`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async markRead(tenantId, userId, id) {
        const pool = getPool();
        await pool.execute(`UPDATE notifications SET read_date = NOW() WHERE tenant_id = ? AND user_id = ? AND id = ? AND read_date IS NULL`, [tenantId, userId, id]);
        const [rows] = await pool.query('SELECT * FROM notifications WHERE tenant_id = ? AND user_id = ? AND id = ?', [tenantId, userId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async markAllRead(tenantId, userId) {
        const pool = getPool();
        const [result] = await pool.execute(`UPDATE notifications SET read_date = NOW() WHERE tenant_id = ? AND user_id = ? AND read_date IS NULL`, [tenantId, userId]);
        return result.affectedRows;
    }
    async unreadCount(tenantId, userId) {
        const pool = getPool();
        const [rows] = await pool.query(`SELECT COUNT(*) AS c FROM notifications WHERE tenant_id = ? AND user_id = ? AND read_date IS NULL`, [tenantId, userId]);
        return Number(rows[0].c);
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), userId: String(row.user_id), type: String(row.type),
            title: String(row.title), body: row.body, entityType: row.entity_type, entityId: row.entity_id,
            readDate: row.read_date ? new Date(row.read_date).toISOString() : null,
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

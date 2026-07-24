import { getPool } from './connection.js';
export class AuditRepository {
    async create(log) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO audit_logs (id, tenant_id, org_id, entity_type, entity_id, action, actor_id, actor_name, changes, ip_address, user_agent, session_id, correlation_id, event_id, source, execution_time, status, request_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, log.tenantId, log.orgId ?? null, log.entityType, log.entityId, log.action, log.actorId, log.actorName, log.changes ? JSON.stringify(log.changes) : null, log.ipAddress ?? null, log.userAgent ?? null, log.sessionId ?? null, log.correlationId ?? null, log.eventId ?? null, log.source ?? 'api', log.executionTime ?? null, log.status ?? 'success', log.requestId ?? null, now]);
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findByEntity(tenantId, entityType, entityId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at DESC', [tenantId, entityType, entityId]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByTenant(tenantId, limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?', [tenantId, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByCorrelationId(correlationId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE correlation_id = ? ORDER BY created_at DESC', [correlationId]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByEventId(eventId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE event_id = ? ORDER BY created_at DESC', [eventId]);
        return rows.map((r) => this.mapRow(r));
    }
    async search(tenantId, query, limit = 100) {
        const pool = getPool();
        const pattern = `%${query}%`;
        const [rows] = await pool.query(`SELECT * FROM audit_logs WHERE tenant_id = ? AND (LOWER(action) LIKE LOWER(?) OR LOWER(entity_type) LIKE LOWER(?) OR LOWER(actor_name) LIKE LOWER(?)) ORDER BY created_at DESC LIMIT ?`, [tenantId, pattern, pattern, pattern, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async count(tenantId) {
        const pool = getPool();
        const [rows] = tenantId
            ? await pool.query('SELECT count(*) as count FROM audit_logs WHERE tenant_id = ?', [tenantId])
            : await pool.query('SELECT count(*) as count FROM audit_logs');
        return Number(rows[0].count);
    }
    async countByAction(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT action, count(*) as count FROM audit_logs WHERE tenant_id = ? GROUP BY action', [tenantId]);
        const counts = {};
        for (const row of rows) {
            counts[String(row.action)] = Number(row.count);
        }
        return counts;
    }
    async getActivityTimeline(tenantId, limit = 50) {
        return this.findByTenant(tenantId, limit);
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            orgId: row.org_id,
            entityType: String(row.entity_type),
            entityId: String(row.entity_id),
            action: String(row.action),
            actorId: String(row.actor_id),
            actorName: String(row.actor_name),
            changes: row.changes,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            sessionId: row.session_id,
            correlationId: row.correlation_id,
            eventId: row.event_id,
            source: row.source,
            executionTime: row.execution_time,
            status: row.status,
            requestId: row.request_id,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        };
    }
}

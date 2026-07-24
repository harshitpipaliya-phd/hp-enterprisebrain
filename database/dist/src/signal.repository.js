import { getPool } from './connection.js';
export const SIGNAL_SOURCES = [
    'attendance',
    'leave',
    'performance',
    'capability',
    'learning',
    'recruitment',
    'tasks',
    'external',
];
export const SIGNAL_SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const SIGNAL_STATUSES = ['new', 'triaged', 'evidenced', 'resolved', 'dismissed'];
export const SIGNAL_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export class SignalRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO signals (id, tenant_id, org_id, department_id, source, classification, priority, severity, confidence, related_entity_type, related_entity_id, status, metadata, created_by, created_date, updated_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`, [
            id, input.tenantId, input.orgId, input.departmentId ?? null, input.source,
            input.classification ?? 'unclassified', input.priority ?? 'normal',
            input.severity ?? 'low', input.confidence ?? 0.5,
            input.relatedEntityType ?? null, input.relatedEntityId ?? null,
            JSON.stringify(input.metadata ?? {}),
            input.createdBy, now, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM signals WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM signals WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, orgId, status, source, departmentId) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (orgId) {
            clauses.push(`org_id = ?`);
            params.push(orgId);
        }
        if (status) {
            clauses.push(`status = ?`);
            params.push(status);
        }
        if (source) {
            clauses.push(`source = ?`);
            params.push(source);
        }
        if (departmentId) {
            clauses.push(`department_id = ?`);
            params.push(departmentId);
        }
        const sql = `SELECT * FROM signals WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async updateStatus(tenantId, id, patch) {
        const pool = getPool();
        await pool.execute(`UPDATE signals SET status = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ?`, [patch.status, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM signals WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            orgId: String(row.org_id),
            departmentId: row.department_id,
            source: row.source,
            classification: String(row.classification ?? 'unclassified'),
            priority: row.priority,
            severity: row.severity,
            confidence: Number(row.confidence),
            relatedEntityType: row.related_entity_type,
            relatedEntityId: row.related_entity_id,
            status: row.status,
            metadata: row.metadata ?? {},
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

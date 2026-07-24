import { getPool } from './connection.js';
export const KNOWLEDGE_CATEGORIES = [
    'policy', 'framework', 'sop', 'template', 'playbook', 'guideline',
    'best_practice', 'case_study', 'decision_model', 'reasoning_model',
];
export class KnowledgeAssetRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO knowledge_assets (id, tenant_id, title, category, content, tags, confidence, department_id, related_person_ids, related_capability_ids, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.title, input.category, input.content, JSON.stringify(input.tags ?? []), input.confidence ?? 0.7,
            input.departmentId ?? null, JSON.stringify(input.relatedPersonIds ?? []), JSON.stringify(input.relatedCapabilityIds ?? []), input.createdBy, now, now]);
        const [rows] = await pool.query('SELECT * FROM knowledge_assets WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM knowledge_assets WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, category, departmentId) {
        const pool = getPool();
        const clauses = ['tenant_id = ?', "status = 'active'"];
        const params = [tenantId];
        if (category) {
            clauses.push(`category = ?`);
            params.push(category);
        }
        if (departmentId) {
            clauses.push(`department_id = ?`);
            params.push(departmentId);
        }
        const [rows] = await pool.query(`SELECT * FROM knowledge_assets WHERE ${clauses.join(' AND ')} ORDER BY reuse_count DESC, created_date DESC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async search(tenantId, query) {
        const pool = getPool();
        const [rows] = await pool.query(`SELECT * FROM knowledge_assets WHERE tenant_id = ? AND status = 'active' AND (title LIKE ? OR content LIKE ?) ORDER BY reuse_count DESC LIMIT 20`, [tenantId, `%${query}%`, `%${query}%`]);
        return rows.map((r) => this.mapRow(r));
    }
    async markReused(tenantId, id) {
        const pool = getPool();
        await pool.execute('UPDATE knowledge_assets SET reuse_count = reuse_count + 1, updated_date = NOW() WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM knowledge_assets WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async mostReused(tenantId, limit = 5) {
        const pool = getPool();
        const [rows] = await pool.query(`SELECT * FROM knowledge_assets WHERE tenant_id = ? AND status = 'active' AND reuse_count > 0 ORDER BY reuse_count DESC LIMIT ?`, [tenantId, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), title: String(row.title), category: row.category,
            content: String(row.content), tags: row.tags ?? [], confidence: Number(row.confidence),
            departmentId: row.department_id, relatedPersonIds: row.related_person_ids ?? [],
            relatedCapabilityIds: row.related_capability_ids ?? [], reuseCount: Number(row.reuse_count),
            status: String(row.status), createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

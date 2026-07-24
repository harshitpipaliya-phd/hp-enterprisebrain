import { getPool } from './connection.js';
export class PromptTemplateRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO prompt_templates (id, tenant_id, name, template, variables, version, status, created_by, created_date)
       VALUES (?,?,?,?,?,1,'active',?,?)`, [id, input.tenantId, input.name, input.template, JSON.stringify(input.variables ?? []), input.createdBy, now]);
        const [rows] = await pool.query('SELECT * FROM prompt_templates WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async createVersion(tenantId, previousId, template, variables, createdBy) {
        const previous = await this.findById(tenantId, previousId);
        if (!previous)
            throw new Error('template_not_found');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO prompt_templates (id, tenant_id, name, template, variables, version, previous_version_id, status, created_by, created_date)
       VALUES (?,?,?,?,?,?,?, 'active',?,?)`, [id, tenantId, previous.name, template, JSON.stringify(variables), previous.version + 1, previousId, createdBy, now]);
        const [rows] = await pool.query('SELECT * FROM prompt_templates WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM prompt_templates WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM prompt_templates WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    render(template, values) {
        return template.template.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key] ?? `{{${key}}}`);
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), template: String(row.template),
            variables: row.variables ?? [], version: Number(row.version ?? 1), previousVersionId: row.previous_version_id,
            status: String(row.status), createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

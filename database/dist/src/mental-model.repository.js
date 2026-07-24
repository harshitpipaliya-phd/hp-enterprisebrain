import { getPool } from './connection.js';
export class MentalModelRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO mental_models (id, tenant_id, name, description, domain, rules, confidence, reinforcement_count, version, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,1,1,'active',?,?,?)`, [
            id, input.tenantId, input.name, input.description ?? null, input.domain,
            JSON.stringify(input.rules ?? { patterns: [] }), input.confidence ?? 0.5, input.createdBy, now, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM mental_models WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM mental_models WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findActiveByDomain(tenantId, domain) {
        const pool = getPool();
        const [rows] = await pool.query(`SELECT * FROM mental_models WHERE tenant_id = ? AND domain = ? AND status = 'active' ORDER BY updated_date DESC LIMIT 1`, [tenantId, domain]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM mental_models WHERE tenant_id = ? ORDER BY updated_date DESC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    async reinforce(tenantId, id, pattern, newConfidence) {
        const pool = getPool();
        const existing = await this.findById(tenantId, id);
        if (!existing)
            throw new Error('mental_model_not_found');
        const patterns = Array.isArray(existing.rules.patterns) ? [...existing.rules.patterns] : [];
        patterns.push(pattern);
        const blendedConfidence = Number((existing.confidence * 0.7 + newConfidence * 0.3).toFixed(3));
        await pool.execute(`UPDATE mental_models SET rules = ?, confidence = ?, reinforcement_count = reinforcement_count + 1, version = version + 1, updated_date = NOW() WHERE tenant_id = ? AND id = ?`, [JSON.stringify({ ...existing.rules, patterns }), blendedConfidence, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM mental_models WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return this.mapRow(rows[0]);
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            name: String(row.name),
            description: row.description,
            domain: String(row.domain),
            rules: row.rules ?? { patterns: [] },
            confidence: Number(row.confidence ?? 0.5),
            reinforcementCount: Number(row.reinforcement_count ?? 0),
            version: Number(row.version ?? 1),
            status: String(row.status),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

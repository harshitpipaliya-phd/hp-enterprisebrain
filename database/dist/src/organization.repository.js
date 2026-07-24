import { getPool } from './connection.js';
export class OrganizationRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO organizations (id, tenant_id, name, legal_name, org_code, industry, country, timezone, currency, logo, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?)`, [id, input.tenantId, input.name, input.legalName ?? null, input.orgCode, input.industry ?? null, input.country ?? null, input.timezone ?? 'UTC', input.currency ?? 'USD', input.logo ?? null, input.createdBy, now, now]);
        const [rows] = await pool.query('SELECT * FROM organizations WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM organizations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByOrgCode(tenantId, orgCode) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM organizations WHERE tenant_id = ? AND org_code = ?', [tenantId, orgCode]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, status) {
        const pool = getPool();
        let sql = 'SELECT * FROM organizations WHERE tenant_id = ?';
        const params = [tenantId];
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_date DESC';
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async update(tenantId, id, patch) {
        const pool = getPool();
        const sets = [];
        const params = [];
        if (patch.name !== undefined) {
            sets.push(`name = ?`);
            params.push(patch.name);
        }
        if (patch.legalName !== undefined) {
            sets.push(`legal_name = ?`);
            params.push(patch.legalName);
        }
        if (patch.orgCode !== undefined) {
            sets.push(`org_code = ?`);
            params.push(patch.orgCode);
        }
        if (patch.industry !== undefined) {
            sets.push(`industry = ?`);
            params.push(patch.industry);
        }
        if (patch.country !== undefined) {
            sets.push(`country = ?`);
            params.push(patch.country);
        }
        if (patch.timezone !== undefined) {
            sets.push(`timezone = ?`);
            params.push(patch.timezone);
        }
        if (patch.currency !== undefined) {
            sets.push(`currency = ?`);
            params.push(patch.currency);
        }
        if (patch.logo !== undefined) {
            sets.push(`logo = ?`);
            params.push(patch.logo);
        }
        if (patch.status !== undefined) {
            sets.push(`status = ?`);
            params.push(patch.status);
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const sql = `UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`;
        params.push(id);
        await pool.execute(sql, params);
        const [rows] = await pool.query('SELECT * FROM organizations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            name: String(row.name),
            legalName: row.legal_name,
            orgCode: String(row.org_code),
            industry: row.industry,
            country: row.country,
            timezone: String(row.timezone),
            currency: String(row.currency),
            logo: row.logo,
            status: String(row.status),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

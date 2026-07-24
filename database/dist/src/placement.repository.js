import { getPool } from './connection.js';
export class PlacementRepository {
    async createCompany(tenantId, name, industry, preferredSkills, notes, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO placement_companies (id, tenant_id, name, industry, preferred_skills, notes, created_by) VALUES (?,?,?,?,?,?,?)', [id, tenantId, name, industry ?? null, JSON.stringify(preferredSkills ?? []), notes ?? null, createdBy]);
        const [rows] = await pool.query('SELECT * FROM placement_companies WHERE id = ?', [id]);
        return this.mapCompany(rows[0]);
    }
    async listCompanies(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM placement_companies WHERE tenant_id = ? ORDER BY name', [tenantId]);
        return rows.map((r) => this.mapCompany(r));
    }
    async createJobRole(tenantId, companyId, title, description, minSalary, maxSalary, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO placement_job_roles (id, tenant_id, company_id, title, description, min_salary, max_salary, created_by) VALUES (?,?,?,?,?,?,?,?)', [id, tenantId, companyId, title, description ?? null, minSalary ?? null, maxSalary ?? null, createdBy]);
        const [rows] = await pool.query('SELECT * FROM placement_job_roles WHERE id = ?', [id]);
        return this.mapJobRole(rows[0]);
    }
    async listJobRoles(tenantId, companyId) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (companyId) {
            clauses.push('company_id = ?');
            params.push(companyId);
        }
        const [rows] = await pool.query(`SELECT * FROM placement_job_roles WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
        return rows.map((r) => this.mapJobRole(r));
    }
    async setRequirement(tenantId, jobRoleId, capabilityId, requiredLevel) {
        const pool = getPool();
        const [existing] = await pool.query('SELECT id FROM job_role_capability_requirements WHERE tenant_id = ? AND job_role_id = ? AND capability_id = ?', [tenantId, jobRoleId, capabilityId]);
        if (existing.length) {
            await pool.execute('UPDATE job_role_capability_requirements SET required_level = ? WHERE tenant_id = ? AND job_role_id = ? AND capability_id = ?', [requiredLevel, tenantId, jobRoleId, capabilityId]);
        }
        else {
            await pool.execute('INSERT INTO job_role_capability_requirements (tenant_id, job_role_id, capability_id, required_level) VALUES (?,?,?,?)', [tenantId, jobRoleId, capabilityId, requiredLevel]);
        }
    }
    async getRequirements(tenantId, jobRoleId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM job_role_capability_requirements WHERE tenant_id = ? AND job_role_id = ?', [tenantId, jobRoleId]);
        return rows.map((r) => ({ jobRoleId: String(r.job_role_id), capabilityId: String(r.capability_id), requiredLevel: Number(r.required_level) }));
    }
    mapCompany(row) {
        return { id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), industry: row.industry, preferredSkills: row.preferred_skills ?? [], notes: row.notes };
    }
    mapJobRole(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), companyId: String(row.company_id), title: String(row.title), description: row.description,
            minSalary: row.min_salary != null ? Number(row.min_salary) : null, maxSalary: row.max_salary != null ? Number(row.max_salary) : null, status: String(row.status),
        };
    }
}

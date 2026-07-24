import { getPool } from './connection.js';

export interface PlacementCompany { id: string; tenantId: string; name: string; industry: string | null; preferredSkills: string[]; notes: string | null }
export interface PlacementJobRole { id: string; tenantId: string; companyId: string; title: string; description: string | null; minSalary: number | null; maxSalary: number | null; status: string }
export interface JobRoleRequirement { jobRoleId: string; capabilityId: string; requiredLevel: number }

export class PlacementRepository {
  async createCompany(tenantId: string, name: string, industry: string | undefined, preferredSkills: string[] | undefined, notes: string | undefined, createdBy: string): Promise<PlacementCompany> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO placement_companies (id, tenant_id, name, industry, preferred_skills, notes, created_by) VALUES (?,?,?,?,?,?,?)',
      [id, tenantId, name, industry ?? null, JSON.stringify(preferredSkills ?? []), notes ?? null, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM placement_companies WHERE id = ?', [id]);
    return this.mapCompany(rows[0]);
  }

  async listCompanies(tenantId: string): Promise<PlacementCompany[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM placement_companies WHERE tenant_id = ? ORDER BY name', [tenantId]);
    return rows.map((r) => this.mapCompany(r));
  }

  async createJobRole(tenantId: string, companyId: string, title: string, description: string | undefined, minSalary: number | undefined, maxSalary: number | undefined, createdBy: string): Promise<PlacementJobRole> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO placement_job_roles (id, tenant_id, company_id, title, description, min_salary, max_salary, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [id, tenantId, companyId, title, description ?? null, minSalary ?? null, maxSalary ?? null, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM placement_job_roles WHERE id = ?', [id]);
    return this.mapJobRole(rows[0]);
  }

  async listJobRoles(tenantId: string, companyId?: string): Promise<PlacementJobRole[]> {
    const pool = getPool();
    const clauses = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (companyId) { clauses.push('company_id = ?'); params.push(companyId); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM placement_job_roles WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
    return rows.map((r) => this.mapJobRole(r));
  }

  async setRequirement(tenantId: string, jobRoleId: string, capabilityId: string, requiredLevel: number): Promise<void> {
    const pool = getPool();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM job_role_capability_requirements WHERE tenant_id = ? AND job_role_id = ? AND capability_id = ?',
      [tenantId, jobRoleId, capabilityId]
    );
    if (existing.length) {
      await pool.execute<any>(
        'UPDATE job_role_capability_requirements SET required_level = ? WHERE tenant_id = ? AND job_role_id = ? AND capability_id = ?',
        [requiredLevel, tenantId, jobRoleId, capabilityId]
      );
    } else {
      await pool.execute<any>(
        'INSERT INTO job_role_capability_requirements (tenant_id, job_role_id, capability_id, required_level) VALUES (?,?,?,?)',
        [tenantId, jobRoleId, capabilityId, requiredLevel]
      );
    }
  }

  async getRequirements(tenantId: string, jobRoleId: string): Promise<JobRoleRequirement[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM job_role_capability_requirements WHERE tenant_id = ? AND job_role_id = ?', [tenantId, jobRoleId]);
    return rows.map((r) => ({ jobRoleId: String(r.job_role_id), capabilityId: String(r.capability_id), requiredLevel: Number(r.required_level) }));
  }

  private mapCompany(row: Record<string, unknown>): PlacementCompany {
    return { id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), industry: row.industry as string | null, preferredSkills: (row.preferred_skills as string[]) ?? [], notes: row.notes as string | null };
  }
  private mapJobRole(row: Record<string, unknown>): PlacementJobRole {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), companyId: String(row.company_id), title: String(row.title), description: row.description as string | null,
      minSalary: row.min_salary != null ? Number(row.min_salary) : null, maxSalary: row.max_salary != null ? Number(row.max_salary) : null, status: String(row.status),
    };
  }
}

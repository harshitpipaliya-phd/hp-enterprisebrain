import { getPool } from './connection.js';

export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  legalName: string | null;
  orgCode: string;
  industry: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  logo: string | null;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateOrganizationInput {
  tenantId: string;
  name: string;
  legalName?: string;
  orgCode: string;
  industry?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo?: string;
  createdBy: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  legalName?: string | null;
  orgCode?: string;
  industry?: string | null;
  country?: string | null;
  timezone?: string;
  currency?: string;
  logo?: string | null;
  status?: string;
}

export class OrganizationRepository {
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO organizations (id, tenant_id, name, legal_name, org_code, industry, country, timezone, currency, logo, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?)`,
      [id, input.tenantId, input.name, input.legalName ?? null, input.orgCode, input.industry ?? null, input.country ?? null, input.timezone ?? 'UTC', input.currency ?? 'USD', input.logo ?? null, input.createdBy, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Organization | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByOrgCode(tenantId: string, orgCode: string): Promise<Organization | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE tenant_id = ? AND org_code = ?', [tenantId, orgCode]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, status?: string): Promise<Organization[]> {
    const pool = getPool();
    let sql = 'SELECT * FROM organizations WHERE tenant_id = ?';
    const params: Array<string | undefined | null> = [tenantId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_date DESC';
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async update(tenantId: string, id: string, patch: UpdateOrganizationInput): Promise<Organization | null> {
    const pool = getPool();
    const sets: string[] = [];
    const params: Array<string | undefined | null> = [];
    if (patch.name !== undefined) { sets.push(`name = ?`); params.push(patch.name); }
    if (patch.legalName !== undefined) { sets.push(`legal_name = ?`); params.push(patch.legalName); }
    if (patch.orgCode !== undefined) { sets.push(`org_code = ?`); params.push(patch.orgCode); }
    if (patch.industry !== undefined) { sets.push(`industry = ?`); params.push(patch.industry); }
    if (patch.country !== undefined) { sets.push(`country = ?`); params.push(patch.country); }
    if (patch.timezone !== undefined) { sets.push(`timezone = ?`); params.push(patch.timezone); }
    if (patch.currency !== undefined) { sets.push(`currency = ?`); params.push(patch.currency); }
    if (patch.logo !== undefined) { sets.push(`logo = ?`); params.push(patch.logo); }
    if (patch.status !== undefined) { sets.push(`status = ?`); params.push(patch.status); }
    if (!sets.length) return this.findById(tenantId, id);
    const sql = `UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);
    await pool.execute<any>(sql, params as any[]);
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async archive(tenantId: string, id: string): Promise<Organization | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapRow(row: Record<string, unknown>): Organization {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      name: String(row.name),
      legalName: row.legal_name as string | null,
      orgCode: String(row.org_code),
      industry: row.industry as string | null,
      country: row.country as string | null,
      timezone: String(row.timezone),
      currency: String(row.currency),
      logo: row.logo as string | null,
      status: String(row.status),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

import { getPool } from './connection.js';

export interface DbTenant {
  id: string;
  name: string;
  region: string;
  status: string;
  createdDate: string;
}

export interface CreateTenantInput {
  name: string;
  region?: string;
}

export interface TenantStats {
  orgUnits: number;
  people: number;
  roles: number;
  esos: number;
}

export class TenantRepository {
  async create(input: CreateTenantInput): Promise<DbTenant> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(`INSERT INTO tenants (id, name, region, status, created_date) VALUES (?,?,?,'provisioning',?)`, [id, input.name, input.region ?? 'default', now]);
    const [rows] = await pool.query<any[]>('SELECT * FROM tenants WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(id: string): Promise<DbTenant | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM tenants WHERE id = ?', [id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async activate(id: string): Promise<void> {
    const pool = getPool();
    await pool.execute<any>(`UPDATE tenants SET status = 'active' WHERE id = ?`, [id]);
  }

  async stats(tenantId: string): Promise<TenantStats> {
    const pool = getPool();
    const [[deptRows], [peopleRows], [roleRows], [esoRows]] = await Promise.all([
      pool.query<any[]>('SELECT COUNT(*) AS c FROM departments WHERE tenant_id = ?', [tenantId]),
      pool.query<any[]>('SELECT COUNT(*) AS c FROM people WHERE tenant_id = ?', [tenantId]),
      pool.query<any[]>('SELECT COUNT(DISTINCT designation) AS c FROM people WHERE tenant_id = ? AND designation IS NOT NULL', [tenantId]),
      pool.query<any[]>('SELECT COUNT(*) AS c FROM eso_executions WHERE tenant_id = ?', [tenantId]),
    ]);
    return {
      orgUnits: Number(deptRows[0]?.c ?? 0),
      people: Number(peopleRows[0]?.c ?? 0),
      roles: Number(roleRows[0]?.c ?? 0),
      esos: Number(esoRows[0]?.c ?? 0),
    };
  }

  private mapRow(row: Record<string, unknown>): DbTenant {
    return {
      id: String(row.id),
      name: String(row.name),
      region: String(row.region),
      status: String(row.status),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}
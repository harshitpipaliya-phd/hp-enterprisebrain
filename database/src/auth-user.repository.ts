import { getPool } from './connection.js';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateAuthUserInput {
  tenantId: string;
  email: string;
  name: string;
  role?: string;
  passwordHash: string;
}

export class AuthUserRepository {
  async create(input: CreateAuthUserInput): Promise<AuthUser> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO auth_users (id, tenant_id, email, name, role, password_hash, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.email, input.name, input.role ?? 'member', input.passwordHash, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM auth_users WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findByEmail(tenantId: string, email: string): Promise<AuthUser | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM auth_users WHERE tenant_id = ? AND email = ?', [tenantId, email]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findById(tenantId: string, id: string): Promise<AuthUser | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM auth_users WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async updatePassword(tenantId: string, id: string, passwordHash: string): Promise<void> {
    const pool = getPool();
    await pool.execute<any>('UPDATE auth_users SET password_hash = ? WHERE tenant_id = ? AND id = ?', [passwordHash, tenantId, id]);
  }

  private mapRow(row: Record<string, unknown>): AuthUser {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      email: String(row.email),
      name: String(row.name),
      role: String(row.role),
      passwordHash: String(row.password_hash),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}
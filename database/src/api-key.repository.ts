import { createHash, randomBytes } from 'node:crypto';
import { getPool } from './connection.js';

export interface ApiKey {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  lastUsedDate: string | null;
  revokedDate: string | null;
  createdDate: string;
  expiresDate: string | null;
}

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export class ApiKeyRepository {
  async create(tenantId: string, userId: string, name: string, expiresDate?: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const id = crypto.randomUUID();
    const rawKey = `hpb_${randomBytes(24).toString('hex')}`;
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO api_keys (id, tenant_id, user_id, name, key_hash, key_prefix, expires_date)
       VALUES (?,?,?,?,?,?,?)`,
      [id, tenantId, userId, name, keyHash, keyPrefix, expiresDate ?? null]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM api_keys WHERE id = ?', [id]);
    return { apiKey: this.mapRow(rows[0]), rawKey };
  }

  async verify(rawKey: string): Promise<ApiKey | null> {
    const pool = getPool();
    const keyHash = hashKey(rawKey);
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM api_keys WHERE key_hash = ? AND revoked_date IS NULL AND (expires_date IS NULL OR expires_date > NOW())`,
      [keyHash]
    );
    if (rows.length === 0) return null;
    await pool.execute<any>('UPDATE api_keys SET last_used_date = NOW() WHERE id = ?', [rows[0].id]);
    return this.mapRow(rows[0]);
  }

  async listForUser(tenantId: string, userId: string): Promise<ApiKey[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM api_keys WHERE tenant_id = ? AND user_id = ? ORDER BY created_date DESC', [tenantId, userId]);
    return rows.map((r) => this.mapRow(r));
  }

  async revoke(tenantId: string, userId: string, id: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<any>(
      `UPDATE api_keys SET revoked_date = NOW() WHERE tenant_id = ? AND user_id = ? AND id = ? AND revoked_date IS NULL`,
      [tenantId, userId, id]
    );
    return result.affectedRows > 0;
  }

  private mapRow(row: Record<string, unknown>): ApiKey {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), userId: String(row.user_id), name: String(row.name), keyPrefix: String(row.key_prefix),
      lastUsedDate: row.last_used_date ? new Date(row.last_used_date as string).toISOString() : null,
      revokedDate: row.revoked_date ? new Date(row.revoked_date as string).toISOString() : null,
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      expiresDate: row.expires_date ? new Date(row.expires_date as string).toISOString() : null,
    };
  }
}

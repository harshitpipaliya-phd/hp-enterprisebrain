import { getPool } from './connection.js';

const ORG_SENTINEL = '_org_';

export interface Setting {
  tenantId: string;
  userId: string;
  key: string;
  value: unknown;
  updatedDate: string;
}

export class SettingsRepository {
  async get(tenantId: string, key: string, userId?: string): Promise<unknown | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT value FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?', [tenantId, userId ?? ORG_SENTINEL, key]);
    return rows.length ? rows[0].value : null;
  }

  async set(tenantId: string, key: string, value: unknown, userId?: string): Promise<Setting> {
    const pool = getPool();
    const scopedUserId = userId ?? ORG_SENTINEL;
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?',
      [tenantId, scopedUserId, key]
    );
    const serialized = JSON.stringify(value);
    if (existing.length) {
      await pool.execute<any>(
        'UPDATE settings SET value = ?, updated_date = NOW() WHERE tenant_id = ? AND user_id = ? AND key = ?',
        [serialized, tenantId, scopedUserId, key]
      );
    } else {
      await pool.execute<any>(
        `INSERT INTO settings (tenant_id, user_id, key, value, updated_date) VALUES (?,?,?,?,NOW())`,
        [tenantId, scopedUserId, key, serialized]
      );
    }
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM settings WHERE tenant_id = ? AND user_id = ? AND key = ?',
      [tenantId, scopedUserId, key]
    );
    return this.mapRow(rows[0]);
  }

  async listForScope(tenantId: string, userId?: string): Promise<Setting[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM settings WHERE tenant_id = ? AND user_id = ?', [tenantId, userId ?? ORG_SENTINEL]);
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): Setting {
    return {
      tenantId: String(row.tenant_id), userId: String(row.user_id), key: String(row.key), value: row.value,
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

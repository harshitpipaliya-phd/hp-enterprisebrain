import { getPool } from './connection.js';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  readDate: string | null;
  createdDate: string;
}

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

export class NotificationRepository {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO notifications (id, tenant_id, user_id, type, title, body, entity_type, entity_id, created_date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.userId, input.type, input.title, input.body ?? null, input.entityType ?? null, input.entityId ?? null, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM notifications WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async listForUser(tenantId: string, userId: string, unreadOnly = false): Promise<Notification[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?', 'user_id = ?'];
    const params: (string | boolean)[] = [tenantId, userId];
    if (unreadOnly) clauses.push('read_date IS NULL');
    const [rows] = await pool.query<any[]>(`SELECT * FROM notifications WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC LIMIT 50`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async markRead(tenantId: string, userId: string, id: string): Promise<Notification | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE notifications SET read_date = NOW() WHERE tenant_id = ? AND user_id = ? AND id = ? AND read_date IS NULL`,
      [tenantId, userId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM notifications WHERE tenant_id = ? AND user_id = ? AND id = ?', [tenantId, userId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async markAllRead(tenantId: string, userId: string): Promise<number> {
    const pool = getPool();
    const [result] = await pool.execute<any>(
      `UPDATE notifications SET read_date = NOW() WHERE tenant_id = ? AND user_id = ? AND read_date IS NULL`,
      [tenantId, userId]
    );
    return result.affectedRows;
  }

  async unreadCount(tenantId: string, userId: string): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) AS c FROM notifications WHERE tenant_id = ? AND user_id = ? AND read_date IS NULL`,
      [tenantId, userId]
    );
    return Number(rows[0].c);
  }

  private mapRow(row: Record<string, unknown>): Notification {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), userId: String(row.user_id), type: String(row.type),
      title: String(row.title), body: row.body as string | null, entityType: row.entity_type as string | null, entityId: row.entity_id as string | null,
      readDate: row.read_date ? new Date(row.read_date as string).toISOString() : null,
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

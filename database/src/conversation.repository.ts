import { getPool } from './connection.js';

export interface ConversationSession {
  id: string;
  tenantId: string;
  orgId: string | null;
  title: string;
  contextType: string | null;
  contextEntityId: string | null;
  pinned: boolean;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateSessionInput {
  tenantId: string;
  orgId?: string | null;
  title?: string;
  contextType?: string | null;
  contextEntityId?: string | null;
  createdBy: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  tenantId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  citations: unknown[];
  createdDate: string;
}

export interface AppendMessageInput {
  tenantId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  citations?: unknown[];
}

export class ConversationRepository {
  async createSession(input: CreateSessionInput): Promise<ConversationSession> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO conversation_sessions (id, tenant_id, org_id, title, context_type, context_entity_id, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.orgId ?? null, input.title ?? 'New conversation', input.contextType ?? null, input.contextEntityId ?? null, input.createdBy, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_sessions WHERE id = ?', [id]);
    return this.mapSession(rows[0]);
  }

  async findSessionById(tenantId: string, id: string): Promise<ConversationSession | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_sessions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapSession(rows[0]) : null;
  }

  async listSessions(tenantId: string, createdBy?: string): Promise<ConversationSession[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?', 'deleted_date IS NULL'];
    const params: Array<string | undefined> = [tenantId];
    if (createdBy) { clauses.push('created_by = ?'); params.push(createdBy); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM conversation_sessions WHERE ${clauses.join(' AND ')} ORDER BY pinned DESC, updated_date DESC`, params);
    return rows.map((r) => this.mapSession(r));
  }

  async setPinned(tenantId: string, id: string, pinned: boolean): Promise<ConversationSession | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE conversation_sessions SET pinned = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ? AND deleted_date IS NULL`,
      [pinned ? 1 : 0, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_sessions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapSession(rows[0]) : null;
  }

  async rename(tenantId: string, id: string, title: string): Promise<ConversationSession | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE conversation_sessions SET title = ?, updated_date = NOW() WHERE tenant_id = ? AND id = ? AND deleted_date IS NULL`,
      [title, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_sessions WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapSession(rows[0]) : null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<any>(
      `UPDATE conversation_sessions SET deleted_date = NOW() WHERE tenant_id = ? AND id = ? AND deleted_date IS NULL`,
      [tenantId, id]
    );
    return result.affectedRows > 0;
  }

  async searchSessions(tenantId: string, query: string): Promise<ConversationSession[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM conversation_sessions WHERE tenant_id = ? AND deleted_date IS NULL AND LOWER(title) LIKE LOWER(?) ORDER BY pinned DESC, updated_date DESC`,
      [tenantId, `%${query}%`]
    );
    return rows.map((r) => this.mapSession(r));
  }

  async appendMessage(input: AppendMessageInput): Promise<ConversationMessage> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO conversation_messages (id, tenant_id, session_id, role, content, citations, created_date)
       VALUES (?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.sessionId, input.role, input.content, JSON.stringify(input.citations ?? []), now]
    );
    await pool.execute<any>(
      `UPDATE conversation_sessions SET updated_date = NOW() WHERE tenant_id = ? AND id = ?`,
      [input.tenantId, input.sessionId]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_messages WHERE id = ?', [id]);
    return this.mapMessage(rows[0]);
  }

  async getMessages(tenantId: string, sessionId: string): Promise<ConversationMessage[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM conversation_messages WHERE tenant_id = ? AND session_id = ? ORDER BY created_date ASC', [tenantId, sessionId]);
    return rows.map((r) => this.mapMessage(r));
  }

  private mapSession(row: Record<string, unknown>): ConversationSession {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), orgId: row.org_id as string | null,
      title: String(row.title), contextType: row.context_type as string | null, contextEntityId: row.context_entity_id as string | null,
      pinned: Boolean(row.pinned),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }

  private mapMessage(row: Record<string, unknown>): ConversationMessage {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), sessionId: String(row.session_id),
      role: row.role as MessageRole, content: String(row.content), citations: (row.citations as unknown[]) ?? [],
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

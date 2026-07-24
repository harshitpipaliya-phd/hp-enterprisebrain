import { getPool } from './connection.js';

export interface StoredEvent {
  id: string;
  type: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  actorId: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  correlationId: string | null;
  causationId: string | null;
  idempotencyKey: string | null;
  status: string;
  retryCount: number;
  lastRetryAt: string | null;
  failureReason: string | null;
  createdAt: string;
  processedAt: string | null;
  completedAt: string | null;
}

export interface DeadLetterEntry {
  id: string;
  eventId: string;
  consumerName: string;
  errorMessage: string;
  errorStack: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export interface ConsumerState {
  id: string;
  consumerName: string;
  lastProcessedEventId: string | null;
  lastProcessedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export class EventStoreRepository {
  async append(event: Omit<StoredEvent, 'id' | 'status' | 'retryCount' | 'lastRetryAt' | 'failureReason' | 'createdAt' | 'processedAt' | 'completedAt'> & { id?: string }): Promise<StoredEvent> {
    const pool = getPool();
    const id = event.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    await pool.execute<any>(
      `INSERT INTO event_store (id, type, tenant_id, entity_type, entity_id, actor_id, payload, metadata, correlation_id, causation_id, idempotency_key, status, retry_count, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',0,?)`,
      [
        id, event.type, event.tenantId, event.entityType, event.entityId, event.actorId,
        JSON.stringify(event.payload),
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.correlationId ?? null,
        event.causationId ?? null,
        event.idempotencyKey ?? null,
        now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(id: string): Promise<StoredEvent | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE id = ?', [id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByType(type: string, limit = 100): Promise<StoredEvent[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE type = ? ORDER BY created_at DESC LIMIT ?', [type, limit]);
    return rows.map((r) => this.mapRow(r));
  }

  async findPending(limit = 100): Promise<StoredEvent[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE status = ? ORDER BY created_at ASC LIMIT ?', ['pending', limit]);
    return rows.map((r) => this.mapRow(r));
  }

  async findByTenant(tenantId: string, limit = 100): Promise<StoredEvent[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?', [tenantId, limit]);
    return rows.map((r) => this.mapRow(r));
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<StoredEvent[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at ASC', [tenantId, entityType, entityId]);
    return rows.map((r) => this.mapRow(r));
  }

  async updateStatus(id: string, status: EventStatus, failureReason?: string): Promise<void> {
    const pool = getPool();
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];
    if (status === 'processing') {
      updates.push('retry_count = retry_count + 1', 'last_retry_at = ?');
      params.push(new Date().toISOString());
    }
    if (failureReason) {
      updates.push('failure_reason = ?');
      params.push(failureReason);
    }
    if (status === 'completed') {
      updates.push('completed_at = ?');
      params.push(new Date().toISOString());
    }
    if (status === 'processing') {
      updates.push('processed_at = ?');
      params.push(new Date().toISOString());
    }
    params.push(id);
    await pool.execute<any>(`UPDATE event_store SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  async markCompleted(id: string): Promise<void> {
    await this.updateStatus(id, 'completed');
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.updateStatus(id, 'failed', reason);
  }

  async findByIdempotencyKey(key: string): Promise<StoredEvent | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM event_store WHERE idempotency_key = ?', [key]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async count(): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT count(*) as count FROM event_store');
    return Number(rows[0].count);
  }

  async countByStatus(status: string): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT count(*) as count FROM event_store WHERE status = ?', [status]);
    return Number(rows[0].count);
  }

  async countByType(type: string): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT count(*) as count FROM event_store WHERE type = ?', [type]);
    return Number(rows[0].count);
  }

  async addToDeadLetter(eventId: string, consumerName: string, errorMessage: string, errorStack?: string, maxRetries = 3): Promise<DeadLetterEntry> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.execute<any>(
      `INSERT INTO dead_letter_queue (id, event_id, consumer_name, error_message, error_stack, max_retries, created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, eventId, consumerName, errorMessage, errorStack ?? null, maxRetries, new Date().toISOString()]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM dead_letter_queue WHERE id = ?', [id]);
    return this.mapDeadLetter(rows[0]);
  }

  async getDeadLetterEntries(limit = 100): Promise<DeadLetterEntry[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM dead_letter_queue ORDER BY created_at DESC LIMIT ?', [limit]);
    return rows.map((r) => this.mapDeadLetter(r));
  }

  async removeDeadLetter(id: string): Promise<void> {
    const pool = getPool();
    await pool.execute<any>('DELETE FROM dead_letter_queue WHERE id = ?', [id]);
  }

  async upsertConsumerState(consumerName: string, lastEventId?: string): Promise<ConsumerState> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const [existing] = await pool.query<any[]>(
      'SELECT id, consumer_name, last_processed_event_id, last_processed_at, created_at FROM consumer_state WHERE consumer_name = ?',
      [consumerName]
    );
    if (existing.length) {
      await pool.execute<any>(
        `UPDATE consumer_state SET last_processed_event_id = ?, last_processed_at = ?, updated_at = ? WHERE id = ?`,
        [lastEventId ?? null, now, now, existing[0].id]
      );
    } else {
      await pool.execute<any>(
        `INSERT INTO consumer_state (id, consumer_name, last_processed_event_id, last_processed_at, status, created_at, updated_at) VALUES (?,?,?,?,'active',?,?)`,
        [id, consumerName, lastEventId ?? null, now, now, now]
      );
    }
    const [rows] = await pool.query<any[]>('SELECT * FROM consumer_state WHERE consumer_name = ?', [consumerName]);
    return this.mapConsumerState(rows[0]);
  }

  async getConsumerState(consumerName: string): Promise<ConsumerState | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM consumer_state WHERE consumer_name = ?', [consumerName]);
    return rows.length ? this.mapConsumerState(rows[0]) : null;
  }

  async getAllConsumerStates(): Promise<ConsumerState[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM consumer_state ORDER BY consumer_name');
    return rows.map((r) => this.mapConsumerState(r));
  }

  private mapRow(row: Record<string, unknown>): StoredEvent {
    return {
      id: String(row.id),
      type: String(row.type),
      tenantId: String(row.tenant_id),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      actorId: String(row.actor_id),
      payload: JSON.parse(String(row.payload)),
      metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
      correlationId: row.correlation_id as string | null,
      causationId: row.causation_id as string | null,
      idempotencyKey: row.idempotency_key as string | null,
      status: String(row.status),
      retryCount: Number(row.retry_count),
      lastRetryAt: row.last_retry_at as string | null,
      failureReason: row.failure_reason as string | null,
      createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : '',
      processedAt: row.processed_at as string | null,
      completedAt: row.completed_at as string | null,
    };
  }

  private mapDeadLetter(row: Record<string, unknown>): DeadLetterEntry {
    return {
      id: String(row.id),
      eventId: String(row.event_id),
      consumerName: String(row.consumer_name),
      errorMessage: String(row.error_message),
      errorStack: row.error_stack as string | null,
      retryCount: Number(row.retry_count),
      maxRetries: Number(row.max_retries),
      createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : '',
    };
  }

  private mapConsumerState(row: Record<string, unknown>): ConsumerState {
    return {
      id: String(row.id),
      consumerName: String(row.consumer_name),
      lastProcessedEventId: row.last_processed_event_id as string | null,
      lastProcessedAt: row.last_processed_at as string | null,
      status: String(row.status),
      createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : '',
    };
  }
}

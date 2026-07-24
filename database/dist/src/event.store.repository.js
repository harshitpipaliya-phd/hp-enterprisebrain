import { getPool } from './connection.js';
export class EventStoreRepository {
    async append(event) {
        const pool = getPool();
        const id = event.id ?? crypto.randomUUID();
        const now = new Date().toISOString();
        await pool.execute(`INSERT INTO event_store (id, type, tenant_id, entity_type, entity_id, actor_id, payload, metadata, correlation_id, causation_id, idempotency_key, status, retry_count, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',0,?)`, [
            id, event.type, event.tenantId, event.entityType, event.entityId, event.actorId,
            JSON.stringify(event.payload),
            event.metadata ? JSON.stringify(event.metadata) : null,
            event.correlationId ?? null,
            event.causationId ?? null,
            event.idempotencyKey ?? null,
            now,
        ]);
        const [rows] = await pool.query('SELECT * FROM event_store WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE id = ?', [id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByType(type, limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE type = ? ORDER BY created_at DESC LIMIT ?', [type, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async findPending(limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE status = ? ORDER BY created_at ASC LIMIT ?', ['pending', limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByTenant(tenantId, limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?', [tenantId, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    async findByEntity(tenantId, entityType, entityId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at ASC', [tenantId, entityType, entityId]);
        return rows.map((r) => this.mapRow(r));
    }
    async updateStatus(id, status, failureReason) {
        const pool = getPool();
        const updates = ['status = ?'];
        const params = [status];
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
        await pool.execute(`UPDATE event_store SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    async markCompleted(id) {
        await this.updateStatus(id, 'completed');
    }
    async markFailed(id, reason) {
        await this.updateStatus(id, 'failed', reason);
    }
    async findByIdempotencyKey(key) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM event_store WHERE idempotency_key = ?', [key]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async count() {
        const pool = getPool();
        const [rows] = await pool.query('SELECT count(*) as count FROM event_store');
        return Number(rows[0].count);
    }
    async countByStatus(status) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT count(*) as count FROM event_store WHERE status = ?', [status]);
        return Number(rows[0].count);
    }
    async countByType(type) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT count(*) as count FROM event_store WHERE type = ?', [type]);
        return Number(rows[0].count);
    }
    async addToDeadLetter(eventId, consumerName, errorMessage, errorStack, maxRetries = 3) {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.execute(`INSERT INTO dead_letter_queue (id, event_id, consumer_name, error_message, error_stack, max_retries, created_at)
       VALUES (?,?,?,?,?,?,?)`, [id, eventId, consumerName, errorMessage, errorStack ?? null, maxRetries, new Date().toISOString()]);
        const [rows] = await pool.query('SELECT * FROM dead_letter_queue WHERE id = ?', [id]);
        return this.mapDeadLetter(rows[0]);
    }
    async getDeadLetterEntries(limit = 100) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM dead_letter_queue ORDER BY created_at DESC LIMIT ?', [limit]);
        return rows.map((r) => this.mapDeadLetter(r));
    }
    async removeDeadLetter(id) {
        const pool = getPool();
        await pool.execute('DELETE FROM dead_letter_queue WHERE id = ?', [id]);
    }
    async upsertConsumerState(consumerName, lastEventId) {
        const pool = getPool();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const [existing] = await pool.query('SELECT id, consumer_name, last_processed_event_id, last_processed_at, created_at FROM consumer_state WHERE consumer_name = ?', [consumerName]);
        if (existing.length) {
            await pool.execute(`UPDATE consumer_state SET last_processed_event_id = ?, last_processed_at = ?, updated_at = ? WHERE id = ?`, [lastEventId ?? null, now, now, existing[0].id]);
        }
        else {
            await pool.execute(`INSERT INTO consumer_state (id, consumer_name, last_processed_event_id, last_processed_at, status, created_at, updated_at) VALUES (?,?,?,?,'active',?,?)`, [id, consumerName, lastEventId ?? null, now, now, now]);
        }
        const [rows] = await pool.query('SELECT * FROM consumer_state WHERE consumer_name = ?', [consumerName]);
        return this.mapConsumerState(rows[0]);
    }
    async getConsumerState(consumerName) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM consumer_state WHERE consumer_name = ?', [consumerName]);
        return rows.length ? this.mapConsumerState(rows[0]) : null;
    }
    async getAllConsumerStates() {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM consumer_state ORDER BY consumer_name');
        return rows.map((r) => this.mapConsumerState(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            type: String(row.type),
            tenantId: String(row.tenant_id),
            entityType: String(row.entity_type),
            entityId: String(row.entity_id),
            actorId: String(row.actor_id),
            payload: JSON.parse(String(row.payload)),
            metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
            correlationId: row.correlation_id,
            causationId: row.causation_id,
            idempotencyKey: row.idempotency_key,
            status: String(row.status),
            retryCount: Number(row.retry_count),
            lastRetryAt: row.last_retry_at,
            failureReason: row.failure_reason,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
            processedAt: row.processed_at,
            completedAt: row.completed_at,
        };
    }
    mapDeadLetter(row) {
        return {
            id: String(row.id),
            eventId: String(row.event_id),
            consumerName: String(row.consumer_name),
            errorMessage: String(row.error_message),
            errorStack: row.error_stack,
            retryCount: Number(row.retry_count),
            maxRetries: Number(row.max_retries),
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        };
    }
    mapConsumerState(row) {
        return {
            id: String(row.id),
            consumerName: String(row.consumer_name),
            lastProcessedEventId: row.last_processed_event_id,
            lastProcessedAt: row.last_processed_at,
            status: String(row.status),
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
        };
    }
}

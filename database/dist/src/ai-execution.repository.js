import { getPool } from './connection.js';
export class AIExecutionRepository {
    async log(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO ai_executions (id, tenant_id, user_id, service_name, prompt_template_id, provider, model, status, input_tokens, output_tokens, latency_ms, estimated_cost_usd, error, entity_type, entity_id, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.userId, input.serviceName, input.promptTemplateId ?? null, input.provider, input.model ?? null,
            input.status, input.inputTokens ?? null, input.outputTokens ?? null, input.latencyMs ?? null, input.estimatedCostUsd ?? null,
            input.error ?? null, input.entityType ?? null, input.entityId ?? null, now]);
        const [rows] = await pool.query('SELECT * FROM ai_executions WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async list(tenantId, limit = 50) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM ai_executions WHERE tenant_id = ? ORDER BY created_date DESC LIMIT ?', [tenantId, limit]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), userId: String(row.user_id), serviceName: String(row.service_name),
            promptTemplateId: row.prompt_template_id, provider: String(row.provider), model: row.model,
            status: row.status, inputTokens: row.input_tokens, outputTokens: row.output_tokens,
            latencyMs: row.latency_ms, estimatedCostUsd: row.estimated_cost_usd ? Number(row.estimated_cost_usd) : null,
            error: row.error, entityType: row.entity_type, entityId: row.entity_id,
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

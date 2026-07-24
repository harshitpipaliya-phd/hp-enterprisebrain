import { getPool } from './connection.js';

export interface AIExecution {
  id: string;
  tenantId: string;
  userId: string;
  serviceName: string;
  promptTemplateId: string | null;
  provider: string;
  model: string | null;
  status: 'success' | 'failed' | 'not_configured';
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  estimatedCostUsd: number | null;
  error: string | null;
  entityType: string | null;
  entityId: string | null;
  createdDate: string;
}

export interface LogAIExecutionInput {
  tenantId: string;
  userId: string;
  serviceName: string;
  promptTemplateId?: string;
  provider: string;
  model?: string;
  status: 'success' | 'failed' | 'not_configured';
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  estimatedCostUsd?: number;
  error?: string;
  entityType?: string;
  entityId?: string;
}

export class AIExecutionRepository {
  async log(input: LogAIExecutionInput): Promise<AIExecution> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO ai_executions (id, tenant_id, user_id, service_name, prompt_template_id, provider, model, status, input_tokens, output_tokens, latency_ms, estimated_cost_usd, error, entity_type, entity_id, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.userId, input.serviceName, input.promptTemplateId ?? null, input.provider, input.model ?? null,
       input.status, input.inputTokens ?? null, input.outputTokens ?? null, input.latencyMs ?? null, input.estimatedCostUsd ?? null,
       input.error ?? null, input.entityType ?? null, input.entityId ?? null, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM ai_executions WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async list(tenantId: string, limit = 50): Promise<AIExecution[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM ai_executions WHERE tenant_id = ? ORDER BY created_date DESC LIMIT ?', [tenantId, limit]);
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): AIExecution {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), userId: String(row.user_id), serviceName: String(row.service_name),
      promptTemplateId: row.prompt_template_id as string | null, provider: String(row.provider), model: row.model as string | null,
      status: row.status as AIExecution['status'], inputTokens: row.input_tokens as number | null, outputTokens: row.output_tokens as number | null,
      latencyMs: row.latency_ms as number | null, estimatedCostUsd: row.estimated_cost_usd ? Number(row.estimated_cost_usd) : null,
      error: row.error as string | null, entityType: row.entity_type as string | null, entityId: row.entity_id as string | null,
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

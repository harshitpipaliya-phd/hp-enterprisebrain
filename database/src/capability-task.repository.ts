import { getPool } from './connection.js';

export interface CapabilityTask {
  id: string;
  tenantId: string;
  capabilityId: string;
  parentTaskId: string | null;
  name: string;
  description: string | null;
  evidenceRequired: boolean;
  status: string;
  createdBy: string;
  createdDate: string;
}

export interface CreateCapabilityTaskInput {
  tenantId: string;
  capabilityId: string;
  parentTaskId?: string;
  name: string;
  description?: string;
  evidenceRequired?: boolean;
  createdBy: string;
}

export class CapabilityTaskRepository {
  async create(input: CreateCapabilityTaskInput): Promise<CapabilityTask> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO capability_tasks (id, tenant_id, capability_id, parent_task_id, name, description, evidence_required, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.capabilityId, input.parentTaskId ?? null, input.name, input.description ?? null, input.evidenceRequired ?? false, input.createdBy, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_tasks WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async listForCapability(tenantId: string, capabilityId: string): Promise<CapabilityTask[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_tasks WHERE tenant_id = ? AND capability_id = ? ORDER BY created_date ASC', [tenantId, capabilityId]);
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): CapabilityTask {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), capabilityId: String(row.capability_id),
      parentTaskId: row.parent_task_id as string | null, name: String(row.name), description: row.description as string | null,
      evidenceRequired: Boolean(row.evidence_required), status: String(row.status), createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

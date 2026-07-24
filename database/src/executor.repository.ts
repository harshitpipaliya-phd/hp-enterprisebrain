import { getPool } from './connection.js';
import type { ExecutorType } from './decision.repository.js';

export interface Executor {
  id: string;
  tenantId: string;
  executorType: ExecutorType;
  name: string;
  personId: string | null;
  capabilityTags: string[];
  trustLevel: number;
  maxConcurrent: number;
  currentWorkload: number;
  available: boolean;
  status: string;
  createdDate: string;
  updatedDate: string;
}

export interface RegisterExecutorInput {
  tenantId: string;
  executorType: ExecutorType;
  name: string;
  personId?: string | null;
  capabilityTags?: string[];
  trustLevel?: number;
  maxConcurrent?: number;
}

export class ExecutorRepository {
  async register(input: RegisterExecutorInput): Promise<Executor> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO executors (id, tenant_id, executor_type, name, person_id, capability_tags, trust_level, max_concurrent, current_workload, available, status, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,0,true,'active',?,?)`,
      [
        id, input.tenantId, input.executorType, input.name, input.personId ?? null,
        JSON.stringify(input.capabilityTags ?? []), input.trustLevel ?? 0.5, input.maxConcurrent ?? 1, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM executors WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findAvailable(tenantId: string, executorType: ExecutorType, requiredCapability?: string): Promise<Executor[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?', 'executor_type = ?', 'available = 1', 'current_workload < max_concurrent', "status = 'active'"];
    const params: Array<string | boolean> = [tenantId, executorType];
    if (requiredCapability) {
      clauses.push(`JSON_CONTAINS(capability_tags, ?)`);
      params.push(JSON.stringify([requiredCapability]));
    }
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM executors WHERE ${clauses.join(' AND ')} ORDER BY trust_level DESC, current_workload ASC`,
      params
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findById(tenantId: string, id: string): Promise<Executor | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM executors WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string): Promise<Executor[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM executors WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
    return rows.map((r) => this.mapRow(r));
  }

  async adjustWorkload(tenantId: string, id: string, delta: number): Promise<Executor | null> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE executors SET current_workload = GREATEST(0, current_workload + ?), updated_date = NOW() WHERE tenant_id = ? AND id = ?`,
      [delta, tenantId, id]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM executors WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: Record<string, unknown>): Executor {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      executorType: row.executor_type as ExecutorType,
      name: String(row.name),
      personId: row.person_id as string | null,
      capabilityTags: (row.capability_tags as string[]) ?? [],
      trustLevel: Number(row.trust_level),
      maxConcurrent: Number(row.max_concurrent),
      currentWorkload: Number(row.current_workload),
      available: Boolean(row.available),
      status: String(row.status),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

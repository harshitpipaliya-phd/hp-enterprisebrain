import { getPool } from './connection.js';

export const POLICY_TYPES = ['executor_autonomy', 'business_rule'] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';
  value: unknown;
}

export interface PolicyRule {
  field?: string;
  operator?: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';
  value?: unknown;
  conditions?: PolicyCondition[];
  match?: 'all' | 'any';
  action: string;
}

export interface Policy {
  id: string;
  tenantId: string;
  name: string;
  scope: string;
  policyType: PolicyType;
  allowedExecutorClasses: unknown[];
  trustLevels: unknown[];
  routingCriteria: Record<string, unknown>;
  escalationPath: unknown[];
  rules: PolicyRule[];
  version: number;
  previousVersionId: string | null;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreatePolicyInput {
  tenantId: string;
  name: string;
  scope: string;
  policyType: PolicyType;
  allowedExecutorClasses?: unknown[];
  trustLevels?: unknown[];
  routingCriteria?: Record<string, unknown>;
  escalationPath?: unknown[];
  rules?: PolicyRule[];
  createdBy: string;
}

export class PolicyRepository {
  async create(input: CreatePolicyInput): Promise<Policy> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO policies (id, tenant_id, name, scope, policy_type, allowed_executor_classes, trust_levels, routing_criteria, escalation_path, rules, version, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,1,'active',?,?,?)`,
      [
        id, input.tenantId, input.name, input.scope, input.policyType,
        JSON.stringify(input.allowedExecutorClasses ?? []), JSON.stringify(input.trustLevels ?? []),
        JSON.stringify(input.routingCriteria ?? {}), JSON.stringify(input.escalationPath ?? []),
        JSON.stringify(input.rules ?? []), input.createdBy, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM policies WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async createVersion(tenantId: string, previousId: string, rules: PolicyRule[], createdBy: string): Promise<Policy> {
    const previous = await this.findById(tenantId, previousId);
    if (!previous) throw new Error('policy_not_found');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO policies (id, tenant_id, name, scope, policy_type, allowed_executor_classes, trust_levels, routing_criteria, escalation_path, rules, version, previous_version_id, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'active',?,?,?)`,
      [
        id, tenantId, previous.name, previous.scope, previous.policyType,
        JSON.stringify(previous.allowedExecutorClasses), JSON.stringify(previous.trustLevels),
        JSON.stringify(previous.routingCriteria), JSON.stringify(previous.escalationPath),
        JSON.stringify(rules), previous.version + 1, previousId, createdBy, now, now,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM policies WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Policy | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM policies WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, policyType?: PolicyType): Promise<Policy[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (policyType) { clauses.push('policy_type = ?'); params.push(policyType); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM policies WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
    return rows.map((r) => this.mapRow(r));
  }

  async history(tenantId: string, policyId: string): Promise<Policy[]> {
    const chain: Policy[] = [];
    let current = await this.findById(tenantId, policyId);
    while (current) {
      chain.unshift(current);
      current = current.previousVersionId ? await this.findById(tenantId, current.previousVersionId) : null;
    }
    return chain;
  }

  private mapRow(row: Record<string, unknown>): Policy {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      name: String(row.name),
      scope: String(row.scope),
      policyType: row.policy_type as PolicyType,
      allowedExecutorClasses: (row.allowed_executor_classes as unknown[]) ?? [],
      trustLevels: (row.trust_levels as unknown[]) ?? [],
      routingCriteria: (row.routing_criteria as Record<string, unknown>) ?? {},
      escalationPath: (row.escalation_path as unknown[]) ?? [],
      rules: (row.rules as PolicyRule[]) ?? [],
      version: Number(row.version ?? 1),
      previousVersionId: row.previous_version_id as string | null,
      status: String(row.status),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

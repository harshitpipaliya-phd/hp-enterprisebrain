import { getPool } from './connection.js';

export interface KasbaElement {
  description?: string;
  level?: number;
  weight?: number;
  evidenceRequired?: boolean;
  measurementMethod?: string;
  targetLevel?: number;
  currentLevel?: number;
}

export interface Capability {
  id: string;
  tenantId: string;
  orgId: string;
  capabilityCode: string;
  name: string;
  description: string | null;
  category: string;
  capabilityType: string;
  difficulty: string;
  criticality: string;
  version: number;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  knowledge: KasbaElement | null;
  ability: KasbaElement | null;
  skill: KasbaElement | null;
  behaviour: KasbaElement | null;
  attitude: KasbaElement | null;
}

export interface CreateCapabilityInput {
  tenantId: string;
  orgId: string;
  capabilityCode: string;
  name: string;
  description?: string | null;
  category?: string;
  capabilityType?: string;
  difficulty?: string;
  criticality?: string;
  createdBy: string;
  knowledge?: KasbaElement | null;
  ability?: KasbaElement | null;
  skill?: KasbaElement | null;
  behaviour?: KasbaElement | null;
  attitude?: KasbaElement | null;
}

export interface UpdateCapabilityInput {
  name?: string;
  description?: string | null;
  category?: string;
  capabilityType?: string;
  difficulty?: string;
  criticality?: string;
  status?: string;
  knowledge?: KasbaElement | null;
  ability?: KasbaElement | null;
  skill?: KasbaElement | null;
  behaviour?: KasbaElement | null;
  attitude?: KasbaElement | null;
}

export interface CapabilityAssignment {
  id: string;
  tenantId: string;
  capabilityId: string;
  targetType: string;
  targetId: string;
  assignedBy: string;
  assignedDate: string;
  status: string;
}

export class CapabilityRepository {
  async create(input: CreateCapabilityInput): Promise<Capability> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO capabilities (id, tenant_id, org_id, capability_code, name, description, category, capability_type, difficulty, criticality, status, created_by, created_date, updated_date, knowledge, ability, skill, behaviour, attitude)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?,?,?)`,
      [
        id, input.tenantId, input.orgId, input.capabilityCode, input.name, input.description ?? null,
        input.category ?? 'general', input.capabilityType ?? 'competency', input.difficulty ?? 'intermediate',
        input.criticality ?? 'medium', input.createdBy, now, now,
        input.knowledge ? JSON.stringify(input.knowledge) : null,
        input.ability ? JSON.stringify(input.ability) : null,
        input.skill ? JSON.stringify(input.skill) : null,
        input.behaviour ? JSON.stringify(input.behaviour) : null,
        input.attitude ? JSON.stringify(input.attitude) : null,
      ]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM capabilities WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Capability | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capabilities WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByCode(tenantId: string, capabilityCode: string): Promise<Capability | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capabilities WHERE tenant_id = ? AND capability_code = ?', [tenantId, capabilityCode]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, orgId?: string, status?: string, category?: string): Promise<Capability[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined | null> = [tenantId];
    if (orgId) { clauses.push(`org_id = ?`); params.push(orgId); }
    if (status) { clauses.push(`status = ?`); params.push(status); }
    if (category) { clauses.push(`category = ?`); params.push(category); }
    const sql = `SELECT * FROM capabilities WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async search(tenantId: string, query: string, orgId?: string): Promise<Capability[]> {
    const pool = getPool();
    const like = `%${query}%`;
    const clauses: string[] = ['tenant_id = ?', `(name LIKE ? OR capability_code LIKE ? OR description LIKE ?)`];
    const params: Array<string | undefined | null> = [tenantId, like, like, like];
    if (orgId) { clauses.push(`org_id = ?`); params.push(orgId); }
    const sql = `SELECT * FROM capabilities WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async update(tenantId: string, id: string, patch: UpdateCapabilityInput): Promise<Capability | null> {
    const pool = getPool();
    const sets: string[] = [];
    const params: Array<unknown> = [];
    if (patch.name !== undefined) { sets.push(`name = ?`); params.push(patch.name); }
    if (patch.description !== undefined) { sets.push(`description = ?`); params.push(patch.description); }
    if (patch.category !== undefined) { sets.push(`category = ?`); params.push(patch.category); }
    if (patch.capabilityType !== undefined) { sets.push(`capability_type = ?`); params.push(patch.capabilityType); }
    if (patch.difficulty !== undefined) { sets.push(`difficulty = ?`); params.push(patch.difficulty); }
    if (patch.criticality !== undefined) { sets.push(`criticality = ?`); params.push(patch.criticality); }
    if (patch.status !== undefined) { sets.push(`status = ?`); params.push(patch.status); }
    if (patch.knowledge !== undefined) { sets.push(`knowledge = ?`); params.push(patch.knowledge ? JSON.stringify(patch.knowledge) : null); }
    if (patch.ability !== undefined) { sets.push(`ability = ?`); params.push(patch.ability ? JSON.stringify(patch.ability) : null); }
    if (patch.skill !== undefined) { sets.push(`skill = ?`); params.push(patch.skill ? JSON.stringify(patch.skill) : null); }
    if (patch.behaviour !== undefined) { sets.push(`behaviour = ?`); params.push(patch.behaviour ? JSON.stringify(patch.behaviour) : null); }
    if (patch.attitude !== undefined) { sets.push(`attitude = ?`); params.push(patch.attitude ? JSON.stringify(patch.attitude) : null); }
    if (!sets.length) return this.findById(tenantId, id);
    const sql = `UPDATE capabilities SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);
    await pool.execute<any>(sql, params as any[]);
    const [rows] = await pool.query<any[]>('SELECT * FROM capabilities WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async archive(tenantId: string, id: string): Promise<Capability | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  async snapshotVersion(capability: Capability, createdBy: string): Promise<void> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.execute<any>(
      `INSERT INTO capability_versions (id, capability_id, tenant_id, version, name, description, category, capability_type, difficulty, criticality, knowledge, ability, skill, behaviour, attitude, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, capability.id, capability.tenantId, capability.version, capability.name, capability.description,
        capability.category, capability.capabilityType, capability.difficulty, capability.criticality,
        capability.knowledge ? JSON.stringify(capability.knowledge) : null,
        capability.ability ? JSON.stringify(capability.ability) : null,
        capability.skill ? JSON.stringify(capability.skill) : null,
        capability.behaviour ? JSON.stringify(capability.behaviour) : null,
        capability.attitude ? JSON.stringify(capability.attitude) : null,
        createdBy, new Date().toISOString(),
      ]
    );
  }

  async getVersions(tenantId: string, capabilityId: string): Promise<Array<{ version: number; name: string; createdDate: string }>> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT version, name, created_date FROM capability_versions WHERE tenant_id = ? AND capability_id = ? ORDER BY version DESC',
      [tenantId, capabilityId]
    );
    return rows.map((r) => ({
      version: Number(r.version),
      name: String(r.name),
      createdDate: r.created_date ? new Date(r.created_date as string).toISOString() : '',
    }));
  }

  async upsertAssignment(tenantId: string, capabilityId: string, targetType: string, targetId: string, assignedBy: string): Promise<CapabilityAssignment> {
    const pool = getPool();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?',
      [tenantId, capabilityId, targetType, targetId]
    );
    if (existing.length) {
      await pool.execute<any>(
        `UPDATE capability_assignments SET status = 'active', assigned_date = NOW() WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?`,
        [tenantId, capabilityId, targetType, targetId]
      );
    } else {
      await pool.execute<any>(
        `INSERT INTO capability_assignments (id, tenant_id, capability_id, target_type, target_id, assigned_by, assigned_date, status) VALUES (?,?,?,?,?,?,NOW(),'active')`,
        [id, tenantId, capabilityId, targetType, targetId, assignedBy]
      );
    }
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?',
      [tenantId, capabilityId, targetType, targetId]
    );
    return this.mapAssignment(rows[0]);
  }

  async removeAssignment(tenantId: string, capabilityId: string, targetType: string, targetId: string): Promise<void> {
    const pool = getPool();
    await pool.execute<any>(
      `UPDATE capability_assignments SET status = 'inactive' WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?`,
      [tenantId, capabilityId, targetType, targetId]
    );
  }

  async getAssignments(tenantId: string, capabilityId: string): Promise<CapabilityAssignment[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND status = ?',
      [tenantId, capabilityId, 'active']
    );
    return rows.map((r) => this.mapAssignment(r));
  }

  async getAssignmentsForTarget(tenantId: string, targetType: string, targetId: string): Promise<CapabilityAssignment[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM capability_assignments WHERE tenant_id = ? AND target_type = ? AND target_id = ? AND status = ?',
      [tenantId, targetType, targetId, 'active']
    );
    return rows.map((r) => this.mapAssignment(r));
  }

  async listAllAssignments(tenantId: string): Promise<CapabilityAssignment[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_assignments WHERE tenant_id = ? AND status = ?', [tenantId, 'active']);
    return rows.map((r) => this.mapAssignment(r));
  }

  private mapAssignment(row: Record<string, unknown>): CapabilityAssignment {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      capabilityId: String(row.capability_id),
      targetType: String(row.target_type),
      targetId: String(row.target_id),
      assignedBy: String(row.assigned_by),
      assignedDate: row.assigned_date ? new Date(row.assigned_date as string).toISOString() : '',
      status: String(row.status),
    };
  }

  private mapRow(row: Record<string, unknown>): Capability {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      orgId: String(row.org_id),
      capabilityCode: String(row.capability_code),
      name: String(row.name),
      description: row.description as string | null,
      category: String(row.category),
      capabilityType: String(row.capability_type),
      difficulty: String(row.difficulty),
      criticality: String(row.criticality),
      version: Number(row.version),
      status: String(row.status),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
      knowledge: (row.knowledge as KasbaElement | null) ?? null,
      ability: (row.ability as KasbaElement | null) ?? null,
      skill: (row.skill as KasbaElement | null) ?? null,
      behaviour: (row.behaviour as KasbaElement | null) ?? null,
      attitude: (row.attitude as KasbaElement | null) ?? null,
    };
  }
}
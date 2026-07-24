import { getPool } from './connection.js';

export interface CareerCluster { id: string; tenantId: string; code: string; name: string; description: string | null }
export interface Occupation { id: string; tenantId: string; clusterId: string | null; occupationCode: string; title: string; description: string | null }
export interface OccupationRequirement { occupationId: string; capabilityId: string; requiredLevel: number }

export class CareerRepository {
  async createCluster(tenantId: string, code: string, name: string, description: string | undefined, createdBy: string): Promise<CareerCluster> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO career_clusters (id, tenant_id, code, name, description, created_by) VALUES (?,?,?,?,?,?)',
      [id, tenantId, code, name, description ?? null, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM career_clusters WHERE id = ?', [id]);
    return this.mapCluster(rows[0]);
  }

  async listClusters(tenantId: string): Promise<CareerCluster[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM career_clusters WHERE tenant_id = ? ORDER BY name', [tenantId]);
    return rows.map((r) => this.mapCluster(r));
  }

  async createOccupation(tenantId: string, clusterId: string | undefined, occupationCode: string, title: string, description: string | undefined, createdBy: string): Promise<Occupation> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      'INSERT INTO occupations (id, tenant_id, cluster_id, occupation_code, title, description, created_by) VALUES (?,?,?,?,?,?,?)',
      [id, tenantId, clusterId ?? null, occupationCode, title, description ?? null, createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM occupations WHERE id = ?', [id]);
    return this.mapOccupation(rows[0]);
  }

  async listOccupations(tenantId: string, clusterId?: string): Promise<Occupation[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined> = [tenantId];
    if (clusterId) { clauses.push('cluster_id = ?'); params.push(clusterId); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM occupations WHERE ${clauses.join(' AND ')} ORDER BY title`, params);
    return rows.map((r) => this.mapOccupation(r));
  }

  async setRequirement(tenantId: string, occupationId: string, capabilityId: string, requiredLevel: number): Promise<void> {
    const pool = getPool();
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM occupation_capability_requirements WHERE tenant_id = ? AND occupation_id = ? AND capability_id = ?',
      [tenantId, occupationId, capabilityId]
    );
    if (existing.length) {
      await pool.execute<any>(
        'UPDATE occupation_capability_requirements SET required_level = ? WHERE tenant_id = ? AND occupation_id = ? AND capability_id = ?',
        [requiredLevel, tenantId, occupationId, capabilityId]
      );
    } else {
      await pool.execute<any>(
        'INSERT INTO occupation_capability_requirements (tenant_id, occupation_id, capability_id, required_level) VALUES (?,?,?,?)',
        [tenantId, occupationId, capabilityId, requiredLevel]
      );
    }
  }

  async getRequirements(tenantId: string, occupationId: string): Promise<OccupationRequirement[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM occupation_capability_requirements WHERE tenant_id = ? AND occupation_id = ?', [tenantId, occupationId]);
    return rows.map((r) => ({ occupationId: String(r.occupation_id), capabilityId: String(r.capability_id), requiredLevel: Number(r.required_level) }));
  }

  private mapCluster(row: Record<string, unknown>): CareerCluster {
    return { id: String(row.id), tenantId: String(row.tenant_id), code: String(row.code), name: String(row.name), description: row.description as string | null };
  }
  private mapOccupation(row: Record<string, unknown>): Occupation {
    return { id: String(row.id), tenantId: String(row.tenant_id), clusterId: row.cluster_id as string | null, occupationCode: String(row.occupation_code), title: String(row.title), description: row.description as string | null };
  }
}

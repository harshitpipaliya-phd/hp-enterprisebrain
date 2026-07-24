import { getPool } from './connection.js';
export class CareerRepository {
    async createCluster(tenantId, code, name, description, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO career_clusters (id, tenant_id, code, name, description, created_by) VALUES (?,?,?,?,?,?)', [id, tenantId, code, name, description ?? null, createdBy]);
        const [rows] = await pool.query('SELECT * FROM career_clusters WHERE id = ?', [id]);
        return this.mapCluster(rows[0]);
    }
    async listClusters(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM career_clusters WHERE tenant_id = ? ORDER BY name', [tenantId]);
        return rows.map((r) => this.mapCluster(r));
    }
    async createOccupation(tenantId, clusterId, occupationCode, title, description, createdBy) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute('INSERT INTO occupations (id, tenant_id, cluster_id, occupation_code, title, description, created_by) VALUES (?,?,?,?,?,?,?)', [id, tenantId, clusterId ?? null, occupationCode, title, description ?? null, createdBy]);
        const [rows] = await pool.query('SELECT * FROM occupations WHERE id = ?', [id]);
        return this.mapOccupation(rows[0]);
    }
    async listOccupations(tenantId, clusterId) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (clusterId) {
            clauses.push('cluster_id = ?');
            params.push(clusterId);
        }
        const [rows] = await pool.query(`SELECT * FROM occupations WHERE ${clauses.join(' AND ')} ORDER BY title`, params);
        return rows.map((r) => this.mapOccupation(r));
    }
    async setRequirement(tenantId, occupationId, capabilityId, requiredLevel) {
        const pool = getPool();
        const [existing] = await pool.query('SELECT id FROM occupation_capability_requirements WHERE tenant_id = ? AND occupation_id = ? AND capability_id = ?', [tenantId, occupationId, capabilityId]);
        if (existing.length) {
            await pool.execute('UPDATE occupation_capability_requirements SET required_level = ? WHERE tenant_id = ? AND occupation_id = ? AND capability_id = ?', [requiredLevel, tenantId, occupationId, capabilityId]);
        }
        else {
            await pool.execute('INSERT INTO occupation_capability_requirements (tenant_id, occupation_id, capability_id, required_level) VALUES (?,?,?,?)', [tenantId, occupationId, capabilityId, requiredLevel]);
        }
    }
    async getRequirements(tenantId, occupationId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM occupation_capability_requirements WHERE tenant_id = ? AND occupation_id = ?', [tenantId, occupationId]);
        return rows.map((r) => ({ occupationId: String(r.occupation_id), capabilityId: String(r.capability_id), requiredLevel: Number(r.required_level) }));
    }
    mapCluster(row) {
        return { id: String(row.id), tenantId: String(row.tenant_id), code: String(row.code), name: String(row.name), description: row.description };
    }
    mapOccupation(row) {
        return { id: String(row.id), tenantId: String(row.tenant_id), clusterId: row.cluster_id, occupationCode: String(row.occupation_code), title: String(row.title), description: row.description };
    }
}

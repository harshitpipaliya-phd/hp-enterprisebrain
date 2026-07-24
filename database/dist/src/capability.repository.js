import { getPool } from './connection.js';
export class CapabilityRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO capabilities (id, tenant_id, org_id, capability_code, name, description, category, capability_type, difficulty, criticality, status, created_by, created_date, updated_date, knowledge, ability, skill, behaviour, attitude)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?,?,?)`, [
            id, input.tenantId, input.orgId, input.capabilityCode, input.name, input.description ?? null,
            input.category ?? 'general', input.capabilityType ?? 'competency', input.difficulty ?? 'intermediate',
            input.criticality ?? 'medium', input.createdBy, now, now,
            input.knowledge ? JSON.stringify(input.knowledge) : null,
            input.ability ? JSON.stringify(input.ability) : null,
            input.skill ? JSON.stringify(input.skill) : null,
            input.behaviour ? JSON.stringify(input.behaviour) : null,
            input.attitude ? JSON.stringify(input.attitude) : null,
        ]);
        const [rows] = await pool.query('SELECT * FROM capabilities WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capabilities WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findByCode(tenantId, capabilityCode) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capabilities WHERE tenant_id = ? AND capability_code = ?', [tenantId, capabilityCode]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, orgId, status, category) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (orgId) {
            clauses.push(`org_id = ?`);
            params.push(orgId);
        }
        if (status) {
            clauses.push(`status = ?`);
            params.push(status);
        }
        if (category) {
            clauses.push(`category = ?`);
            params.push(category);
        }
        const sql = `SELECT * FROM capabilities WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async search(tenantId, query, orgId) {
        const pool = getPool();
        const like = `%${query}%`;
        const clauses = ['tenant_id = ?', `(name LIKE ? OR capability_code LIKE ? OR description LIKE ?)`];
        const params = [tenantId, like, like, like];
        if (orgId) {
            clauses.push(`org_id = ?`);
            params.push(orgId);
        }
        const sql = `SELECT * FROM capabilities WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
        const [rows] = await pool.query(sql, params);
        return rows.map((r) => this.mapRow(r));
    }
    async update(tenantId, id, patch) {
        const pool = getPool();
        const sets = [];
        const params = [];
        if (patch.name !== undefined) {
            sets.push(`name = ?`);
            params.push(patch.name);
        }
        if (patch.description !== undefined) {
            sets.push(`description = ?`);
            params.push(patch.description);
        }
        if (patch.category !== undefined) {
            sets.push(`category = ?`);
            params.push(patch.category);
        }
        if (patch.capabilityType !== undefined) {
            sets.push(`capability_type = ?`);
            params.push(patch.capabilityType);
        }
        if (patch.difficulty !== undefined) {
            sets.push(`difficulty = ?`);
            params.push(patch.difficulty);
        }
        if (patch.criticality !== undefined) {
            sets.push(`criticality = ?`);
            params.push(patch.criticality);
        }
        if (patch.status !== undefined) {
            sets.push(`status = ?`);
            params.push(patch.status);
        }
        if (patch.knowledge !== undefined) {
            sets.push(`knowledge = ?`);
            params.push(patch.knowledge ? JSON.stringify(patch.knowledge) : null);
        }
        if (patch.ability !== undefined) {
            sets.push(`ability = ?`);
            params.push(patch.ability ? JSON.stringify(patch.ability) : null);
        }
        if (patch.skill !== undefined) {
            sets.push(`skill = ?`);
            params.push(patch.skill ? JSON.stringify(patch.skill) : null);
        }
        if (patch.behaviour !== undefined) {
            sets.push(`behaviour = ?`);
            params.push(patch.behaviour ? JSON.stringify(patch.behaviour) : null);
        }
        if (patch.attitude !== undefined) {
            sets.push(`attitude = ?`);
            params.push(patch.attitude ? JSON.stringify(patch.attitude) : null);
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const sql = `UPDATE capabilities SET ${sets.join(', ')} WHERE id = ?`;
        params.push(id);
        await pool.execute(sql, params);
        const [rows] = await pool.query('SELECT * FROM capabilities WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    async snapshotVersion(capability, createdBy) {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.execute(`INSERT INTO capability_versions (id, capability_id, tenant_id, version, name, description, category, capability_type, difficulty, criticality, knowledge, ability, skill, behaviour, attitude, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            id, capability.id, capability.tenantId, capability.version, capability.name, capability.description,
            capability.category, capability.capabilityType, capability.difficulty, capability.criticality,
            capability.knowledge ? JSON.stringify(capability.knowledge) : null,
            capability.ability ? JSON.stringify(capability.ability) : null,
            capability.skill ? JSON.stringify(capability.skill) : null,
            capability.behaviour ? JSON.stringify(capability.behaviour) : null,
            capability.attitude ? JSON.stringify(capability.attitude) : null,
            createdBy, new Date().toISOString(),
        ]);
    }
    async getVersions(tenantId, capabilityId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT version, name, created_date FROM capability_versions WHERE tenant_id = ? AND capability_id = ? ORDER BY version DESC', [tenantId, capabilityId]);
        return rows.map((r) => ({
            version: Number(r.version),
            name: String(r.name),
            createdDate: r.created_date ? new Date(r.created_date).toISOString() : '',
        }));
    }
    async upsertAssignment(tenantId, capabilityId, targetType, targetId, assignedBy) {
        const pool = getPool();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const [existing] = await pool.query('SELECT id FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?', [tenantId, capabilityId, targetType, targetId]);
        if (existing.length) {
            await pool.execute(`UPDATE capability_assignments SET status = 'active', assigned_date = NOW() WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?`, [tenantId, capabilityId, targetType, targetId]);
        }
        else {
            await pool.execute(`INSERT INTO capability_assignments (id, tenant_id, capability_id, target_type, target_id, assigned_by, assigned_date, status) VALUES (?,?,?,?,?,?,NOW(),'active')`, [id, tenantId, capabilityId, targetType, targetId, assignedBy]);
        }
        const [rows] = await pool.query('SELECT * FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?', [tenantId, capabilityId, targetType, targetId]);
        return this.mapAssignment(rows[0]);
    }
    async removeAssignment(tenantId, capabilityId, targetType, targetId) {
        const pool = getPool();
        await pool.execute(`UPDATE capability_assignments SET status = 'inactive' WHERE tenant_id = ? AND capability_id = ? AND target_type = ? AND target_id = ?`, [tenantId, capabilityId, targetType, targetId]);
    }
    async getAssignments(tenantId, capabilityId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capability_assignments WHERE tenant_id = ? AND capability_id = ? AND status = ?', [tenantId, capabilityId, 'active']);
        return rows.map((r) => this.mapAssignment(r));
    }
    async getAssignmentsForTarget(tenantId, targetType, targetId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capability_assignments WHERE tenant_id = ? AND target_type = ? AND target_id = ? AND status = ?', [tenantId, targetType, targetId, 'active']);
        return rows.map((r) => this.mapAssignment(r));
    }
    async listAllAssignments(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capability_assignments WHERE tenant_id = ? AND status = ?', [tenantId, 'active']);
        return rows.map((r) => this.mapAssignment(r));
    }
    mapAssignment(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            capabilityId: String(row.capability_id),
            targetType: String(row.target_type),
            targetId: String(row.target_id),
            assignedBy: String(row.assigned_by),
            assignedDate: row.assigned_date ? new Date(row.assigned_date).toISOString() : '',
            status: String(row.status),
        };
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            orgId: String(row.org_id),
            capabilityCode: String(row.capability_code),
            name: String(row.name),
            description: row.description,
            category: String(row.category),
            capabilityType: String(row.capability_type),
            difficulty: String(row.difficulty),
            criticality: String(row.criticality),
            version: Number(row.version),
            status: String(row.status),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
            knowledge: row.knowledge ?? null,
            ability: row.ability ?? null,
            skill: row.skill ?? null,
            behaviour: row.behaviour ?? null,
            attitude: row.attitude ?? null,
        };
    }
}

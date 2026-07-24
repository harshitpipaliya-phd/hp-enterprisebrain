import { getPool } from './connection.js';
export class DepartmentRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO departments (id, tenant_id, name, description, department_type, parent_department_id, head_id, org_id, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,'active',?,?,?)`, [id, input.tenantId, input.name, input.description ?? null, input.departmentType ?? 'department', input.parentDepartmentId ?? null, input.headId ?? null, input.orgId, input.createdBy, now, now]);
        const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM departments WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId, orgId, status) {
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
        const sql = `SELECT * FROM departments WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
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
        if (patch.departmentType !== undefined) {
            sets.push(`department_type = ?`);
            params.push(patch.departmentType);
        }
        if (patch.parentDepartmentId !== undefined) {
            sets.push(`parent_department_id = ?`);
            params.push(patch.parentDepartmentId);
        }
        if (patch.headId !== undefined) {
            sets.push(`head_id = ?`);
            params.push(patch.headId);
        }
        if (patch.orgId !== undefined) {
            sets.push(`org_id = ?`);
            params.push(patch.orgId);
        }
        if (patch.status !== undefined) {
            sets.push(`status = ?`);
            params.push(patch.status);
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const sql = `UPDATE departments SET ${sets.join(', ')} WHERE id = ?`;
        params.push(id);
        await pool.execute(sql, params);
        const [rows] = await pool.query('SELECT * FROM departments WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            name: String(row.name),
            description: row.description,
            departmentType: String(row.department_type),
            parentDepartmentId: row.parent_department_id,
            headId: row.head_id,
            orgId: String(row.org_id),
            status: String(row.status),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

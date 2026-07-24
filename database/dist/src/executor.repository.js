import { getPool } from './connection.js';
export class ExecutorRepository {
    async register(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO executors (id, tenant_id, executor_type, name, person_id, capability_tags, trust_level, max_concurrent, current_workload, available, status, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,0,true,'active',?,?)`, [
            id, input.tenantId, input.executorType, input.name, input.personId ?? null,
            JSON.stringify(input.capabilityTags ?? []), input.trustLevel ?? 0.5, input.maxConcurrent ?? 1, now, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM executors WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findAvailable(tenantId, executorType, requiredCapability) {
        const pool = getPool();
        const clauses = ['tenant_id = ?', 'executor_type = ?', 'available = 1', 'current_workload < max_concurrent', "status = 'active'"];
        const params = [tenantId, executorType];
        if (requiredCapability) {
            clauses.push(`JSON_CONTAINS(capability_tags, ?)`);
            params.push(JSON.stringify([requiredCapability]));
        }
        const [rows] = await pool.query(`SELECT * FROM executors WHERE ${clauses.join(' AND ')} ORDER BY trust_level DESC, current_workload ASC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM executors WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async list(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM executors WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    async adjustWorkload(tenantId, id, delta) {
        const pool = getPool();
        await pool.execute(`UPDATE executors SET current_workload = GREATEST(0, current_workload + ?), updated_date = NOW() WHERE tenant_id = ? AND id = ?`, [delta, tenantId, id]);
        const [rows] = await pool.query('SELECT * FROM executors WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            executorType: row.executor_type,
            name: String(row.name),
            personId: row.person_id,
            capabilityTags: row.capability_tags ?? [],
            trustLevel: Number(row.trust_level),
            maxConcurrent: Number(row.max_concurrent),
            currentWorkload: Number(row.current_workload),
            available: Boolean(row.available),
            status: String(row.status),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
            updatedDate: row.updated_date ? new Date(row.updated_date).toISOString() : new Date().toISOString(),
        };
    }
}

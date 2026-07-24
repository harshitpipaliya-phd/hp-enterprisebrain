import { getPool } from './connection.js';
export class GuardianRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const pool = getPool();
        await pool.execute(`INSERT INTO guardians (id, tenant_id, student_person_id, first_name, last_name, relationship, email, phone, is_primary_contact, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.studentPersonId, input.firstName, input.lastName, input.relationship,
            input.email ?? null, input.phone ?? null, input.isPrimaryContact ?? false, input.createdBy]);
        const [rows] = await pool.query('SELECT * FROM guardians WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async listForStudent(tenantId, studentPersonId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM guardians WHERE tenant_id = ? AND student_person_id = ? ORDER BY is_primary_contact DESC, created_date ASC', [tenantId, studentPersonId]);
        return rows.map((r) => this.mapRow(r));
    }
    async remove(tenantId, id) {
        const pool = getPool();
        const [result] = await pool.execute('DELETE FROM guardians WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return result.affectedRows > 0;
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), studentPersonId: String(row.student_person_id),
            firstName: String(row.first_name), lastName: String(row.last_name), relationship: String(row.relationship),
            email: row.email, phone: row.phone, isPrimaryContact: Boolean(row.is_primary_contact),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

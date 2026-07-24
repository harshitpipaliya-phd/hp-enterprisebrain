import { getPool } from './connection.js';

export interface Guardian {
  id: string;
  tenantId: string;
  studentPersonId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  isPrimaryContact: boolean;
  createdDate: string;
}

export interface CreateGuardianInput {
  tenantId: string;
  studentPersonId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
  isPrimaryContact?: boolean;
  createdBy: string;
}

export class GuardianRepository {
  async create(input: CreateGuardianInput): Promise<Guardian> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO guardians (id, tenant_id, student_person_id, first_name, last_name, relationship, email, phone, is_primary_contact, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.studentPersonId, input.firstName, input.lastName, input.relationship,
       input.email ?? null, input.phone ?? null, input.isPrimaryContact ?? false, input.createdBy]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM guardians WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async listForStudent(tenantId: string, studentPersonId: string): Promise<Guardian[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM guardians WHERE tenant_id = ? AND student_person_id = ? ORDER BY is_primary_contact DESC, created_date ASC', [tenantId, studentPersonId]);
    return rows.map((r) => this.mapRow(r));
  }

  async remove(tenantId: string, id: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<any>('DELETE FROM guardians WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return result.affectedRows > 0;
  }

  private mapRow(row: Record<string, unknown>): Guardian {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), studentPersonId: String(row.student_person_id),
      firstName: String(row.first_name), lastName: String(row.last_name), relationship: String(row.relationship),
      email: row.email as string | null, phone: row.phone as string | null, isPrimaryContact: Boolean(row.is_primary_contact),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

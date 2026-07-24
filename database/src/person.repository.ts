import { getPool } from './connection.js';

export interface Person {
  id: string;
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  employmentType: string;
  employmentStatus: string;
  joiningDate: string | null;
  departmentId: string | null;
  managerId: string | null;
  designation: string | null;
  location: string | null;
  reportingManagerId: string | null;
  orgId: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreatePersonInput {
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  email: string;
  phone?: string | null;
  profilePhoto?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  employmentType?: string;
  employmentStatus?: string;
  joiningDate?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  designation?: string | null;
  location?: string | null;
  reportingManagerId?: string | null;
  orgId: string;
  createdBy: string;
}

export interface UpdatePersonInput {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  email?: string;
  phone?: string | null;
  profilePhoto?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  employmentType?: string;
  employmentStatus?: string;
  joiningDate?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  designation?: string | null;
  location?: string | null;
  reportingManagerId?: string | null;
  orgId?: string;
  status?: string;
}

export class PersonRepository {
  async create(input: CreatePersonInput): Promise<Person> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO people (id, tenant_id, employee_id, first_name, last_name, display_name, email, phone, profile_photo, gender, date_of_birth, employment_type, employment_status, joining_date, department_id, manager_id, designation, location, reporting_manager_id, org_id, status, created_by, created_date, updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?,?,?)`,
      [id, input.tenantId, input.employeeId, input.firstName, input.lastName, input.displayName ?? null, input.email, input.phone ?? null, input.profilePhoto ?? null, input.gender ?? null, input.dateOfBirth ?? null, input.employmentType ?? 'full_time', input.employmentStatus ?? 'active', input.joiningDate ?? null, input.departmentId ?? null, input.managerId ?? null, input.designation ?? null, input.location ?? null, input.reportingManagerId ?? null, input.orgId, input.createdBy, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM people WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<Person | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM people WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByEmployeeId(tenantId: string, employeeId: string): Promise<Person | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM people WHERE tenant_id = ? AND employee_id = ?', [tenantId, employeeId]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Person | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM people WHERE tenant_id = ? AND email = ?', [tenantId, email]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string, orgId?: string, status?: string, departmentId?: string): Promise<Person[]> {
    const pool = getPool();
    const clauses: string[] = ['tenant_id = ?'];
    const params: Array<string | undefined | null> = [tenantId];
    if (orgId) { clauses.push(`org_id = ?`); params.push(orgId); }
    if (status) { clauses.push(`status = ?`); params.push(status); }
    if (departmentId) { clauses.push(`department_id = ?`); params.push(departmentId); }
    const sql = `SELECT * FROM people WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async search(tenantId: string, query: string, orgId?: string): Promise<Person[]> {
    const pool = getPool();
    const like = `%${query}%`;
    const clauses: string[] = ['tenant_id = ?', `(first_name LIKE ? OR last_name LIKE ? OR display_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)`];
    const params: Array<string | undefined | null> = [tenantId, like, like, like, like, like];
    if (orgId) { clauses.push(`org_id = ?`); params.push(orgId); }
    const sql = `SELECT * FROM people WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`;
    const [rows] = await pool.query<any[]>(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async update(tenantId: string, id: string, patch: UpdatePersonInput): Promise<Person | null> {
    const pool = getPool();
    const sets: string[] = [];
    const params: Array<string | undefined | null> = [];
    if (patch.employeeId !== undefined) { sets.push(`employee_id = ?`); params.push(patch.employeeId); }
    if (patch.firstName !== undefined) { sets.push(`first_name = ?`); params.push(patch.firstName); }
    if (patch.lastName !== undefined) { sets.push(`last_name = ?`); params.push(patch.lastName); }
    if (patch.displayName !== undefined) { sets.push(`display_name = ?`); params.push(patch.displayName); }
    if (patch.email !== undefined) { sets.push(`email = ?`); params.push(patch.email); }
    if (patch.phone !== undefined) { sets.push(`phone = ?`); params.push(patch.phone); }
    if (patch.profilePhoto !== undefined) { sets.push(`profile_photo = ?`); params.push(patch.profilePhoto); }
    if (patch.gender !== undefined) { sets.push(`gender = ?`); params.push(patch.gender); }
    if (patch.dateOfBirth !== undefined) { sets.push(`date_of_birth = ?`); params.push(patch.dateOfBirth); }
    if (patch.employmentType !== undefined) { sets.push(`employment_type = ?`); params.push(patch.employmentType); }
    if (patch.employmentStatus !== undefined) { sets.push(`employment_status = ?`); params.push(patch.employmentStatus); }
    if (patch.joiningDate !== undefined) { sets.push(`joining_date = ?`); params.push(patch.joiningDate); }
    if (patch.departmentId !== undefined) { sets.push(`department_id = ?`); params.push(patch.departmentId); }
    if (patch.managerId !== undefined) { sets.push(`manager_id = ?`); params.push(patch.managerId); }
    if (patch.designation !== undefined) { sets.push(`designation = ?`); params.push(patch.designation); }
    if (patch.location !== undefined) { sets.push(`location = ?`); params.push(patch.location); }
    if (patch.reportingManagerId !== undefined) { sets.push(`reporting_manager_id = ?`); params.push(patch.reportingManagerId); }
    if (patch.orgId !== undefined) { sets.push(`org_id = ?`); params.push(patch.orgId); }
    if (patch.status !== undefined) { sets.push(`status = ?`); params.push(patch.status); }
    if (!sets.length) return this.findById(tenantId, id);
    const sql = `UPDATE people SET ${sets.join(', ')} WHERE tenant_id = ? AND id = ?`;
    params.push(tenantId, id);
    await pool.execute<any>(sql, params as any[]);
    const [rows] = await pool.query<any[]>('SELECT * FROM people WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async archive(tenantId: string, id: string): Promise<Person | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapRow(row: Record<string, unknown>): Person {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      employeeId: String(row.employee_id),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      displayName: row.display_name as string | null,
      email: String(row.email),
      phone: row.phone as string | null,
      profilePhoto: row.profile_photo as string | null,
      gender: row.gender as string | null,
      dateOfBirth: row.date_of_birth as string | null,
      employmentType: String(row.employment_type),
      employmentStatus: String(row.employment_status),
      joiningDate: row.joining_date as string | null,
      departmentId: row.department_id as string | null,
      managerId: row.manager_id as string | null,
      designation: row.designation as string | null,
      location: row.location as string | null,
      reportingManagerId: row.reporting_manager_id as string | null,
      orgId: String(row.org_id),
      status: String(row.status),
      createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
      updatedDate: row.updated_date ? new Date(row.updated_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

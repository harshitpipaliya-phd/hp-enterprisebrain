import { sessionFor, type TenantSession } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
import type { Person, CreatePersonInput, UpdatePersonInput } from './person.types.js';

export class PersonGraphRepository extends BaseRepository {
  async create(input: CreatePersonInput): Promise<Person> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cypher = `
      CREATE (p:Person {
        id: $id, tenantId: $tenantId, employeeId: $employeeId, firstName: $firstName,
        lastName: $lastName, displayName: $displayName, email: $email, phone: $phone,
        profilePhoto: $profilePhoto, gender: $gender, dateOfBirth: $dateOfBirth,
        employmentType: $employmentType, employmentStatus: $employmentStatus,
        joiningDate: $joiningDate, departmentId: $departmentId, managerId: $managerId,
        designation: $designation, location: $location, reportingManagerId: $reportingManagerId,
        orgId: $orgId, status: 'active',
        createdBy: $createdBy, createdDate: $createdDate, updatedDate: $updatedDate
      })
      RETURN p`;
    const { records } = await this.run(cypher, {
      id,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      profilePhoto: input.profilePhoto ?? null,
      gender: input.gender ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      employmentType: input.employmentType ?? 'full_time',
      employmentStatus: input.employmentStatus ?? 'active',
      joiningDate: input.joiningDate ?? null,
      departmentId: input.departmentId ?? null,
      managerId: input.managerId ?? null,
      designation: input.designation ?? null,
      location: input.location ?? null,
      reportingManagerId: input.reportingManagerId ?? null,
      orgId: input.orgId,
      createdBy: input.createdBy,
      createdDate: now,
      updatedDate: now,
    });
    return this.mapPerson(records[0] as Record<string, unknown>);
  }

  async findById(tenantId: string, id: string): Promise<Person | null> {
    const cypher = `MATCH (p:Person {tenantId: $tenantId, id: $id}) RETURN p`;
    const { records } = await this.run(cypher, { tenantId, id });
    return records.length ? this.mapPerson(records[0] as Record<string, unknown>) : null;
  }

  async list(tenantId: string, orgId?: string, status?: string, departmentId?: string): Promise<Person[]> {
    const cypher = `MATCH (p:Person {tenantId: $tenantId})${orgId ? ' WHERE p.orgId = $orgId' : ''}${status ? (orgId ? ' AND' : ' WHERE') + " p.status = $status" : ''}${departmentId ? (orgId || status ? ' AND' : ' WHERE') + " p.departmentId = $departmentId" : ''} RETURN p ORDER BY p.createdDate DESC`;
    const params: Record<string, unknown> = { tenantId, ...(orgId ? { orgId } : {}), ...(status ? { status } : {}), ...(departmentId ? { departmentId } : {}) };
    const { records } = await this.run(cypher, params);
    return records.map((r) => this.mapPerson(r as Record<string, unknown>));
  }

  async update(tenantId: string, id: string, patch: UpdatePersonInput): Promise<Person | null> {
    const sets: string[] = [];
    const params: Record<string, unknown> = { tenantId, id };
    if (patch.employeeId !== undefined) { sets.push('p.employeeId = $employeeId'); params.employeeId = patch.employeeId; }
    if (patch.firstName !== undefined) { sets.push('p.firstName = $firstName'); params.firstName = patch.firstName; }
    if (patch.lastName !== undefined) { sets.push('p.lastName = $lastName'); params.lastName = patch.lastName; }
    if (patch.displayName !== undefined) { sets.push('p.displayName = $displayName'); params.displayName = patch.displayName; }
    if (patch.email !== undefined) { sets.push('p.email = $email'); params.email = patch.email; }
    if (patch.phone !== undefined) { sets.push('p.phone = $phone'); params.phone = patch.phone; }
    if (patch.profilePhoto !== undefined) { sets.push('p.profilePhoto = $profilePhoto'); params.profilePhoto = patch.profilePhoto; }
    if (patch.gender !== undefined) { sets.push('p.gender = $gender'); params.gender = patch.gender; }
    if (patch.dateOfBirth !== undefined) { sets.push('p.dateOfBirth = $dateOfBirth'); params.dateOfBirth = patch.dateOfBirth; }
    if (patch.employmentType !== undefined) { sets.push('p.employmentType = $employmentType'); params.employmentType = patch.employmentType; }
    if (patch.employmentStatus !== undefined) { sets.push('p.employmentStatus = $employmentStatus'); params.employmentStatus = patch.employmentStatus; }
    if (patch.joiningDate !== undefined) { sets.push('p.joiningDate = $joiningDate'); params.joiningDate = patch.joiningDate; }
    if (patch.departmentId !== undefined) { sets.push('p.departmentId = $departmentId'); params.departmentId = patch.departmentId; }
    if (patch.managerId !== undefined) { sets.push('p.managerId = $managerId'); params.managerId = patch.managerId; }
    if (patch.designation !== undefined) { sets.push('p.designation = $designation'); params.designation = patch.designation; }
    if (patch.location !== undefined) { sets.push('p.location = $location'); params.location = patch.location; }
    if (patch.reportingManagerId !== undefined) { sets.push('p.reportingManagerId = $reportingManagerId'); params.reportingManagerId = patch.reportingManagerId; }
    if (patch.orgId !== undefined) { sets.push('p.orgId = $orgId'); params.orgId = patch.orgId; }
    if (patch.status !== undefined) { sets.push('p.status = $status'); params.status = patch.status; }
    if (!sets.length) return this.findById(tenantId, id);
    const cypher = `MATCH (p:Person {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN p`;
    const { records } = await this.run(cypher, params);
    return records.length ? this.mapPerson(records[0] as Record<string, unknown>) : null;
  }

  async archive(tenantId: string, id: string): Promise<Person | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapPerson(node: Record<string, unknown>): Person {
    return {
      id: node.id as string,
      tenantId: node.tenantId as string,
      employeeId: node.employeeId as string,
      firstName: node.firstName as string,
      lastName: node.lastName as string,
      displayName: (node.displayName as string | null) ?? null,
      email: node.email as string,
      phone: (node.phone as string | null) ?? null,
      profilePhoto: (node.profilePhoto as string | null) ?? null,
      gender: (node.gender as string | null) ?? null,
      dateOfBirth: (node.dateOfBirth as string | null) ?? null,
      employmentType: node.employmentType as string,
      employmentStatus: node.employmentStatus as string,
      joiningDate: (node.joiningDate as string | null) ?? null,
      departmentId: (node.departmentId as string | null) ?? null,
      managerId: (node.managerId as string | null) ?? null,
      designation: (node.designation as string | null) ?? null,
      location: (node.location as string | null) ?? null,
      reportingManagerId: (node.reportingManagerId as string | null) ?? null,
      orgId: node.orgId as string,
      status: node.status as string,
      createdBy: node.createdBy as string,
      createdDate: node.createdDate as string,
      updatedDate: node.updatedDate as string,
    };
  }
}

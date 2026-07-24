import { BaseRepository } from '../repository/base.js';
export class PersonGraphRepository extends BaseRepository {
    async create(input) {
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
        return this.mapPerson(records[0]);
    }
    async findById(tenantId, id) {
        const cypher = `MATCH (p:Person {tenantId: $tenantId, id: $id}) RETURN p`;
        const { records } = await this.run(cypher, { tenantId, id });
        return records.length ? this.mapPerson(records[0]) : null;
    }
    async list(tenantId, orgId, status, departmentId) {
        const cypher = `MATCH (p:Person {tenantId: $tenantId})${orgId ? ' WHERE p.orgId = $orgId' : ''}${status ? (orgId ? ' AND' : ' WHERE') + " p.status = $status" : ''}${departmentId ? (orgId || status ? ' AND' : ' WHERE') + " p.departmentId = $departmentId" : ''} RETURN p ORDER BY p.createdDate DESC`;
        const params = { tenantId, ...(orgId ? { orgId } : {}), ...(status ? { status } : {}), ...(departmentId ? { departmentId } : {}) };
        const { records } = await this.run(cypher, params);
        return records.map((r) => this.mapPerson(r));
    }
    async update(tenantId, id, patch) {
        const sets = [];
        const params = { tenantId, id };
        if (patch.employeeId !== undefined) {
            sets.push('p.employeeId = $employeeId');
            params.employeeId = patch.employeeId;
        }
        if (patch.firstName !== undefined) {
            sets.push('p.firstName = $firstName');
            params.firstName = patch.firstName;
        }
        if (patch.lastName !== undefined) {
            sets.push('p.lastName = $lastName');
            params.lastName = patch.lastName;
        }
        if (patch.displayName !== undefined) {
            sets.push('p.displayName = $displayName');
            params.displayName = patch.displayName;
        }
        if (patch.email !== undefined) {
            sets.push('p.email = $email');
            params.email = patch.email;
        }
        if (patch.phone !== undefined) {
            sets.push('p.phone = $phone');
            params.phone = patch.phone;
        }
        if (patch.profilePhoto !== undefined) {
            sets.push('p.profilePhoto = $profilePhoto');
            params.profilePhoto = patch.profilePhoto;
        }
        if (patch.gender !== undefined) {
            sets.push('p.gender = $gender');
            params.gender = patch.gender;
        }
        if (patch.dateOfBirth !== undefined) {
            sets.push('p.dateOfBirth = $dateOfBirth');
            params.dateOfBirth = patch.dateOfBirth;
        }
        if (patch.employmentType !== undefined) {
            sets.push('p.employmentType = $employmentType');
            params.employmentType = patch.employmentType;
        }
        if (patch.employmentStatus !== undefined) {
            sets.push('p.employmentStatus = $employmentStatus');
            params.employmentStatus = patch.employmentStatus;
        }
        if (patch.joiningDate !== undefined) {
            sets.push('p.joiningDate = $joiningDate');
            params.joiningDate = patch.joiningDate;
        }
        if (patch.departmentId !== undefined) {
            sets.push('p.departmentId = $departmentId');
            params.departmentId = patch.departmentId;
        }
        if (patch.managerId !== undefined) {
            sets.push('p.managerId = $managerId');
            params.managerId = patch.managerId;
        }
        if (patch.designation !== undefined) {
            sets.push('p.designation = $designation');
            params.designation = patch.designation;
        }
        if (patch.location !== undefined) {
            sets.push('p.location = $location');
            params.location = patch.location;
        }
        if (patch.reportingManagerId !== undefined) {
            sets.push('p.reportingManagerId = $reportingManagerId');
            params.reportingManagerId = patch.reportingManagerId;
        }
        if (patch.orgId !== undefined) {
            sets.push('p.orgId = $orgId');
            params.orgId = patch.orgId;
        }
        if (patch.status !== undefined) {
            sets.push('p.status = $status');
            params.status = patch.status;
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const cypher = `MATCH (p:Person {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN p`;
        const { records } = await this.run(cypher, params);
        return records.length ? this.mapPerson(records[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapPerson(node) {
        return {
            id: node.id,
            tenantId: node.tenantId,
            employeeId: node.employeeId,
            firstName: node.firstName,
            lastName: node.lastName,
            displayName: node.displayName ?? null,
            email: node.email,
            phone: node.phone ?? null,
            profilePhoto: node.profilePhoto ?? null,
            gender: node.gender ?? null,
            dateOfBirth: node.dateOfBirth ?? null,
            employmentType: node.employmentType,
            employmentStatus: node.employmentStatus,
            joiningDate: node.joiningDate ?? null,
            departmentId: node.departmentId ?? null,
            managerId: node.managerId ?? null,
            designation: node.designation ?? null,
            location: node.location ?? null,
            reportingManagerId: node.reportingManagerId ?? null,
            orgId: node.orgId,
            status: node.status,
            createdBy: node.createdBy,
            createdDate: node.createdDate,
            updatedDate: node.updatedDate,
        };
    }
}

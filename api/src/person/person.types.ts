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

export type PersonStatus = 'active' | 'inactive' | 'archived';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'resigned';

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
  employmentType?: EmploymentType;
  employmentStatus?: EmploymentStatus;
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
  employmentType?: EmploymentType;
  employmentStatus?: EmploymentStatus;
  joiningDate?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  designation?: string | null;
  location?: string | null;
  reportingManagerId?: string | null;
  orgId?: string;
  status?: PersonStatus;
}

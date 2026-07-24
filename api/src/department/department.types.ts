export interface Department {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  departmentType: string;
  parentDepartmentId: string | null;
  headId: string | null;
  orgId: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export type DepartmentStatus = 'active' | 'inactive' | 'archived';
export type DepartmentType = 'department' | 'division' | 'unit' | 'team';

export interface CreateDepartmentInput {
  tenantId: string;
  name: string;
  description?: string;
  departmentType?: DepartmentType;
  parentDepartmentId?: string | null;
  headId?: string | null;
  orgId: string;
  createdBy: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
  departmentType?: DepartmentType;
  parentDepartmentId?: string | null;
  headId?: string | null;
  orgId?: string;
  status?: DepartmentStatus;
}

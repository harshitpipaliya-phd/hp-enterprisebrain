export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  legalName: string | null;
  orgCode: string;
  industry: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  logo: string | null;
  status: OrganizationStatus;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export type OrganizationStatus = 'active' | 'inactive' | 'archived';

export interface CreateOrganizationInput {
  tenantId: string;
  name: string;
  legalName?: string;
  orgCode: string;
  industry?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo?: string;
  createdBy: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  legalName?: string | null;
  orgCode?: string;
  industry?: string | null;
  country?: string | null;
  timezone?: string;
  currency?: string;
  logo?: string | null;
  status?: OrganizationStatus;
}

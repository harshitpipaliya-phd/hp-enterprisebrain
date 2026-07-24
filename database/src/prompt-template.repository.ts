import { getPool } from './connection.js';

export interface PromptTemplate {
  id: string;
  tenantId: string;
  name: string;
  template: string;
  variables: string[];
  version: number;
  previousVersionId: string | null;
  status: string;
  createdBy: string;
  createdDate: string;
}

export interface CreatePromptTemplateInput {
  tenantId: string;
  name: string;
  template: string;
  variables?: string[];
  createdBy: string;
}

export class PromptTemplateRepository {
  async create(input: CreatePromptTemplateInput): Promise<PromptTemplate> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO prompt_templates (id, tenant_id, name, template, variables, version, status, created_by, created_date)
       VALUES (?,?,?,?,?,1,'active',?,?)`,
      [id, input.tenantId, input.name, input.template, JSON.stringify(input.variables ?? []), input.createdBy, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM prompt_templates WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async createVersion(tenantId: string, previousId: string, template: string, variables: string[], createdBy: string): Promise<PromptTemplate> {
    const previous = await this.findById(tenantId, previousId);
    if (!previous) throw new Error('template_not_found');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO prompt_templates (id, tenant_id, name, template, variables, version, previous_version_id, status, created_by, created_date)
       VALUES (?,?,?,?,?,?,?, 'active',?,?)`,
      [id, tenantId, previous.name, template, JSON.stringify(variables), previous.version + 1, previousId, createdBy, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM prompt_templates WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<PromptTemplate | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM prompt_templates WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async list(tenantId: string): Promise<PromptTemplate[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM prompt_templates WHERE tenant_id = ? ORDER BY created_date DESC', [tenantId]);
    return rows.map((r) => this.mapRow(r));
  }

  render(template: PromptTemplate, values: Record<string, string>): string {
    return template.template.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key] ?? `{{${key}}}`);
  }

  private mapRow(row: Record<string, unknown>): PromptTemplate {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), name: String(row.name), template: String(row.template),
      variables: (row.variables as string[]) ?? [], version: Number(row.version ?? 1), previousVersionId: row.previous_version_id as string | null,
      status: String(row.status), createdBy: String(row.created_by),
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

import { getPool } from './connection.js';

export interface CapabilityProficiency {
  id: string;
  tenantId: string;
  assignmentId: string;
  knowledgeLevel: number | null;
  abilityLevel: number | null;
  skillLevel: number | null;
  behaviourLevel: number | null;
  attitudeLevel: number | null;
  evidenceConfidence: number | null;
  assessedBy: string | null;
  assessedDate: string | null;
  createdDate: string;
}

export interface RecordProficiencyInput {
  tenantId: string;
  assignmentId: string;
  knowledgeLevel?: number;
  abilityLevel?: number;
  skillLevel?: number;
  behaviourLevel?: number;
  attitudeLevel?: number;
  evidenceConfidence?: number;
  assessedBy: string;
}

export class CapabilityProficiencyRepository {
  async record(input: RecordProficiencyInput): Promise<CapabilityProficiency> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pool = getPool();
    await pool.execute<any>(
      `INSERT INTO capability_proficiency (id, tenant_id, assignment_id, knowledge_level, ability_level, skill_level, behaviour_level, attitude_level, evidence_confidence, assessed_by, assessed_date, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, input.tenantId, input.assignmentId, input.knowledgeLevel ?? null, input.abilityLevel ?? null, input.skillLevel ?? null,
       input.behaviourLevel ?? null, input.attitudeLevel ?? null, input.evidenceConfidence ?? null, input.assessedBy, now, now]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_proficiency WHERE id = ?', [id]);
    return this.mapRow(rows[0]);
  }

  async historyForAssignment(tenantId: string, assignmentId: string): Promise<CapabilityProficiency[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_proficiency WHERE tenant_id = ? AND assignment_id = ? ORDER BY created_date ASC', [tenantId, assignmentId]);
    return rows.map((r) => this.mapRow(r));
  }

  async latestForAssignment(tenantId: string, assignmentId: string): Promise<CapabilityProficiency | null> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM capability_proficiency WHERE tenant_id = ? AND assignment_id = ? ORDER BY created_date DESC LIMIT 1', [tenantId, assignmentId]);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async latestForAllAssignments(tenantId: string): Promise<CapabilityProficiency[]> {
    const pool = getPool();
    const [rows] = await pool.query<any[]>(
      `SELECT p1.* FROM capability_proficiency p1
       INNER JOIN (
         SELECT assignment_id, MAX(created_date) AS max_date
         FROM capability_proficiency
         WHERE tenant_id = ?
         GROUP BY assignment_id
       ) latest ON p1.assignment_id = latest.assignment_id AND p1.created_date = latest.max_date
       WHERE p1.tenant_id = ?`,
      [tenantId, tenantId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): CapabilityProficiency {
    return {
      id: String(row.id), tenantId: String(row.tenant_id), assignmentId: String(row.assignment_id),
      knowledgeLevel: row.knowledge_level != null ? Number(row.knowledge_level) : null,
      abilityLevel: row.ability_level != null ? Number(row.ability_level) : null,
      skillLevel: row.skill_level != null ? Number(row.skill_level) : null,
      behaviourLevel: row.behaviour_level != null ? Number(row.behaviour_level) : null,
      attitudeLevel: row.attitude_level != null ? Number(row.attitude_level) : null,
      evidenceConfidence: row.evidence_confidence != null ? Number(row.evidence_confidence) : null,
      assessedBy: row.assessed_by as string | null,
      assessedDate: row.assessed_date ? new Date(row.assessed_date as string).toISOString() : null,
      createdDate: row.created_date ? new Date(row.created_date as string).toISOString() : new Date().toISOString(),
    };
  }
}

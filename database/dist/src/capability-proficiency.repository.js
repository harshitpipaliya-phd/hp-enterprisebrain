import { getPool } from './connection.js';
export class CapabilityProficiencyRepository {
    async record(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const pool = getPool();
        await pool.execute(`INSERT INTO capability_proficiency (id, tenant_id, assignment_id, knowledge_level, ability_level, skill_level, behaviour_level, attitude_level, evidence_confidence, assessed_by, assessed_date, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id, input.tenantId, input.assignmentId, input.knowledgeLevel ?? null, input.abilityLevel ?? null, input.skillLevel ?? null,
            input.behaviourLevel ?? null, input.attitudeLevel ?? null, input.evidenceConfidence ?? null, input.assessedBy, now, now]);
        const [rows] = await pool.query('SELECT * FROM capability_proficiency WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async historyForAssignment(tenantId, assignmentId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capability_proficiency WHERE tenant_id = ? AND assignment_id = ? ORDER BY created_date ASC', [tenantId, assignmentId]);
        return rows.map((r) => this.mapRow(r));
    }
    async latestForAssignment(tenantId, assignmentId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM capability_proficiency WHERE tenant_id = ? AND assignment_id = ? ORDER BY created_date DESC LIMIT 1', [tenantId, assignmentId]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async latestForAllAssignments(tenantId) {
        const pool = getPool();
        const [rows] = await pool.query(`SELECT p1.* FROM capability_proficiency p1
       INNER JOIN (
         SELECT assignment_id, MAX(created_date) AS max_date
         FROM capability_proficiency
         WHERE tenant_id = ?
         GROUP BY assignment_id
       ) latest ON p1.assignment_id = latest.assignment_id AND p1.created_date = latest.max_date
       WHERE p1.tenant_id = ?`, [tenantId, tenantId]);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id), tenantId: String(row.tenant_id), assignmentId: String(row.assignment_id),
            knowledgeLevel: row.knowledge_level != null ? Number(row.knowledge_level) : null,
            abilityLevel: row.ability_level != null ? Number(row.ability_level) : null,
            skillLevel: row.skill_level != null ? Number(row.skill_level) : null,
            behaviourLevel: row.behaviour_level != null ? Number(row.behaviour_level) : null,
            attitudeLevel: row.attitude_level != null ? Number(row.attitude_level) : null,
            evidenceConfidence: row.evidence_confidence != null ? Number(row.evidence_confidence) : null,
            assessedBy: row.assessed_by,
            assessedDate: row.assessed_date ? new Date(row.assessed_date).toISOString() : null,
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

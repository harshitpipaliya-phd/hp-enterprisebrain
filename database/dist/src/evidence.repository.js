import { getPool } from './connection.js';
import { createHash } from 'node:crypto';
export class EvidenceRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const hash = createHash('sha256').update(JSON.stringify(input.content)).digest('hex');
        const pool = getPool();
        await pool.execute(`INSERT INTO evidence (id, tenant_id, signal_id, source, evidence_type, content, provenance, confidence, hash, version, status, observed_date, created_by, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,1,'active',?,?,?)`, [
            id, input.tenantId, input.signalId ?? null, input.source,
            input.evidenceType ?? 'observation',
            JSON.stringify(input.content), JSON.stringify(input.provenance),
            input.confidence ?? 0.5, hash, input.observedDate ?? now, input.createdBy, now,
        ]);
        const [rows] = await pool.query('SELECT * FROM evidence WHERE id = ?', [id]);
        return this.mapRow(rows[0]);
    }
    async findById(tenantId, id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM evidence WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return rows.length ? this.mapRow(rows[0]) : null;
    }
    async findBySignal(tenantId, signalId) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM evidence WHERE tenant_id = ? AND signal_id = ? ORDER BY created_date DESC', [tenantId, signalId]);
        return rows.map((r) => this.mapRow(r));
    }
    async list(tenantId, source) {
        const pool = getPool();
        const clauses = ['tenant_id = ?'];
        const params = [tenantId];
        if (source) {
            clauses.push('source = ?');
            params.push(source);
        }
        const [rows] = await pool.query(`SELECT * FROM evidence WHERE ${clauses.join(' AND ')} ORDER BY created_date DESC`, params);
        return rows.map((r) => this.mapRow(r));
    }
    mapRow(row) {
        return {
            id: String(row.id),
            tenantId: String(row.tenant_id),
            signalId: row.signal_id,
            source: String(row.source),
            evidenceType: String(row.evidence_type),
            content: row.content ?? {},
            provenance: row.provenance ?? {},
            confidence: Number(row.confidence),
            hash: String(row.hash),
            version: Number(row.version),
            status: String(row.status),
            observedDate: row.observed_date ? new Date(row.observed_date).toISOString() : new Date().toISOString(),
            createdBy: String(row.created_by),
            createdDate: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString(),
        };
    }
}

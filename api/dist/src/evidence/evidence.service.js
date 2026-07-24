import { eventBus, EvidenceEvents } from '@hpbrain/events';
/**
 * Freshness (Sprint 4 Story 2): evidence loses corroborating power as it ages.
 * A market report from a year ago says less about today's opportunity than one
 * from last week, even at the same stated confidence. Half-life of 90 days —
 * evidence at 90 days old contributes half its nominal weight, chosen to match
 * typical business-reporting cadence (roughly a quarter) rather than an arbitrary
 * number; tune via FRESHNESS_HALF_LIFE_DAYS if a domain needs a different decay.
 */
const FRESHNESS_HALF_LIFE_DAYS = 90;
export function computeFreshness(observedDate, now = new Date()) {
    const ageMs = now.getTime() - new Date(observedDate).getTime();
    const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
    return Math.pow(0.5, ageDays / FRESHNESS_HALF_LIFE_DAYS);
}
/**
 * Evidence Engine (Sprint 2 Story 2).
 * Evidence substantiates a Signal — every piece carries provenance (source, system,
 * method, timestamp, confidence, agent) so downstream Reasoning can weight it honestly
 * rather than treating all ingested material as equally trustworthy.
 */
export class EvidenceService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async collect(input) {
        const evidence = await this.repository.create(input);
        await eventBus.publish({
            type: EvidenceEvents.Collected,
            tenantId: evidence.tenantId,
            entityType: 'Evidence',
            entityId: evidence.id,
            actorId: input.createdBy,
            payload: { evidence },
        });
        return evidence;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async forSignal(tenantId, signalId) {
        return this.repository.findBySignal(tenantId, signalId);
    }
    async list(tenantId, source) {
        return this.repository.list(tenantId, source);
    }
}

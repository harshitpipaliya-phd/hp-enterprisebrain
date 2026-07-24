import { eventBus, OrganizationEvents, DepartmentEvents, PersonEvents, CapabilityEvents, SignalEvents, EvidenceEvents, ReasoningEvents, RecommendationEvents, DecisionEvents, OutcomeEvents, LearningEvents, ExecutorEvents, PolicyEvents, RiskEvents, MentalModelEvents, CaseEvents, HypothesisEvents } from '@hpbrain/events';
import { sessionFor } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
/**
 * Real bug fix, extracted as a pure, testable function: Neo4j node
 * properties cannot hold nested objects. `knowledge`/`ability`/`skill`/
 * `behaviour`/`attitude` on a Capability are nested KasbaElement objects,
 * and `SET c += $props` with them unflattened would throw the first time
 * this ran against a live Neo4j — never caught before because this
 * project has never run against one. Flattening also closes the "KASBA
 * must become queryable in the graph" gap, not just a bug fix.
 */
export function flattenCapabilityForGraph(data) {
    const flattenDimension = (dimension, el) => {
        if (!el || typeof el !== 'object')
            return {};
        const e = el;
        return {
            [`${dimension}TargetLevel`]: e.targetLevel ?? null,
            [`${dimension}CurrentLevel`]: e.currentLevel ?? null,
            [`${dimension}EvidenceRequired`]: e.evidenceRequired ?? null,
        };
    };
    const { knowledge, ability, skill, behaviour, attitude, ...scalarProps } = data;
    return {
        ...scalarProps,
        ...flattenDimension('knowledge', knowledge),
        ...flattenDimension('ability', ability),
        ...flattenDimension('skill', skill),
        ...flattenDimension('behaviour', behaviour),
        ...flattenDimension('attitude', attitude),
    };
}
export class GraphSyncRepository extends BaseRepository {
    async syncOrganization(data) {
        const cypher = `
      MERGE (o:Organization {id: $id, tenantId: $tenantId})
      SET o += $props, o.updatedDate = $updatedDate
      RETURN o`;
        await this.run(cypher, {
            id: data.id,
            tenantId: data.tenantId,
            props: data,
            updatedDate: new Date().toISOString(),
        });
    }
    async syncDepartment(data) {
        const cypher = `
      MERGE (d:Department {id: $id, tenantId: $tenantId})
      SET d += $props, d.updatedDate = $updatedDate
      WITH d
      MATCH (o:Organization {id: $orgId, tenantId: $tenantId})
      MERGE (o)-[:HAS_DEPARTMENT]->(d)
      RETURN d`;
        await this.run(cypher, {
            id: data.id,
            tenantId: data.tenantId,
            orgId: data.orgId,
            props: data,
            updatedDate: new Date().toISOString(),
        });
    }
    async syncPerson(data) {
        const cypher = `
      MERGE (p:Person {id: $id, tenantId: $tenantId})
      SET p += $props, p.updatedDate = $updatedDate
      WITH p
      OPTIONAL MATCH (o:Organization {id: $orgId, tenantId: $tenantId})
      MERGE (o)-[:HAS_PERSON]->(p)
      WITH p
      OPTIONAL MATCH (d:Department {id: $departmentId, tenantId: $tenantId})
      MERGE (d)-[:HAS_PERSON]->(p)
      WITH p
      OPTIONAL MATCH (m:Person {id: $managerId, tenantId: $tenantId})
      MERGE (p)-[:REPORTS_TO]->(m)
      RETURN p`;
        await this.run(cypher, {
            id: data.id,
            tenantId: data.tenantId,
            orgId: data.orgId,
            departmentId: data.departmentId,
            managerId: data.managerId,
            props: data,
            updatedDate: new Date().toISOString(),
        });
    }
    async syncCapability(data) {
        // Real bug found and fixed: `knowledge`/`ability`/`skill`/`behaviour`/
        // `attitude` are nested KasbaElement objects on the real Capability
        // shape — Neo4j node properties cannot hold nested objects at all.
        // The previous `SET c += $props` would throw the first time this ran
        // against a live Neo4j. Flattened here via a real, tested pure
        // function — also closes the "KASBA must become queryable in the
        // graph" gap, not just a bug fix.
        const props = flattenCapabilityForGraph(data);
        const cypher = `
      MERGE (c:Capability {id: $id, tenantId: $tenantId})
      SET c += $props, c.updatedDate = $updatedDate
      WITH c
      OPTIONAL MATCH (o:Organization {id: $orgId, tenantId: $tenantId})
      MERGE (o)-[:HAS_CAPABILITY]->(c)
      RETURN c`;
        await this.run(cypher, {
            id: data.id,
            tenantId: data.tenantId,
            orgId: data.orgId,
            props,
            updatedDate: new Date().toISOString(),
        });
    }
    async syncSignal(data) {
        const cypher = `
      MERGE (s:Signal {id: $id, tenantId: $tenantId})
      SET s += $props, s.updatedDate = $updatedDate
      WITH s
      OPTIONAL MATCH (o:Organization {id: $orgId, tenantId: $tenantId})
      MERGE (o)-[:HAS_SIGNAL]->(s)
      RETURN s`;
        await this.run(cypher, {
            id: data.id,
            tenantId: data.tenantId,
            orgId: data.orgId,
            props: data,
            updatedDate: new Date().toISOString(),
        });
    }
    async syncEvidence(data) {
        const cypher = `
      MERGE (e:Evidence {id: $id, tenantId: $tenantId})
      SET e += $props
      WITH e
      OPTIONAL MATCH (s:Signal {id: $signalId, tenantId: $tenantId})
      MERGE (s)-[:HAS_EVIDENCE]->(e)
      RETURN e`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, signalId: data.signalId, props: data });
    }
    async syncReasoningStep(data) {
        const cypher = `
      MERGE (r:ReasoningStep {id: $id, tenantId: $tenantId})
      SET r += $props
      WITH r
      OPTIONAL MATCH (s:Signal {id: $signalId, tenantId: $tenantId})
      MERGE (s)-[:REASONED_INTO]->(r)
      WITH r
      OPTIONAL MATCH (m:MentalModel {id: $mentalModelId, tenantId: $tenantId})
      MERGE (r)-[:APPLIES]->(m)
      RETURN r`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, signalId: data.signalId, mentalModelId: data.mentalModelId, props: data });
    }
    async syncRecommendation(data) {
        const cypher = `
      MERGE (rec:Recommendation {id: $id, tenantId: $tenantId})
      SET rec += $props, rec.updatedDate = $updatedDate
      WITH rec
      OPTIONAL MATCH (r:ReasoningStep {id: $reasoningStepId, tenantId: $tenantId})
      MERGE (r)-[:LED_TO]->(rec)
      RETURN rec`;
        await this.run(cypher, {
            id: data.id, tenantId: data.tenantId, reasoningStepId: data.reasoningStepId,
            props: data, updatedDate: new Date().toISOString(),
        });
    }
    async syncDecision(data) {
        const cypher = `
      MERGE (d:Decision {id: $id, tenantId: $tenantId})
      SET d += $props
      WITH d
      OPTIONAL MATCH (rec:Recommendation {id: $recommendationId, tenantId: $tenantId})
      MERGE (rec)-[:RESULTED_IN]->(d)
      RETURN d`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, recommendationId: data.recommendationId, props: data });
    }
    async syncOutcome(data) {
        const cypher = `
      MERGE (o:Outcome {id: $id, tenantId: $tenantId})
      SET o += $props
      WITH o
      OPTIONAL MATCH (d:Decision {id: $decisionId, tenantId: $tenantId})
      MERGE (d)-[:RESULTED_IN]->(o)
      RETURN o`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, decisionId: data.decisionId, props: data });
    }
    async syncLearning(data) {
        const cypher = `
      MERGE (l:Learning {id: $id, tenantId: $tenantId})
      SET l += $props
      WITH l
      OPTIONAL MATCH (o:Outcome {id: $outcomeId, tenantId: $tenantId})
      MERGE (o)-[:PRODUCED]->(l)
      WITH l
      OPTIONAL MATCH (m:MentalModel {id: $mentalModelId, tenantId: $tenantId})
      MERGE (l)-[:UPDATES]->(m)
      RETURN l`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, outcomeId: data.outcomeId, mentalModelId: data.mentalModelId, props: data });
    }
    async syncExecutor(data) {
        const cypher = `
      MERGE (e:Executor {id: $id, tenantId: $tenantId})
      SET e += $props, e.updatedDate = $updatedDate
      RETURN e`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, props: data, updatedDate: new Date().toISOString() });
    }
    async syncPolicy(data) {
        const cypher = `
      MERGE (p:Policy {id: $id, tenantId: $tenantId})
      SET p += $props, p.updatedDate = $updatedDate
      RETURN p`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, props: data, updatedDate: new Date().toISOString() });
    }
    async syncRisk(data) {
        const cypher = `
      MERGE (r:Risk {id: $id, tenantId: $tenantId})
      SET r += $props, r.updatedDate = $updatedDate
      WITH r
      OPTIONAL MATCH (d:Decision {id: $decisionId, tenantId: $tenantId})
      MERGE (d)-[:HAS_RISK]->(r)
      WITH r
      OPTIONAL MATCH (rec:Recommendation {id: $recommendationId, tenantId: $tenantId})
      MERGE (rec)-[:HAS_RISK]->(r)
      RETURN r`;
        await this.run(cypher, {
            id: data.id, tenantId: data.tenantId, decisionId: data.decisionId, recommendationId: data.recommendationId,
            props: data, updatedDate: new Date().toISOString(),
        });
    }
    /**
     * Sprint 4 Story 7: this relationship was genuinely missing. CapabilityEvents.Assigned
     * has been published since Sprint 1 but nothing ever subscribed to it — the
     * assignment was recorded in Postgres and never reached the graph at all, so
     * the Person -> Capability edge in "Organization -> Department -> Person ->
     * Capability" never existed. This is the fix, not new scope.
     */
    async syncCapabilityAssignment(data) {
        const assignment = data.assignment;
        const targetType = String(data.targetType);
        const cypher = `
      MATCH (c:Capability {id: $capabilityId, tenantId: $tenantId})
      MATCH (target {id: $targetId, tenantId: $tenantId})
      WHERE $targetType IN labels(target)
      MERGE (target)-[rel:HAS_CAPABILITY_ASSIGNMENT]->(c)
      SET rel.assignedBy = $assignedBy, rel.assignedDate = $assignedDate, rel.status = $status
      RETURN c`;
        await this.run(cypher, {
            capabilityId: assignment.capabilityId,
            tenantId: data.tenantId,
            targetId: data.targetId,
            targetType,
            assignedBy: assignment.assignedBy,
            assignedDate: assignment.assignedDate,
            status: assignment.status,
        });
    }
    async syncMentalModel(data) {
        const cypher = `
      MERGE (m:MentalModel {id: $id, tenantId: $tenantId})
      SET m += $props, m.updatedDate = $updatedDate
      RETURN m`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, props: data, updatedDate: new Date().toISOString() });
    }
    /**
     * Case and Hypothesis graph constraints have existed since before Sprint 1
     * (graph/migrations/001_constraints.cypher, the very first migration in
     * this repository). This is the first time anything actually syncs to
     * them — EPIC-004, finally implemented.
     */
    async syncCase(data) {
        const cypher = `
      MERGE (c:Case {id: $id, tenantId: $tenantId})
      SET c += $props, c.updatedDate = $updatedDate
      WITH c
      OPTIONAL MATCH (s:Signal {id: $signalId, tenantId: $tenantId})
      MERGE (s)-[:OPENED_CASE]->(c)
      RETURN c`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, signalId: data.signalId, props: data, updatedDate: new Date().toISOString() });
    }
    async syncHypothesis(data) {
        const cypher = `
      MERGE (h:Hypothesis {id: $id, tenantId: $tenantId})
      SET h += $props
      WITH h
      OPTIONAL MATCH (c:Case {id: $caseId, tenantId: $tenantId})
      MERGE (c)-[:CONSIDERS]->(h)
      RETURN h`;
        await this.run(cypher, { id: data.id, tenantId: data.tenantId, caseId: data.caseId, props: data });
    }
    async linkCaseEvidence(tenantId, caseId, evidenceId) {
        const cypher = `
      MATCH (c:Case {id: $caseId, tenantId: $tenantId})
      MATCH (e:Evidence {id: $evidenceId, tenantId: $tenantId})
      MERGE (c)-[:HAS_EVIDENCE]->(e)`;
        await this.run(cypher, { caseId, evidenceId, tenantId });
    }
    async archiveNode(label, id, tenantId) {
        const cypher = `MATCH (n:${label} {id: $id, tenantId: $tenantId}) SET n.status = 'archived', n.archivedDate = $archivedDate RETURN n`;
        await this.run(cypher, { id, tenantId, archivedDate: new Date().toISOString() });
    }
    async getNodeCount(tenantId, label) {
        const cypher = `MATCH (n:${label} {tenantId: $tenantId}) RETURN count(n) as count`;
        const { records } = await this.run(cypher, { tenantId });
        return records.length ? Number(records[0].count) : 0;
    }
    async getRelationshipCount(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId})-[r]->(m) RETURN count(r) as count`;
        const { records } = await this.run(cypher, { tenantId });
        return records.length ? Number(records[0].count) : 0;
    }
    async getNodesByLabel(tenantId) {
        const labels = ['Organization', 'Department', 'Person', 'Capability', 'Signal', 'Evidence', 'ReasoningStep', 'Recommendation', 'Decision', 'Outcome', 'Learning', 'Executor', 'Policy', 'Risk', 'MentalModel', 'Case', 'Hypothesis'];
        const result = {};
        for (const label of labels) {
            result[label] = await this.getNodeCount(tenantId, label);
        }
        return result;
    }
    async getRelationshipsByType(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId})-[r]->(m) RETURN type(r) as type, count(r) as count`;
        const { records } = await this.run(cypher, { tenantId });
        const result = {};
        for (const record of records) {
            result[record.type] = Number(record.count);
        }
        return result;
    }
    async findOrphanNodes(tenantId) {
        const labels = ['Organization', 'Department', 'Person', 'Capability', 'Signal', 'Evidence', 'ReasoningStep', 'Recommendation', 'Decision', 'Outcome', 'Learning', 'Executor', 'Policy', 'Risk', 'MentalModel', 'Case', 'Hypothesis'];
        const orphans = [];
        for (const label of labels) {
            const cypher = `MATCH (n:${label} {tenantId: $tenantId}) WHERE NOT (n)--() RETURN n.id as id, labels(n) as labels`;
            const { records } = await this.run(cypher, { tenantId });
            for (const record of records) {
                orphans.push({ label, id: record.id });
            }
        }
        return orphans;
    }
    async findTenantIsolationViolations() {
        const cypher = `MATCH (n) WHERE n.tenantId IS NULL RETURN count(n) as count`;
        const { records } = await this.run(cypher, { tenantId: 'any' });
        return records.length ? Number(records[0].count) : 0;
    }
}
export class GraphSyncService {
    sessionFactory;
    status = [];
    retryQueue = [];
    maxRetries = 3;
    constructor(sessionFactory = sessionFor) {
        this.sessionFactory = sessionFactory;
    }
    start() {
        // Organization events
        eventBus.on(OrganizationEvents.Created, (e) => this.handleEvent(e, 'Organization'));
        eventBus.on(OrganizationEvents.Updated, (e) => this.handleEvent(e, 'Organization'));
        eventBus.on(OrganizationEvents.Archived, (e) => this.handleEvent(e, 'Organization', true));
        // Department events
        eventBus.on(DepartmentEvents.Created, (e) => this.handleEvent(e, 'Department'));
        eventBus.on(DepartmentEvents.Updated, (e) => this.handleEvent(e, 'Department'));
        eventBus.on(DepartmentEvents.Archived, (e) => this.handleEvent(e, 'Department', true));
        // Person events
        eventBus.on(PersonEvents.Created, (e) => this.handleEvent(e, 'Person'));
        eventBus.on(PersonEvents.Updated, (e) => this.handleEvent(e, 'Person'));
        eventBus.on(PersonEvents.Archived, (e) => this.handleEvent(e, 'Person', true));
        // Capability events
        eventBus.on(CapabilityEvents.Created, (e) => this.handleEvent(e, 'Capability'));
        eventBus.on(CapabilityEvents.Updated, (e) => this.handleEvent(e, 'Capability'));
        eventBus.on(CapabilityEvents.Archived, (e) => this.handleEvent(e, 'Capability', true));
        // Signal events (Sprint 2 Story 1)
        eventBus.on(SignalEvents.Detected, (e) => this.handleEvent(e, 'Signal'));
        eventBus.on(SignalEvents.StatusChanged, (e) => this.handleEvent(e, 'Signal'));
        // Evidence events (Sprint 2 Story 2)
        eventBus.on(EvidenceEvents.Collected, (e) => this.handleEvent(e, 'Evidence'));
        // Reasoning events (Sprint 2 Story 3)
        eventBus.on(ReasoningEvents.StepRecorded, (e) => this.handleEvent(e, 'ReasoningStep'));
        // Recommendation events (Sprint 2 Story 4)
        eventBus.on(RecommendationEvents.Generated, (e) => this.handleEvent(e, 'Recommendation'));
        eventBus.on(RecommendationEvents.StatusChanged, (e) => this.handleEvent(e, 'Recommendation'));
        // Decision events (Sprint 2 Story 6)
        eventBus.on(DecisionEvents.Made, (e) => this.handleEvent(e, 'Decision'));
        // Outcome events (Sprint 2 Story 7)
        eventBus.on(OutcomeEvents.Captured, (e) => this.handleEvent(e, 'Outcome'));
        // Learning events (Sprint 2 Story 8)
        eventBus.on(LearningEvents.Extracted, (e) => this.handleEvent(e, 'Learning'));
        // Executor events (Sprint 3 Story 5)
        eventBus.on(ExecutorEvents.Registered, (e) => this.handleEvent(e, 'Executor'));
        // Policy events (Sprint 4 Story 5)
        eventBus.on(PolicyEvents.Created, (e) => this.handleEvent(e, 'Policy'));
        eventBus.on(PolicyEvents.VersionCreated, (e) => this.handleEvent(e, 'Policy'));
        // Risk events (Sprint 4 Story 6)
        eventBus.on(RiskEvents.Assessed, (e) => this.handleEvent(e, 'Risk'));
        eventBus.on(RiskEvents.Mitigated, (e) => this.handleEvent(e, 'Risk'));
        // Mental Model events (Sprint 5 — closes the loop Sprint 2 declared but never implemented)
        eventBus.on(MentalModelEvents.Created, (e) => this.handleEvent(e, 'MentalModel'));
        eventBus.on(MentalModelEvents.Reinforced, (e) => this.handleEvent(e, 'MentalModel'));
        // Capability assignment (Sprint 4 Story 7 fix — was published since Sprint 1,
        // never subscribed to; the Person -> Capability graph edge never existed).
        eventBus.on(CapabilityEvents.Assigned, (e) => this.handleAssignmentEvent(e));
        // Case Engine (EPIC-004 — Case/Hypothesis constrained since before Sprint 1, never synced until now)
        eventBus.on(CaseEvents.Opened, (e) => this.handleEvent(e, 'Case'));
        eventBus.on(CaseEvents.StatusChanged, (e) => this.handleEvent(e, 'Case'));
        eventBus.on(CaseEvents.EvidenceLinked, (e) => this.handleCaseEvidenceLink(e));
        eventBus.on(HypothesisEvents.Proposed, (e) => this.handleEvent(e, 'Hypothesis'));
        eventBus.on(HypothesisEvents.Supported, (e) => this.handleEvent(e, 'Hypothesis'));
        eventBus.on(HypothesisEvents.Rejected, (e) => this.handleEvent(e, 'Hypothesis'));
        eventBus.on(HypothesisEvents.Confirmed, (e) => this.handleEvent(e, 'Hypothesis'));
    }
    async handleCaseEvidenceLink(event) {
        const session = this.sessionFactory(event.tenantId);
        try {
            const repo = new GraphSyncRepository(session);
            const payload = event.payload;
            await repo.linkCaseEvidence(event.tenantId, event.entityId, String(payload.evidenceId));
            this.status.push({ tenantId: event.tenantId, entityType: 'Case', entityId: event.entityId, action: event.type, status: 'success', timestamp: event.timestamp });
        }
        catch (e) {
            this.status.push({ tenantId: event.tenantId, entityType: 'Case', entityId: event.entityId, action: event.type, status: 'failed', timestamp: event.timestamp, error: e.message });
        }
        finally {
            await session.close();
        }
    }
    async handleAssignmentEvent(event) {
        const session = this.sessionFactory(event.tenantId);
        try {
            const repo = new GraphSyncRepository(session);
            await repo.syncCapabilityAssignment({ ...event.payload, tenantId: event.tenantId });
            this.status.push({
                tenantId: event.tenantId, entityType: 'CapabilityAssignment', entityId: event.entityId,
                action: event.type, status: 'success', timestamp: event.timestamp,
            });
        }
        catch (e) {
            this.status.push({
                tenantId: event.tenantId, entityType: 'CapabilityAssignment', entityId: event.entityId,
                action: event.type, status: 'failed', timestamp: event.timestamp, error: e.message,
            });
        }
        finally {
            await session.close();
        }
    }
    async handleEvent(event, label, isArchive = false) {
        const session = this.sessionFactory(event.tenantId);
        try {
            const repo = new GraphSyncRepository(session);
            const data = event.payload;
            const entity = data[Object.keys(data).find((k) => k.toLowerCase() === label.toLowerCase()) || 'entity'] ?? data;
            if (isArchive) {
                await repo.archiveNode(label, event.entityId, event.tenantId);
            }
            else {
                const syncMethod = `sync${label}`;
                await repo[syncMethod](entity);
            }
            this.status.push({
                tenantId: event.tenantId,
                entityType: label,
                entityId: event.entityId,
                action: isArchive ? 'archive' : event.type,
                status: 'success',
                timestamp: event.timestamp,
            });
        }
        catch (e) {
            this.status.push({
                tenantId: event.tenantId,
                entityType: label,
                entityId: event.entityId,
                action: isArchive ? 'archive' : event.type,
                status: 'failed',
                timestamp: event.timestamp,
                error: e.message,
            });
            this.retryQueue.push({ data: event.payload, label, attempts: 0 });
        }
        finally {
            await session.close();
        }
    }
    async retryFailed() {
        const results = [];
        for (const item of this.retryQueue) {
            if (item.attempts >= this.maxRetries)
                continue;
            item.attempts++;
            const session = this.sessionFactory('retry');
            try {
                const repo = new GraphSyncRepository(session);
                const syncMethod = `sync${item.label}`;
                await repo[syncMethod](item.data);
                results.push({
                    tenantId: 'retry',
                    entityType: item.label,
                    entityId: String(item.data.id ?? 'unknown'),
                    action: 'retry',
                    status: 'success',
                    timestamp: new Date().toISOString(),
                });
            }
            catch (e) {
                results.push({
                    tenantId: 'retry',
                    entityType: item.label,
                    entityId: String(item.data.id ?? 'unknown'),
                    action: 'retry',
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    error: e.message,
                });
            }
            finally {
                await session.close();
            }
        }
        return results;
    }
    getStatus(tenantId) {
        if (!tenantId)
            return [...this.status];
        return this.status.filter((s) => s.tenantId === tenantId);
    }
    async getStats(tenantId) {
        const session = this.sessionFactory(tenantId);
        try {
            const repo = new GraphSyncRepository(session);
            const nodesByLabel = await repo.getNodesByLabel(tenantId);
            const relationshipsByType = await repo.getRelationshipsByType(tenantId);
            const totalNodes = Object.values(nodesByLabel).reduce((a, b) => a + b, 0);
            const totalRelationships = Object.values(relationshipsByType).reduce((a, b) => a + b, 0);
            const orphanNodes = (await repo.findOrphanNodes(tenantId)).length;
            const tenantIsolationViolations = await repo.findTenantIsolationViolations();
            return {
                totalNodes,
                totalRelationships,
                nodesByLabel,
                relationshipsByType,
                tenantIsolationViolations,
                orphanNodes,
            };
        }
        finally {
            await session.close();
        }
    }
}

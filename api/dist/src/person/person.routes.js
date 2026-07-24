import { Router } from 'express';
import { z } from 'zod';
import { PersonService } from './person.service.js';
import { PersonRepository, CapabilityRepository, CapabilityProficiencyRepository, DecisionRepository, LearningRepository, EventStoreRepository, GuardianRepository, EsoExecutionRepository } from '@hpbrain/database';
import { computeKasbaScore, computeCapabilityGap, computeIndividualScore } from '../kasba/assessment-engine.js';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { eventBus, PersonEvents, ManagerChangedEvent, DepartmentAssignedEvent } from '@hpbrain/events';
import { getPersonAuditLogs } from '@hpbrain/events';
const createSchema = z.object({
    tenantId: z.string().min(1),
    employeeId: z.string().min(1).max(100),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    displayName: z.string().max(200).optional().nullable(),
    email: z.string().email().max(200),
    phone: z.string().max(20).optional().nullable(),
    profilePhoto: z.string().url().optional().nullable().or(z.literal('')),
    gender: z.string().max(20).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
    employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'resigned']).optional(),
    joiningDate: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    managerId: z.string().optional().nullable(),
    designation: z.string().max(200).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    reportingManagerId: z.string().optional().nullable(),
    orgId: z.string().min(1),
    createdBy: z.string().min(1),
});
const updateSchema = z.object({
    employeeId: z.string().min(1).max(100).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    displayName: z.string().max(200).optional().nullable(),
    email: z.string().email().max(200).optional(),
    phone: z.string().max(20).optional().nullable(),
    profilePhoto: z.string().url().optional().nullable().or(z.literal('')),
    gender: z.string().max(20).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
    employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'resigned']).optional(),
    joiningDate: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    managerId: z.string().optional().nullable(),
    designation: z.string().max(200).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    reportingManagerId: z.string().optional().nullable(),
    orgId: z.string().min(1).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
});
function serializeChanges(before, after) {
    const changes = {};
    for (const key of Object.keys({ ...before, ...after })) {
        if (before[key] !== after[key]) {
            changes[key] = { from: before[key], to: after[key] };
        }
    }
    return changes;
}
const defaultRepo = new PersonRepository();
export function personRoutes(service = new PersonService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'hr_manager'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const input = { ...parsed.data, createdBy: req.user.id };
        try {
            const person = await service.create(input);
            await eventBus.publish({
                type: PersonEvents.Created,
                tenantId: person.tenantId,
                entityType: 'Person',
                entityId: person.id,
                actorId: req.user.id,
                payload: { actorName: req.user.name ?? req.user.id, person },
            });
            return res.status(201).json(person);
        }
        catch (e) {
            return res.status(409).json({ error: e.message });
        }
    });
    router.get('/:tenantId', async (req, res) => {
        const orgId = req.query.orgId;
        const status = req.query.status;
        const departmentId = req.query.departmentId;
        const people = await service.list(req.params.tenantId, orgId, status, departmentId);
        return res.json(people);
    });
    router.get('/:tenantId/search', async (req, res) => {
        const q = req.query.q;
        if (!q)
            return res.status(400).json({ error: 'missing_query' });
        const orgId = req.query.orgId;
        const people = await service.search(req.params.tenantId, q, orgId);
        return res.json(people);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const person = await service.get(req.params.tenantId, req.params.id);
        if (!person)
            return res.status(404).json({ error: 'not_found' });
        return res.json(person);
    });
    router.get('/:tenantId/:id/audit', async (req, res) => {
        const logs = await getPersonAuditLogs(req.params.tenantId, req.params.id);
        return res.json(logs);
    });
    /**
     * Person Twin (Digital Twin Sprint, Part 3; extended for the Teacher
     * Intelligence MVP milestone). Real aggregation, including — new this
     * pass — actual KASBA scores and gap analysis per assigned capability,
     * not just capability IDs. The Assessment Engine (computeKasbaScore,
     * computeCapabilityGap) has existed since the KASBA sprint but Person
     * Twin never called it; a teacher's twin listing "5 capabilities" with
     * no scores was the real gap this milestone's Part 1+2 overlap points
     * at. Reuses those functions verbatim — no new scoring logic.
     */
    router.get('/:tenantId/:id/twin', async (req, res) => {
        const { tenantId, id } = req.params;
        const person = await service.get(tenantId, id);
        if (!person)
            return res.status(404).json({ error: 'not_found' });
        const [assignments, allDecisions, allLearnings, timeline, guardians, allExecutions] = await Promise.all([
            new CapabilityRepository().getAssignmentsForTarget(tenantId, 'person', id),
            new DecisionRepository().list(tenantId),
            new LearningRepository().list(tenantId),
            new EventStoreRepository().findByEntity(tenantId, 'Person', id),
            new GuardianRepository().listForStudent(tenantId, id),
            new EsoExecutionRepository().list(tenantId),
        ]);
        const proficiencyRepo = new CapabilityProficiencyRepository();
        const capabilityRepo = new CapabilityRepository();
        const capabilityScores = await Promise.all(assignments.map(async (a) => {
            const [latest, capability] = await Promise.all([
                proficiencyRepo.latestForAssignment(tenantId, a.id),
                capabilityRepo.findById(tenantId, a.capabilityId),
            ]);
            return {
                capabilityId: a.capabilityId,
                capabilityName: capability?.name ?? a.capabilityId,
                assignmentId: a.id,
                scores: computeKasbaScore(latest),
                gaps: capability ? computeCapabilityGap(latest, capability) : [],
                assessedDate: latest?.assessedDate ?? null,
            };
        }));
        const decisionsDecidedByPerson = allDecisions.filter((d) => d.decidedBy === id);
        const learningsCreatedByPerson = allLearnings.filter((l) => l.createdBy === id);
        const personExecutions = allExecutions.filter((e) => e.executedBy === id);
        // Individual Intelligence Score (Master Implementation Prompt, Step 5).
        // Reuses data already assembled above for this same response — no new
        // fetches, no new logic beyond the pure scoring function itself.
        const individualScore = computeIndividualScore({
            capabilityOveralls: capabilityScores.map((c) => c.scores.overall).filter((s) => s != null),
            decisionApprovalRate: decisionsDecidedByPerson.length > 0 ? Number((decisionsDecidedByPerson.filter((d) => d.status === 'approved').length / decisionsDecidedByPerson.length).toFixed(3)) : null,
            executionSuccessRate: personExecutions.length > 0 ? Number((personExecutions.filter((e) => e.status === 'completed').length / personExecutions.length).toFixed(3)) : null,
        });
        return res.json({
            person,
            capabilityCount: assignments.length,
            capabilityScores,
            decisionParticipation: { total: decisionsDecidedByPerson.length, approved: decisionsDecidedByPerson.filter((d) => d.status === 'approved').length },
            learningContributions: learningsCreatedByPerson.length,
            recentActivity: timeline.slice(-20).reverse(),
            guardians,
            executionHistory: personExecutions
                .slice(0, 20)
                .map((e) => ({ id: e.id, esoId: e.esoId, status: e.status, completedDate: e.completedDate, createdDate: e.createdDate })),
            individualScore,
        });
    });
    router.patch('/:tenantId/:id', async (req, res) => {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const existing = await service.get(req.params.tenantId, req.params.id);
        if (!existing)
            return res.status(404).json({ error: 'not_found' });
        try {
            const updated = await service.update(req.params.tenantId, req.params.id, parsed.data);
            if (!updated)
                return res.status(404).json({ error: 'not_found' });
            const changes = serializeChanges(existing, updated);
            await eventBus.publish({
                type: PersonEvents.Updated,
                tenantId: updated.tenantId,
                entityType: 'Person',
                entityId: updated.id,
                actorId: req.user.id,
                payload: { actorName: req.user.name ?? req.user.id, changes, person: updated },
            });
            if (parsed.data.managerId !== undefined && parsed.data.managerId !== existing.managerId) {
                await eventBus.publish({
                    type: ManagerChangedEvent,
                    tenantId: updated.tenantId,
                    entityType: 'Person',
                    entityId: updated.id,
                    actorId: req.user.id,
                    payload: { actorName: req.user.name ?? req.user.id, person: updated, previousManagerId: existing.managerId, newManagerId: parsed.data.managerId },
                });
            }
            if (parsed.data.departmentId !== undefined && parsed.data.departmentId !== existing.departmentId) {
                await eventBus.publish({
                    type: DepartmentAssignedEvent,
                    tenantId: updated.tenantId,
                    entityType: 'Person',
                    entityId: updated.id,
                    actorId: req.user.id,
                    payload: { actorName: req.user.name ?? req.user.id, person: updated, previousDepartmentId: existing.departmentId, newDepartmentId: parsed.data.departmentId },
                });
            }
            return res.json(updated);
        }
        catch (e) {
            return res.status(409).json({ error: e.message });
        }
    });
    router.post('/:tenantId/:id/archive', async (req, res) => {
        const existing = await service.get(req.params.tenantId, req.params.id);
        if (!existing)
            return res.status(404).json({ error: 'not_found' });
        const archived = await service.archive(req.params.tenantId, req.params.id);
        if (!archived)
            return res.status(404).json({ error: 'not_found' });
        await eventBus.publish({
            type: PersonEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Person',
            entityId: archived.id,
            actorId: req.user.id,
            payload: { actorName: req.user.name ?? req.user.id, person: archived },
        });
        return res.json(archived);
    });
    return router;
}
export default personRoutes;

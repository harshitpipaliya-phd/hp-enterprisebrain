import { Router } from 'express';
import { z } from 'zod';
import { DepartmentService } from './department.service.js';
import { DepartmentRepository, PersonRepository, CapabilityRepository, CapabilityProficiencyRepository, SignalRepository, DecisionRepository, EventStoreRepository } from '@hpbrain/database';
import { computeCapabilityHeatmap } from '../kasba/capability-heatmap.js';
import { detectUnaddressedHighSeveritySignals } from '../reasoning-engine/checks.js';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { eventBus, DepartmentEvents } from '@hpbrain/events';
import { getDepartmentAuditLogs } from '@hpbrain/events';
const createSchema = z.object({
    tenantId: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    departmentType: z.enum(['department', 'division', 'unit', 'team']).optional(),
    parentDepartmentId: z.string().optional().nullable(),
    headId: z.string().optional().nullable(),
    orgId: z.string().min(1),
    createdBy: z.string().min(1),
});
const updateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    departmentType: z.enum(['department', 'division', 'unit', 'team']).optional(),
    parentDepartmentId: z.string().optional().nullable(),
    headId: z.string().optional().nullable(),
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
const defaultRepo = new DepartmentRepository();
export function departmentRoutes(service = new DepartmentService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'dept_manager'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const input = { ...parsed.data, createdBy: req.user.id };
        const dept = await service.create(input);
        await eventBus.publish({
            type: DepartmentEvents.Created,
            tenantId: dept.tenantId,
            entityType: 'Department',
            entityId: dept.id,
            actorId: req.user.id,
            payload: { actorName: req.user.name ?? req.user.id, department: dept },
        });
        return res.status(201).json(dept);
    });
    router.get('/:tenantId', async (req, res) => {
        const orgId = req.query.orgId;
        const status = req.query.status;
        const depts = await service.list(req.params.tenantId, orgId, status);
        return res.json(depts);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const dept = await service.get(req.params.tenantId, req.params.id);
        if (!dept)
            return res.status(404).json({ error: 'not_found' });
        return res.json(dept);
    });
    router.get('/:tenantId/:id/audit', async (req, res) => {
        const logs = await getDepartmentAuditLogs(req.params.tenantId, req.params.id);
        return res.json(logs);
    });
    /**
     * Department Twin (Roadmap Sprint 15). Real composition, same discipline
     * as Person Twin: no new scoring logic, reuses computeCapabilityHeatmap
     * and detectUnaddressedHighSeveritySignals verbatim, scoped to one
     * department instead of tenant-wide.
     */
    router.get('/:tenantId/:id/twin', async (req, res) => {
        const { tenantId, id } = req.params;
        const department = await service.get(tenantId, id);
        if (!department)
            return res.status(404).json({ error: 'not_found' });
        const [people, deptSignals, allAssignments, allProficiency, allDecisions, timeline] = await Promise.all([
            new PersonRepository().list(tenantId, undefined, undefined, id),
            new SignalRepository().list(tenantId, undefined, undefined, undefined, id),
            new CapabilityRepository().listAllAssignments(tenantId),
            new CapabilityProficiencyRepository().latestForAllAssignments(tenantId),
            new DecisionRepository().list(tenantId),
            new EventStoreRepository().findByEntity(tenantId, 'Department', id),
        ]);
        const peopleIds = new Set(people.map((p) => p.id));
        const heatmap = computeCapabilityHeatmap(allProficiency, allAssignments, people)
            .filter((cell) => cell.departmentId === id);
        const riskFindings = detectUnaddressedHighSeveritySignals(deptSignals, new Set());
        const deptDecisions = allDecisions.filter((d) => peopleIds.has(d.decidedBy));
        return res.json({
            department,
            personCount: people.length,
            capabilityHeatmap: heatmap,
            openRiskSignalCount: riskFindings.length,
            decisionCount: deptDecisions.length,
            decisionApprovalRate: deptDecisions.length ? Number((deptDecisions.filter((d) => d.status === 'approved').length / deptDecisions.length).toFixed(2)) : null,
            // Department Timeline (Capability Completion Program, Phase 1) — the
            // real gap found this audit: Person Twin has had a real timeline
            // since the Digital Twin sprint, Department Twin never got the same
            // treatment despite Department events already flowing to the same
            // event store. Same pattern, not new infrastructure.
            timeline: timeline.slice(-20).reverse().map((e) => ({ type: e.type, actorId: e.actorId, createdAt: e.createdAt })),
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
        const updated = await service.update(req.params.tenantId, req.params.id, parsed.data);
        if (!updated)
            return res.status(404).json({ error: 'not_found' });
        const changes = serializeChanges(existing, updated);
        await eventBus.publish({
            type: DepartmentEvents.Updated,
            tenantId: updated.tenantId,
            entityType: 'Department',
            entityId: updated.id,
            actorId: req.user.id,
            payload: { actorName: req.user.name ?? req.user.id, changes, department: updated },
        });
        return res.json(updated);
    });
    router.post('/:tenantId/:id/archive', async (req, res) => {
        const existing = await service.get(req.params.tenantId, req.params.id);
        if (!existing)
            return res.status(404).json({ error: 'not_found' });
        const archived = await service.archive(req.params.tenantId, req.params.id);
        if (!archived)
            return res.status(404).json({ error: 'not_found' });
        await eventBus.publish({
            type: DepartmentEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Department',
            entityId: archived.id,
            actorId: req.user.id,
            payload: { actorName: req.user.name ?? req.user.id, department: archived },
        });
        return res.json(archived);
    });
    return router;
}
export default departmentRoutes;

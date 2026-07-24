import { Router } from 'express';
import { z } from 'zod';
import { CapabilityService } from './capability.service.js';
import { CapabilityRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { eventBus, CapabilityEvents } from '@hpbrain/events';
import { getCapabilityAuditLogs } from '@hpbrain/events';
const kasbaSchema = z.object({
    description: z.string().optional(),
    level: z.number().optional(),
    weight: z.number().optional(),
    evidenceRequired: z.boolean().optional(),
    measurementMethod: z.string().optional(),
    targetLevel: z.number().optional(),
    currentLevel: z.number().optional(),
}).nullable().optional();
const createSchema = z.object({
    tenantId: z.string().min(1),
    orgId: z.string().min(1),
    capabilityCode: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().nullable(),
    category: z.string().max(100).optional(),
    capabilityType: z.string().max(50).optional(),
    difficulty: z.string().max(50).optional(),
    criticality: z.string().max(50).optional(),
    createdBy: z.string().min(1),
    knowledge: kasbaSchema,
    ability: kasbaSchema,
    skill: kasbaSchema,
    behaviour: kasbaSchema,
    attitude: kasbaSchema,
});
const updateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    category: z.string().max(100).optional(),
    capabilityType: z.string().max(50).optional(),
    difficulty: z.string().max(50).optional(),
    criticality: z.string().max(50).optional(),
    status: z.enum(['active', 'inactive', 'archived', 'draft']).optional(),
    knowledge: kasbaSchema,
    ability: kasbaSchema,
    skill: kasbaSchema,
    behaviour: kasbaSchema,
    attitude: kasbaSchema,
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
const defaultRepo = new CapabilityRepository();
export function capabilityRoutes(service = new CapabilityService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'capability_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const input = { ...parsed.data, createdBy: req.user.id };
        try {
            const capability = await service.create(input);
            await eventBus.publish({
                type: CapabilityEvents.Created,
                tenantId: capability.tenantId,
                entityType: 'Capability',
                entityId: capability.id,
                actorId: req.user.id,
                payload: { actorName: req.user.name ?? req.user.id, capability },
            });
            return res.status(201).json(capability);
        }
        catch (e) {
            return res.status(409).json({ error: e.message });
        }
    });
    router.get('/:tenantId', async (req, res) => {
        const orgId = req.query.orgId;
        const status = req.query.status;
        const category = req.query.category;
        const capabilities = await service.list(req.params.tenantId, orgId, status, category);
        return res.json(capabilities);
    });
    router.get('/:tenantId/search', async (req, res) => {
        const q = req.query.q;
        if (!q)
            return res.status(400).json({ error: 'missing_query' });
        const orgId = req.query.orgId;
        const capabilities = await service.search(req.params.tenantId, q, orgId);
        return res.json(capabilities);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const capability = await service.get(req.params.tenantId, req.params.id);
        if (!capability)
            return res.status(404).json({ error: 'not_found' });
        return res.json(capability);
    });
    router.get('/:tenantId/:id/audit', async (req, res) => {
        const logs = await getCapabilityAuditLogs(req.params.tenantId, req.params.id);
        return res.json(logs);
    });
    router.get('/:tenantId/:id/versions', async (req, res) => {
        const versions = await service.getVersions(req.params.tenantId, req.params.id);
        return res.json(versions);
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
                type: CapabilityEvents.Updated,
                tenantId: updated.tenantId,
                entityType: 'Capability',
                entityId: updated.id,
                actorId: req.user.id,
                payload: { actorName: req.user.name ?? req.user.id, changes, capability: updated },
            });
            return res.json(updated);
        }
        catch (e) {
            return res.status(409).json({ error: e.message });
        }
    });
    router.post('/:tenantId/:id/version', async (req, res) => {
        const capability = await service.createVersion(req.params.tenantId, req.params.id, req.user.id);
        if (!capability)
            return res.status(404).json({ error: 'not_found' });
        return res.json(capability);
    });
    router.post('/:tenantId/:id/archive', async (req, res) => {
        const existing = await service.get(req.params.tenantId, req.params.id);
        if (!existing)
            return res.status(404).json({ error: 'not_found' });
        const archived = await service.archive(req.params.tenantId, req.params.id);
        if (!archived)
            return res.status(404).json({ error: 'not_found' });
        await eventBus.publish({
            type: CapabilityEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Capability',
            entityId: archived.id,
            actorId: req.user.id,
            payload: { actorName: req.user.name ?? req.user.id, capability: archived },
        });
        return res.json(archived);
    });
    router.post('/:tenantId/:id/assign', async (req, res) => {
        const { targetType, targetId } = req.body;
        if (!targetType || !targetId)
            return res.status(400).json({ error: 'target_type_and_id_required' });
        const assignment = await service.assign(req.params.tenantId, req.params.id, targetType, targetId, req.user.id);
        return res.status(201).json(assignment);
    });
    router.delete('/:tenantId/:id/assign/:targetType/:targetId', async (req, res) => {
        await service.unassign(req.params.tenantId, req.params.id, req.params.targetType, req.params.targetId);
        return res.status(204).end();
    });
    router.get('/:tenantId/:id/assignments', async (req, res) => {
        const assignments = await service.getAssignments(req.params.tenantId, req.params.id);
        return res.json(assignments);
    });
    return router;
}
export default capabilityRoutes;

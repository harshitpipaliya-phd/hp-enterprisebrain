import { Router } from 'express';
import { z } from 'zod';
import { computeKasbaScore, computeCapabilityGap, computeCapabilityTrend } from './assessment-engine.js';
import { computeCapabilityHeatmap } from './capability-heatmap.js';
import { CapabilityTaskRepository, CapabilityProficiencyRepository, CapabilityRepository, PersonRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createTaskSchema = z.object({
    tenantId: z.string().min(1), capabilityId: z.string().min(1), parentTaskId: z.string().optional(),
    name: z.string().min(1), description: z.string().optional(), evidenceRequired: z.boolean().optional(),
});
const recordProficiencySchema = z.object({
    tenantId: z.string().min(1), assignmentId: z.string().min(1),
    knowledgeLevel: z.number().min(0).max(5).optional(), abilityLevel: z.number().min(0).max(5).optional(),
    skillLevel: z.number().min(0).max(5).optional(), behaviourLevel: z.number().min(0).max(5).optional(),
    attitudeLevel: z.number().min(0).max(5).optional(), evidenceConfidence: z.number().min(0).max(1).optional(),
});
const tasks = new CapabilityTaskRepository();
const proficiency = new CapabilityProficiencyRepository();
const capabilities = new CapabilityRepository();
export function kasbaRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/tasks', async (req, res) => {
        const parsed = createTaskSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const task = await tasks.create({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(task);
    });
    router.get('/tasks/:tenantId/capability/:capabilityId', async (req, res) => {
        return res.json(await tasks.listForCapability(req.params.tenantId, req.params.capabilityId));
    });
    router.post('/proficiency', async (req, res) => {
        const parsed = recordProficiencySchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const record = await proficiency.record({ ...parsed.data, assessedBy: req.user.id });
        return res.status(201).json(record);
    });
    router.get('/proficiency/:tenantId/assignment/:assignmentId/history', async (req, res) => {
        return res.json(await proficiency.historyForAssignment(req.params.tenantId, req.params.assignmentId));
    });
    /**
     * Capability Trend (Individual Intelligence Completion Program). New
     * endpoint, existing history endpoint left unchanged for backward
     * compatibility — this just computes a real trend over the same data
     * the history endpoint already returns raw.
     */
    router.get('/proficiency/:tenantId/assignment/:assignmentId/trend', async (req, res) => {
        const history = await proficiency.historyForAssignment(req.params.tenantId, req.params.assignmentId);
        return res.json(computeCapabilityTrend(history));
    });
    router.get('/assessment/:tenantId/assignment/:assignmentId/:capabilityId', async (req, res) => {
        const { tenantId, assignmentId, capabilityId } = req.params;
        const [latest, capability] = await Promise.all([
            proficiency.latestForAssignment(tenantId, assignmentId),
            capabilities.findById(tenantId, capabilityId),
        ]);
        if (!capability)
            return res.status(404).json({ error: 'capability_not_found' });
        const scores = computeKasbaScore(latest);
        const gaps = computeCapabilityGap(latest, capability);
        return res.json({ scores, gaps, assessedDate: latest?.assessedDate ?? null });
    });
    /**
     * Org-wide Capability Heatmap (Workforce Intelligence sprint). Real
     * aggregation only — deliberately does not include anything resembling
     * "Talent Intelligence" (retention risk, succession ranking); that was
     * declined outright, not built here in any form.
     */
    router.get('/heatmap/:tenantId', async (req, res) => {
        const tenantId = req.params.tenantId;
        const [proficiencyRecords, assignments, people] = await Promise.all([
            new CapabilityProficiencyRepository().latestForAllAssignments(tenantId),
            new CapabilityRepository().listAllAssignments(tenantId),
            new PersonRepository().list(tenantId),
        ]);
        return res.json(computeCapabilityHeatmap(proficiencyRecords, assignments, people));
    });
    return router;
}
export default kasbaRoutes;

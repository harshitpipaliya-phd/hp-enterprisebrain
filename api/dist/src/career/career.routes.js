import { Router } from 'express';
import { z } from 'zod';
import { CareerRepository, CapabilityProficiencyRepository } from '@hpbrain/database';
import { computeCareerReadiness } from './career-gap-analysis.js';
import { getLabourMarketProvider } from './labour-market-provider.js';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createClusterSchema = z.object({ tenantId: z.string().min(1), code: z.string().min(1), name: z.string().min(1), description: z.string().optional() });
const createOccupationSchema = z.object({ tenantId: z.string().min(1), clusterId: z.string().optional(), occupationCode: z.string().min(1), title: z.string().min(1), description: z.string().optional() });
const setRequirementSchema = z.object({ tenantId: z.string().min(1), occupationId: z.string().min(1), capabilityId: z.string().min(1), requiredLevel: z.number().min(0).max(5) });
const careers = new CareerRepository();
export function careerRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.get('/labour-market/status', async (_req, res) => {
        const provider = getLabourMarketProvider();
        return res.json({ provider: provider.name, available: provider.available });
    });
    router.post('/clusters', async (req, res) => {
        const parsed = createClusterSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const cluster = await careers.createCluster(parsed.data.tenantId, parsed.data.code, parsed.data.name, parsed.data.description, req.user.id);
        return res.status(201).json(cluster);
    });
    router.get('/clusters/:tenantId', async (req, res) => {
        return res.json(await careers.listClusters(req.params.tenantId));
    });
    router.post('/occupations', async (req, res) => {
        const parsed = createOccupationSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const occupation = await careers.createOccupation(parsed.data.tenantId, parsed.data.clusterId, parsed.data.occupationCode, parsed.data.title, parsed.data.description, req.user.id);
        return res.status(201).json(occupation);
    });
    router.get('/occupations/:tenantId', async (req, res) => {
        return res.json(await careers.listOccupations(req.params.tenantId, req.query.clusterId));
    });
    router.post('/requirements', async (req, res) => {
        const parsed = setRequirementSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        await careers.setRequirement(parsed.data.tenantId, parsed.data.occupationId, parsed.data.capabilityId, parsed.data.requiredLevel);
        return res.status(201).json({ set: true });
    });
    router.post('/:tenantId/readiness/:occupationId', async (req, res) => {
        const { tenantId, occupationId } = req.params;
        const assignmentIdByCapabilityId = req.body?.assignmentIdByCapabilityId;
        if (!assignmentIdByCapabilityId)
            return res.status(400).json({ error: 'assignmentIdByCapabilityId_required' });
        const requirements = await careers.getRequirements(tenantId, occupationId);
        const proficiencyRepo = new CapabilityProficiencyRepository();
        const proficiencyMap = new Map();
        for (const requirement of requirements) {
            const assignmentId = assignmentIdByCapabilityId[requirement.capabilityId];
            proficiencyMap.set(requirement.capabilityId, assignmentId ? await proficiencyRepo.latestForAssignment(tenantId, assignmentId) : null);
        }
        return res.json(computeCareerReadiness(requirements, proficiencyMap));
    });
    return router;
}
export default careerRoutes;

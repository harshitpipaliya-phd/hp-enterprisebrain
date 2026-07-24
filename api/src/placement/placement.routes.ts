import { Router, type Response } from 'express';
import { z } from 'zod';
import { PlacementRepository, CapabilityProficiencyRepository } from '@hpbrain/database';
import { computeCareerReadiness } from '../career/career-gap-analysis.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const createCompanySchema = z.object({ tenantId: z.string().min(1), name: z.string().min(1), industry: z.string().optional(), preferredSkills: z.array(z.string()).optional(), notes: z.string().optional() });
const createJobRoleSchema = z.object({ tenantId: z.string().min(1), companyId: z.string().min(1), title: z.string().min(1), description: z.string().optional(), minSalary: z.number().optional(), maxSalary: z.number().optional() });
const setRequirementSchema = z.object({ tenantId: z.string().min(1), jobRoleId: z.string().min(1), capabilityId: z.string().min(1), requiredLevel: z.number().min(0).max(5) });

const repo = new PlacementRepository();

export function placementRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/companies', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const company = await repo.createCompany(parsed.data.tenantId, parsed.data.name, parsed.data.industry, parsed.data.preferredSkills, parsed.data.notes, req.user!.id);
    return res.status(201).json(company);
  });

  router.get('/companies/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await repo.listCompanies(req.params.tenantId));
  });

  router.post('/job-roles', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createJobRoleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const jobRole = await repo.createJobRole(parsed.data.tenantId, parsed.data.companyId, parsed.data.title, parsed.data.description, parsed.data.minSalary, parsed.data.maxSalary, req.user!.id);
    return res.status(201).json(jobRole);
  });

  router.get('/job-roles/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await repo.listJobRoles(req.params.tenantId, req.query.companyId as string | undefined));
  });

  router.post('/requirements', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = setRequirementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    await repo.setRequirement(parsed.data.tenantId, parsed.data.jobRoleId, parsed.data.capabilityId, parsed.data.requiredLevel);
    return res.status(201).json({ set: true });
  });

  /**
   * Matching Engine (Part 5) — not a new algorithm. job_role requirements
   * share the identical shape as occupation requirements (Career
   * Intelligence sprint), so this calls the exact same
   * computeCareerReadiness function.
   */
  router.post('/:tenantId/match/:jobRoleId', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, jobRoleId } = req.params;
    const assignmentIdByCapabilityId = req.body?.assignmentIdByCapabilityId as Record<string, string> | undefined;
    if (!assignmentIdByCapabilityId) return res.status(400).json({ error: 'assignmentIdByCapabilityId_required' });

    const requirements = await repo.getRequirements(tenantId, jobRoleId);
    const proficiencyRepo = new CapabilityProficiencyRepository();
    const proficiencyMap = new Map();
    for (const requirement of requirements) {
      const assignmentId = assignmentIdByCapabilityId[requirement.capabilityId];
      proficiencyMap.set(requirement.capabilityId, assignmentId ? await proficiencyRepo.latestForAssignment(tenantId, assignmentId) : null);
    }
    const readiness = computeCareerReadiness(requirements.map((r) => ({ occupationId: r.jobRoleId, capabilityId: r.capabilityId, requiredLevel: r.requiredLevel })), proficiencyMap);
    return res.json(readiness);
  });

  return router;
}

export default placementRoutes;

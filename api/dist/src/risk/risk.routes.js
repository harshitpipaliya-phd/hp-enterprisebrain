import { Router } from 'express';
import { z } from 'zod';
import { RiskService } from './risk.service.js';
import { RiskRepository, RISK_CATEGORIES, RISK_IMPACTS, DecisionRepository, EsoExecutionRepository, OutcomeRepository, ReasoningStepRepository, RecommendationRepository, SignalRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const assessSchema = z.object({
    tenantId: z.string().min(1),
    decisionId: z.string().min(1).optional(),
    recommendationId: z.string().min(1).optional(),
    category: z.enum(RISK_CATEGORIES),
    probability: z.number().min(0).max(1),
    impact: z.enum(RISK_IMPACTS),
    mitigation: z.string().optional(),
});
const mitigateSchema = z.object({ mitigation: z.string().min(1) });
const defaultRepo = new RiskRepository();
export function riskRoutes(service = new RiskService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = assessSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const risk = await service.assess({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(risk);
    });
    router.get('/:tenantId', async (req, res) => {
        return res.json(await service.list(req.params.tenantId, req.query.status));
    });
    router.get('/:tenantId/decision/:decisionId', async (req, res) => {
        return res.json(await service.forDecision(req.params.tenantId, req.params.decisionId));
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const risk = await service.get(req.params.tenantId, req.params.id);
        if (!risk)
            return res.status(404).json({ error: 'not_found' });
        return res.json(risk);
    });
    router.post('/:tenantId/:id/mitigate', async (req, res) => {
        const parsed = mitigateSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            const risk = await service.mitigate(req.params.tenantId, req.params.id, parsed.data.mitigation, req.user.id);
            return res.json(risk);
        }
        catch (e) {
            if (e.message === 'risk_not_found')
                return res.status(404).json({ error: 'not_found' });
            throw e;
        }
    });
    /**
     * Intervention Center (School Intelligence sprint, Part 6). Not new
     * schema — Risk has carried decisionId since Sprint 4. This is the
     * missing aggregation: a Risk with a linked Decision is an "assigned
     * intervention"; walking to that Decision's Execution and Outcome is
     * "tracking progress" and "measuring success" — both already tracked.
     * "Update Organizational Memory" already happens automatically (Outcome
     * -> Learning -> Mental Model reinforcement, Sprint 2/5) — nothing here
     * duplicates that, it's just made visible as one chain instead of four
     * separate lookups.
     */
    router.get('/:tenantId/interventions', async (req, res) => {
        const tenantId = req.params.tenantId;
        const allRisks = await new RiskRepository().list(tenantId);
        const withIntervention = allRisks.filter((r) => r.decisionId);
        const allExecutions = await new EsoExecutionRepository().list(tenantId);
        const interventions = await Promise.all(withIntervention.map(async (risk) => {
            const decision = risk.decisionId ? await new DecisionRepository().findById(tenantId, risk.decisionId) : null;
            const executions = risk.decisionId ? allExecutions.filter((e) => e.decisionId === risk.decisionId) : [];
            const outcomes = risk.decisionId ? await new OutcomeRepository().findByDecision(tenantId, risk.decisionId) : [];
            return {
                riskId: risk.id, category: risk.category, score: risk.score, riskStatus: risk.status, mitigation: risk.mitigation,
                decision: decision ? { id: decision.id, rationale: decision.rationale, status: decision.status } : null,
                executionCount: executions.length,
                latestOutcome: outcomes[0] ? { result: outcomes[0].result, confidence: outcomes[0].confidence } : null,
            };
        }));
        return res.json({ interventions, count: interventions.length });
    });
    /**
     * Person-scoped Intervention History (Individual Intelligence Completion
     * Program, Milestone 1's "Teacher Intervention History"). Not a new
     * engine — the exact same real chain as the tenant-wide Intervention
     * Center above, filtered to one person by tracing
     * Risk -> Recommendation -> ReasoningStep -> Signal.relatedEntityId.
     * Serves Teacher, Student, and Employee Intervention History identically,
     * per this program's own "one engine" working principle — no duplicated
     * logic per role.
     */
    router.get('/:tenantId/interventions/person/:personId', async (req, res) => {
        const { tenantId, personId } = req.params;
        const allRisks = await new RiskRepository().list(tenantId);
        const reasoningSteps = new ReasoningStepRepository();
        const recommendations = new RecommendationRepository();
        const signals = new SignalRepository();
        const scoped = await Promise.all(allRisks.map(async (risk) => {
            if (!risk.decisionId || !risk.recommendationId)
                return null;
            const rec = await recommendations.findById(tenantId, risk.recommendationId);
            if (!rec?.reasoningStepId)
                return null;
            const step = await reasoningSteps.findById(tenantId, rec.reasoningStepId);
            if (!step?.signalId)
                return null;
            const signal = await signals.findById(tenantId, step.signalId);
            if (signal?.relatedEntityType !== 'Person' || signal?.relatedEntityId !== personId)
                return null;
            return risk;
        }));
        const personRisks = scoped.filter((r) => r !== null);
        const allExecutions = await new EsoExecutionRepository().list(tenantId);
        const interventions = await Promise.all(personRisks.map(async (risk) => {
            const decision = risk.decisionId ? await new DecisionRepository().findById(tenantId, risk.decisionId) : null;
            const executions = risk.decisionId ? allExecutions.filter((e) => e.decisionId === risk.decisionId) : [];
            const outcomes = risk.decisionId ? await new OutcomeRepository().findByDecision(tenantId, risk.decisionId) : [];
            return {
                riskId: risk.id, category: risk.category, score: risk.score, riskStatus: risk.status, mitigation: risk.mitigation,
                decision: decision ? { id: decision.id, rationale: decision.rationale, status: decision.status } : null,
                executionCount: executions.length,
                latestOutcome: outcomes[0] ? { result: outcomes[0].result, confidence: outcomes[0].confidence } : null,
            };
        }));
        return res.json({ personId, interventions, count: interventions.length });
    });
    return router;
}
export default riskRoutes;

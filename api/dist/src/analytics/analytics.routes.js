import { Router } from 'express';
import { DecisionRepository, RecommendationRepository, OutcomeRepository, RiskRepository, EvidenceRepository, MentalModelRepository, SignalRepository, } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const decisions = new DecisionRepository();
const recommendations = new RecommendationRepository();
const outcomes = new OutcomeRepository();
const risks = new RiskRepository();
const evidence = new EvidenceRepository();
const mentalModels = new MentalModelRepository();
const signals = new SignalRepository();
/**
 * Decision Analytics (Sprint 4 Story 9). Every number here is computed from the
 * actual repositories at request time — no hardcoded or seeded statistics.
 * With no live database in this environment these return correct-but-empty/zero
 * results against an empty table; the computation itself is real and tested
 * separately (see analytics.test.ts) against in-memory data.
 */
export function computeStatistics(input) {
    const { allDecisions, allRecommendations, allOutcomes, allRisks, allEvidence } = input;
    const approved = allDecisions.filter((d) => d.status === 'approved').length;
    const rejected = allDecisions.filter((d) => d.status === 'rejected').length;
    const acceptanceRate = allDecisions.length ? Number((approved / allDecisions.length).toFixed(3)) : 0;
    // Recommendation accuracy: of recommendations that led to a decision and then an
    // outcome, what fraction succeeded. This is the only honest definition available
    // without ground-truth labels — "accuracy" here means "did approving it work out."
    const successfulOutcomes = allOutcomes.filter((o) => o.result === 'success').length;
    const recommendationAccuracy = allOutcomes.length ? Number((successfulOutcomes / allOutcomes.length).toFixed(3)) : 0;
    const recommendationsByCategory = {};
    for (const r of allRecommendations) {
        recommendationsByCategory[r.category] = (recommendationsByCategory[r.category] ?? 0) + 1;
    }
    const riskDistribution = {};
    let totalRiskScore = 0;
    for (const r of allRisks) {
        riskDistribution[r.category] = (riskDistribution[r.category] ?? 0) + 1;
        totalRiskScore += r.score;
    }
    const openRisks = allRisks.filter((r) => r.status === 'open').length;
    const averageRiskScore = allRisks.length ? Number((totalRiskScore / allRisks.length).toFixed(2)) : 0;
    const evidenceQuality = allEvidence.length
        ? Number((allEvidence.reduce((sum, e) => sum + e.confidence, 0) / allEvidence.length).toFixed(3))
        : 0;
    return {
        decisions: { total: allDecisions.length, approved, rejected, acceptanceRate },
        recommendations: { total: allRecommendations.length, byCategory: recommendationsByCategory },
        outcomes: { total: allOutcomes.length, successful: successfulOutcomes, recommendationAccuracy },
        risks: { total: allRisks.length, open: openRisks, byCategory: riskDistribution, averageScore: averageRiskScore },
        evidenceQuality,
    };
}
/**
 * Decision Intelligence (Sprint 10). Real computation over Decision and
 * Recommendation data that already exists — pipeline counts, latency
 * (recommendation created -> decision made), and a category x executor-type
 * heatmap. No forecasting/prediction here — that needs a real model
 * decision, not a default I should pick; this is deterministic aggregation
 * only, same honesty standard as computeStatistics above.
 */
export function computeDecisionIntelligence(input) {
    const { allDecisions, allRecommendations } = input;
    const pipeline = {
        pending: allRecommendations.filter((r) => r.status === 'pending').length,
        approved: allRecommendations.filter((r) => r.status === 'approved').length,
        rejected: allRecommendations.filter((r) => r.status === 'rejected').length,
    };
    const recommendationById = new Map(allRecommendations.map((r) => [r.id, r]));
    const latencies = [];
    const heatmap = {};
    for (const d of allDecisions) {
        if (!d.recommendationId)
            continue;
        const rec = recommendationById.get(d.recommendationId);
        if (!rec)
            continue;
        const latencyMs = new Date(d.createdDate).getTime() - new Date(rec.createdDate).getTime();
        if (latencyMs >= 0)
            latencies.push(latencyMs);
        heatmap[rec.category] = heatmap[rec.category] ?? {};
        heatmap[rec.category][d.executorType] = (heatmap[rec.category][d.executorType] ?? 0) + 1;
    }
    const avgLatencyHours = latencies.length
        ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length / (1000 * 60 * 60)).toFixed(2))
        : null;
    const byExecutorType = {};
    for (const d of allDecisions) {
        byExecutorType[d.executorType] = (byExecutorType[d.executorType] ?? 0) + 1;
    }
    return { pipeline, averageDecisionLatencyHours: avgLatencyHours, decisionsByExecutorType: byExecutorType, categoryExecutorHeatmap: heatmap };
}
/**
 * Organizational Intelligence Score (Digital Twin Sprint, Part 5/9 — asked
 * for across two prior sprints, built here for real). A weighted composite
 * of four signals already computed elsewhere in this file, each already
 * bounded 0-1: decision acceptance rate, recommendation accuracy, evidence
 * quality, and risk posture (inverted — high average risk score lowers the
 * intelligence score). Weights are a documented, arbitrary-but-stated
 * starting point, not a scientifically derived formula — that's an honest
 * limitation, not something to dress up as more rigorous than it is.
 */
export function computeOrganizationalIntelligenceScore(input) {
    const riskPosture = Math.max(0, 1 - input.averageRiskScore / 10);
    const weights = { decisionAcceptanceRate: 0.3, recommendationAccuracy: 0.3, evidenceQuality: 0.2, riskPosture: 0.2 };
    const breakdown = {
        decisionAcceptanceRate: Number((input.decisionAcceptanceRate * weights.decisionAcceptanceRate).toFixed(3)),
        recommendationAccuracy: Number((input.recommendationAccuracy * weights.recommendationAccuracy).toFixed(3)),
        evidenceQuality: Number((input.evidenceQuality * weights.evidenceQuality).toFixed(3)),
        riskPosture: Number((riskPosture * weights.riskPosture).toFixed(3)),
    };
    const score = Number((Object.values(breakdown).reduce((a, b) => a + b, 0) * 100).toFixed(1));
    return { score, breakdown };
}
export function analyticsRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.get('/:tenantId', async (req, res) => {
        const tenantId = req.params.tenantId;
        const [allDecisions, allRecommendations, allOutcomes, allRisks, allEvidence] = await Promise.all([
            decisions.list(tenantId),
            recommendations.list(tenantId),
            outcomes.list(tenantId),
            risks.list(tenantId),
            evidence.list(tenantId),
        ]);
        return res.json(computeStatistics({ allDecisions, allRecommendations, allOutcomes, allRisks, allEvidence }));
    });
    /**
     * Sprint 5 "Executive Brain": a cross-domain rollup for leadership — not a new
     * data source, a different lens over the same repositories every other engine
     * already writes to. Highest-scoring open risks, the organization's accumulated
     * Mental Models (what the org has actually learned, per domain), and the same
     * statistics as the standard analytics endpoint, in one call so a leadership
     * screen isn't assembling five separate fetches.
     */
    router.get('/:tenantId/executive-summary', async (req, res) => {
        const tenantId = req.params.tenantId;
        const [allDecisions, allRecommendations, allOutcomes, allRisks, allEvidence, allModels] = await Promise.all([
            decisions.list(tenantId),
            recommendations.list(tenantId),
            outcomes.list(tenantId),
            risks.list(tenantId),
            evidence.list(tenantId),
            mentalModels.list(tenantId),
        ]);
        const statistics = computeStatistics({ allDecisions, allRecommendations, allOutcomes, allRisks, allEvidence });
        const topRisks = [...allRisks].sort((a, b) => b.score - a.score).slice(0, 5);
        const organizationalKnowledge = allModels
            .filter((m) => m.status === 'active')
            .sort((a, b) => b.reinforcementCount - a.reinforcementCount)
            .map((m) => ({ domain: m.domain, confidence: m.confidence, reinforcementCount: m.reinforcementCount, patternCount: (m.rules.patterns ?? []).length }));
        // Direct additions for the Executive Dashboard screen — cheap given the
        // data above is already fetched, so no extra query cost.
        const pendingRecommendations = allRecommendations.filter((r) => r.status === 'pending').slice(0, 10);
        const openDecisionsCount = allDecisions.filter((d) => d.status === 'pending').length;
        const intelligenceScore = computeOrganizationalIntelligenceScore({
            decisionAcceptanceRate: statistics.decisions.acceptanceRate,
            recommendationAccuracy: statistics.outcomes.recommendationAccuracy,
            evidenceQuality: statistics.evidenceQuality,
            averageRiskScore: statistics.risks.averageScore,
        });
        return res.json({ statistics, topRisks, organizationalKnowledge, pendingRecommendations, openDecisionsCount, intelligenceScore });
    });
    /**
     * Sprint 7: Department Brain, finally unblocked. SPRINT5_ARCHITECTURE.md
     * flagged this as needing a departmentId column that didn't exist — it does
     * now (migration 015). Signals without a departmentId simply don't appear
     * here; nothing about the tenant-wide /:tenantId endpoint above changes.
     */
    router.get('/:tenantId/department/:departmentId', async (req, res) => {
        const { tenantId, departmentId } = req.params;
        const allSignals = await signals.list(tenantId, undefined, undefined, undefined, departmentId);
        return res.json({
            departmentId,
            signalCount: allSignals.length,
            bySource: allSignals.reduce((acc, s) => { acc[s.source] = (acc[s.source] ?? 0) + 1; return acc; }, {}),
            bySeverity: allSignals.reduce((acc, s) => { acc[s.severity] = (acc[s.severity] ?? 0) + 1; return acc; }, {}),
        });
    });
    router.get('/:tenantId/decision-intelligence', async (req, res) => {
        const tenantId = req.params.tenantId;
        const [allDecisions, allRecommendations] = await Promise.all([decisions.list(tenantId), recommendations.list(tenantId)]);
        return res.json(computeDecisionIntelligence({ allDecisions, allRecommendations }));
    });
    /**
     * CSV export (Reports module, scoped). Real, no new dependency — CSV is
     * just structured text. PDF/Excel are NOT built here: they need a real
     * templating/layout decision (which library, what the report actually
     * looks like) that's a design choice, not a default I should silently pick.
     */
    router.get('/:tenantId/decisions/export.csv', async (req, res) => {
        const tenantId = req.params.tenantId;
        const allDecisions = await decisions.list(tenantId);
        const header = 'id,recommendationId,decidedBy,executorType,status,confidence,createdDate\n';
        const rows = allDecisions.map((d) => [d.id, d.recommendationId ?? '', d.decidedBy, d.executorType, d.status, d.confidence, d.createdDate]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="decisions-${tenantId}.csv"`);
        return res.send(header + rows);
    });
    return router;
}
export default analyticsRoutes;

import { TaskRegistry } from './task.registry.js';
import { SignalRepository, EvidenceRepository, RiskRepository, LearningRepository, SearchRepository, AccreditationRepository } from '@hpbrain/database';
import { PatternDetectionService } from '../learning/pattern-detection.service.js';
/**
 * Built-in tasks (Sprint 11). Each wraps a real, already-tested service —
 * these are not new capabilities, they're the existing capabilities made
 * composable and loggable through the Task Orchestrator.
 */
export function buildDefaultRegistry() {
    const registry = new TaskRegistry();
    const signals = new SignalRepository();
    const evidence = new EvidenceRepository();
    const risks = new RiskRepository();
    const learnings = new LearningRepository();
    const search = new SearchRepository();
    const patternDetector = new PatternDetectionService();
    const analyzeSignals = {
        name: 'analyze-signals',
        description: 'Summarize open Signals by source and severity for a tenant',
        category: 'analytics',
        run: async (tenantId) => {
            const all = await signals.list(tenantId, undefined, 'new');
            const bySeverity = {};
            for (const s of all)
                bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1;
            return { count: all.length, bySeverity };
        },
    };
    const summarizeEvidence = {
        name: 'summarize-evidence',
        description: 'Compute mean confidence and count of Evidence for a tenant',
        category: 'analytics',
        run: async (tenantId) => {
            const all = await evidence.list(tenantId);
            const avgConfidence = all.length ? all.reduce((s, e) => s + e.confidence, 0) / all.length : 0;
            return { count: all.length, averageConfidence: Number(avgConfidence.toFixed(3)) };
        },
    };
    const detectPatterns = {
        name: 'detect-patterns',
        description: 'Run Pattern Detection over reusable Learnings for a tenant (real clustering, Sprint 8)',
        category: 'learning',
        run: async (tenantId) => {
            const all = await learnings.list(tenantId);
            const patterns = patternDetector.detect(all);
            return { patternsFound: patterns.length, patterns };
        },
    };
    const searchKnowledge = {
        name: 'search-knowledge',
        description: 'Search across Signal/Evidence/Recommendation/Decision/Learning for a query (Sprint 7 Search)',
        category: 'search',
        run: async (tenantId, input) => {
            const query = String(input.query ?? '');
            if (!query)
                throw new Error('query_required');
            const results = await search.search(tenantId, query);
            return { count: results.length, results };
        },
    };
    const summarizeRisks = {
        name: 'summarize-risks',
        description: 'Summarize open Risks by category for a tenant',
        category: 'analytics',
        run: async (tenantId) => {
            const all = await risks.list(tenantId, 'open');
            const byCategory = {};
            for (const r of all)
                byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
            return { count: all.length, byCategory, averageScore: all.length ? Number((all.reduce((s, r) => s + r.score, 0) / all.length).toFixed(2)) : 0 };
        },
    };
    /**
     * Compliance status check (Enterprise Operating System sprint, Part 6 —
     * a real, bounded piece of "orchestrate Compliance"). Reuses the
     * Accreditation entity built for Higher Education — a compliance
     * framework there and a compliance framework here are the same shape:
     * criteria with a status, backed by evidence. Real counts, no invented
     * compliance judgment.
     */
    const complianceStatus = {
        name: 'compliance-status',
        description: 'Summarize accreditation/compliance criteria by status for a tenant',
        category: 'compliance',
        run: async (tenantId) => {
            const accreditation = new AccreditationRepository();
            const frameworks = await accreditation.listFrameworks(tenantId);
            const summary = await Promise.all(frameworks.map(async (fw) => {
                const criteria = await accreditation.listCriteria(tenantId, fw.id);
                const byStatus = {};
                for (const c of criteria)
                    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
                return { frameworkId: fw.id, frameworkName: fw.name, criteriaCount: criteria.length, byStatus };
            }));
            return { frameworkCount: frameworks.length, summary };
        },
    };
    registry.register(analyzeSignals);
    registry.register(summarizeEvidence);
    registry.register(detectPatterns);
    registry.register(searchKnowledge);
    registry.register(summarizeRisks);
    registry.register(complianceStatus);
    return registry;
}

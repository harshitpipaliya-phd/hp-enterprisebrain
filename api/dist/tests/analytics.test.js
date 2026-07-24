import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStatistics } from '../src/analytics/analytics.routes.js';
test('computeStatistics: acceptance rate reflects approved vs total decisions', () => {
    const stats = computeStatistics({
        allDecisions: [{ status: 'approved' }, { status: 'approved' }, { status: 'rejected' }, { status: 'approved' }],
        allRecommendations: [],
        allOutcomes: [],
        allRisks: [],
        allEvidence: [],
    });
    assert.equal(stats.decisions.total, 4);
    assert.equal(stats.decisions.approved, 3);
    assert.equal(stats.decisions.rejected, 1);
    assert.equal(stats.decisions.acceptanceRate, 0.75);
});
test('computeStatistics: recommendation accuracy reflects successful vs total outcomes', () => {
    const stats = computeStatistics({
        allDecisions: [],
        allRecommendations: [],
        allOutcomes: [{ result: 'success', confidence: 0.8 }, { result: 'failure', confidence: 0.5 }, { result: 'success', confidence: 0.9 }],
        allRisks: [],
        allEvidence: [],
    });
    assert.equal(stats.outcomes.recommendationAccuracy, 0.667);
});
test('computeStatistics: risk distribution groups by category and computes average score', () => {
    const stats = computeStatistics({
        allDecisions: [],
        allRecommendations: [],
        allOutcomes: [],
        allRisks: [
            { category: 'compliance', score: 5, status: 'open' },
            { category: 'compliance', score: 3, status: 'mitigated' },
            { category: 'financial', score: 2, status: 'open' },
        ],
        allEvidence: [],
    });
    assert.equal(stats.risks.byCategory.compliance, 2);
    assert.equal(stats.risks.byCategory.financial, 1);
    assert.equal(stats.risks.open, 2);
    assert.equal(stats.risks.averageScore, Number(((5 + 3 + 2) / 3).toFixed(2)));
});
test('computeStatistics: evidence quality is the mean confidence across evidence', () => {
    const stats = computeStatistics({
        allDecisions: [], allRecommendations: [], allOutcomes: [], allRisks: [],
        allEvidence: [{ confidence: 0.9 }, { confidence: 0.5 }, { confidence: 0.7 }],
    });
    assert.equal(stats.evidenceQuality, 0.7);
});
test('computeStatistics: handles empty data without division by zero', () => {
    const stats = computeStatistics({ allDecisions: [], allRecommendations: [], allOutcomes: [], allRisks: [], allEvidence: [] });
    assert.equal(stats.decisions.acceptanceRate, 0);
    assert.equal(stats.outcomes.recommendationAccuracy, 0);
    assert.equal(stats.risks.averageScore, 0);
    assert.equal(stats.evidenceQuality, 0);
});

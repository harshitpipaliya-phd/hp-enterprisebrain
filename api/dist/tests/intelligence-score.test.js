import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOrganizationalIntelligenceScore } from '../src/analytics/analytics.routes.js';
test('computeOrganizationalIntelligenceScore returns 0 for an org with zero signal on every dimension', () => {
    const result = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 0, recommendationAccuracy: 0, evidenceQuality: 0, averageRiskScore: 10 });
    assert.equal(result.score, 0);
});
test('computeOrganizationalIntelligenceScore returns 100 for a perfect org', () => {
    const result = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 1, recommendationAccuracy: 1, evidenceQuality: 1, averageRiskScore: 0 });
    assert.equal(result.score, 100);
});
test('computeOrganizationalIntelligenceScore weights decision acceptance at 30%', () => {
    const result = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 1, recommendationAccuracy: 0, evidenceQuality: 0, averageRiskScore: 10 });
    assert.equal(result.breakdown.decisionAcceptanceRate, 0.3);
});
test('computeOrganizationalIntelligenceScore inverts risk score — high average risk lowers the score', () => {
    const lowRisk = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 0.5, recommendationAccuracy: 0.5, evidenceQuality: 0.5, averageRiskScore: 1 });
    const highRisk = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 0.5, recommendationAccuracy: 0.5, evidenceQuality: 0.5, averageRiskScore: 9 });
    assert.ok(lowRisk.score > highRisk.score);
});
test('computeOrganizationalIntelligenceScore never goes negative even if averageRiskScore exceeds the expected scale', () => {
    const result = computeOrganizationalIntelligenceScore({ decisionAcceptanceRate: 0, recommendationAccuracy: 0, evidenceQuality: 0, averageRiskScore: 999 });
    assert.ok(result.score >= 0);
    assert.ok(result.breakdown.riskPosture >= 0);
});

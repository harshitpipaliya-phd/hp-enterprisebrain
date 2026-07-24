/**
 * KASBA Assessment Engine (Sprint 15, scoped). Computes real scores from
 * real assessment data — a CapabilityProficiency record and the
 * Capability's own stated target levels (KasbaElement.targetLevel, since
 * Sprint 1). No invented proficiency numbers: an unassessed dimension is
 * null, not defaulted to 0 or 100.
 */
export function computeKasbaScore(latest) {
    if (!latest)
        return { knowledge: null, ability: null, skill: null, behaviour: null, attitude: null, overall: null };
    const dims = [latest.knowledgeLevel, latest.abilityLevel, latest.skillLevel, latest.behaviourLevel, latest.attitudeLevel];
    const assessed = dims.filter((d) => d != null);
    const overall = assessed.length > 0 ? Number((assessed.reduce((a, b) => a + b, 0) / assessed.length).toFixed(2)) : null;
    return {
        knowledge: latest.knowledgeLevel, ability: latest.abilityLevel, skill: latest.skillLevel,
        behaviour: latest.behaviourLevel, attitude: latest.attitudeLevel, overall,
    };
}
/**
 * Gap analysis: compares actual assessed levels against the Capability's
 * own stated target for each KASBA dimension. A dimension with no target
 * is skipped, not treated as a zero-gap.
 */
export function computeCapabilityGap(latest, targets) {
    const findings = [];
    const dims = [
        ['knowledge', latest?.knowledgeLevel, targets.knowledge?.targetLevel],
        ['ability', latest?.abilityLevel, targets.ability?.targetLevel],
        ['skill', latest?.skillLevel, targets.skill?.targetLevel],
        ['behaviour', latest?.behaviourLevel, targets.behaviour?.targetLevel],
        ['attitude', latest?.attitudeLevel, targets.attitude?.targetLevel],
    ];
    for (const [dimension, current, target] of dims) {
        if (target == null)
            continue;
        const currentLevel = current ?? 0;
        const gap = Number((target - currentLevel).toFixed(2));
        if (gap > 0)
            findings.push({ dimension, currentLevel: current ?? null, targetLevel: target, gap });
    }
    return findings.sort((a, b) => b.gap - a.gap);
}
/**
 * Capability Trend (Individual Intelligence Completion Program — "Teacher
 * Analytics" / "Student Learning Journey"). The history endpoint already
 * existed and already returned real data — this was never a missing API,
 * only a missing computation over data that was already there.
 */
export function computeCapabilityTrend(history) {
    const scores = history
        .map((record) => {
        const dims = [record.knowledgeLevel, record.abilityLevel, record.skillLevel, record.behaviourLevel, record.attitudeLevel].filter((d) => d != null);
        return dims.length > 0 ? dims.reduce((a, b) => a + b, 0) / dims.length : null;
    })
        .filter((s) => s != null);
    if (scores.length < 2) {
        return { assessmentCount: history.length, firstOverall: scores[0] ?? null, latestOverall: scores[0] ?? null, direction: 'insufficient_data', delta: null };
    }
    const first = scores[0];
    const latest = scores[scores.length - 1];
    const delta = Number((latest - first).toFixed(2));
    const direction = delta > 0.1 ? 'improving' : delta < -0.1 ? 'declining' : 'stable';
    return { assessmentCount: history.length, firstOverall: Number(first.toFixed(2)), latestOverall: Number(latest.toFixed(2)), direction, delta };
}
/**
 * Individual Intelligence Score (Master Implementation Prompt, Step 5 —
 * "Health Score, Growth Score, Confidence Score"). Same honest discipline
 * as computeOrganizationalIntelligenceScore: a documented, stated-arbitrary
 * weighting, not a scientifically derived formula — and each input is
 * null, not defaulted to 0, when there's genuinely no data yet. A
 * brand-new employee with zero decisions and zero executions gets an
 * honest "insufficient data" score, not a fabricated low number.
 */
export function computeIndividualScore(input) {
    const capabilityScore = input.capabilityOveralls.length > 0
        ? Number(((input.capabilityOveralls.reduce((a, b) => a + b, 0) / input.capabilityOveralls.length) / 5).toFixed(3))
        : null;
    const parts = [capabilityScore, input.decisionApprovalRate, input.executionSuccessRate].filter((p) => p != null);
    const score = parts.length > 0 ? Number(((parts.reduce((a, b) => a + b, 0) / parts.length) * 100).toFixed(1)) : null;
    return {
        score,
        breakdown: { capabilityScore, decisionQuality: input.decisionApprovalRate, executionSuccess: input.executionSuccessRate },
    };
}

/**
 * ESO Execution Evaluation (ESO Engine sprint, scoped). Distinct from the
 * KASBA Assessment Engine (Sprint 15) — that scores a PERSON's proficiency
 * over time; this scores ONE execution's outcome quality. Real,
 * deterministic, no invented "Behaviour Score" or "Skill Score" per
 * execution — this codebase has no per-execution behavioural observation
 * data, and fabricating one would be worse than not having it.
 */
export function evaluateExecution(execution, linkedEvidence) {
    const completionScore = execution.status === 'completed' ? 1 : execution.status === 'failed' ? 0 : execution.status === 'rolled_back' ? 0.3 : 0.5;
    const evidenceScore = linkedEvidence.length > 0
        ? Number((linkedEvidence.reduce((sum, e) => sum + e.confidence, 0) / linkedEvidence.length).toFixed(3))
        : null;
    const overallScore = evidenceScore != null ? Number(((completionScore + evidenceScore) / 2).toFixed(3)) : null;
    return { completionScore, evidenceScore, overallScore, evidenceCount: linkedEvidence.length };
}

const DEFAULT_POLICY = {
    allowedExecutorClasses: ['human', 'ai_agent', 'software', 'hybrid'],
    trustLevels: { ai_agent: 0.85, hybrid: 0.6, software: 0.5, human: 0 },
};
/**
 * Executor Resolver (Sprint 2 Story 6 + Sprint 3 Story 5).
 *
 * Two layers:
 * 1. resolve() — which executor *class* (human/ai_agent/software/hybrid) is
 *    trusted for this recommendation, given confidence + policy. Sprint 2.
 * 2. matchExecutor() — within that class, which *specific* registered executor
 *    has the required capability, is available, and has workload headroom —
 *    ranked by trust level then lowest current workload. Sprint 3: this is the
 *    piece that was previously flagged as not implemented because no Executor
 *    directory existed. It exists now (database/src/executor.repository.ts).
 */
export class ExecutorResolverService {
    directory;
    constructor(directory) {
        this.directory = directory;
    }
    resolve(recommendation, policy = DEFAULT_POLICY) {
        const alternatives = [];
        const candidates = ['ai_agent', 'hybrid', 'software', 'human'];
        // Opportunity/strategy recommendations always require human judgment, regardless
        // of confidence — matches the sales-territory principle: "the Brain proposes,
        // the manager decides."
        if (recommendation.category === 'opportunity') {
            for (const c of candidates.filter((c) => c !== 'human')) {
                alternatives.push({ executorType: c, rejectedBecause: 'opportunity/strategy recommendations require human decision authority' });
            }
            return {
                executorType: 'human',
                rationale: 'Opportunity/strategy category always routes to human — the system proposes, it does not decide strategic direction.',
                alternativesConsidered: alternatives,
            };
        }
        for (const candidate of candidates) {
            if (!policy.allowedExecutorClasses.includes(candidate)) {
                alternatives.push({ executorType: candidate, rejectedBecause: 'not in allowed executor classes for this policy' });
                continue;
            }
            const threshold = policy.trustLevels[candidate] ?? 1;
            if (recommendation.confidence < threshold) {
                alternatives.push({ executorType: candidate, rejectedBecause: `confidence ${recommendation.confidence} below trust threshold ${threshold}` });
                continue;
            }
            return {
                executorType: candidate,
                rationale: `Confidence ${recommendation.confidence} meets the ${threshold} trust threshold for ${candidate} under this policy.`,
                alternativesConsidered: alternatives,
            };
        }
        // Fell through — nothing met threshold, fall back to human oversight.
        return {
            executorType: 'human',
            rationale: 'No executor class met its trust threshold at this confidence level; defaulting to human oversight.',
            alternativesConsidered: alternatives,
        };
    }
    /**
     * Resolves the executor class, then finds a concrete available executor within
     * that class matching the required capability. If none are available in the
     * resolved class, falls back to human (a human can always be asked, unlike an
     * unavailable AI agent) rather than silently failing.
     */
    async matchExecutor(tenantId, recommendation, requiredCapability, policy = DEFAULT_POLICY) {
        if (!this.directory) {
            throw new Error('executor_directory_not_configured');
        }
        const classResolution = this.resolve(recommendation, policy);
        let candidates = await this.directory.findAvailable(tenantId, classResolution.executorType, requiredCapability);
        if (candidates.length === 0 && classResolution.executorType !== 'human') {
            candidates = await this.directory.findAvailable(tenantId, 'human', requiredCapability);
            if (candidates.length > 0) {
                return {
                    ...classResolution,
                    executorType: 'human',
                    matchedExecutor: candidates[0],
                    matchRationale: `No available ${classResolution.executorType} matched capability "${requiredCapability ?? 'any'}"; fell back to an available human executor.`,
                };
            }
            return {
                ...classResolution,
                matchedExecutor: null,
                matchRationale: `No available executor of any resolved class matched capability "${requiredCapability ?? 'any'}". Escalation required.`,
            };
        }
        return {
            ...classResolution,
            matchedExecutor: candidates[0] ?? null,
            matchRationale: candidates.length
                ? `Matched ${candidates[0].name} — trust ${candidates[0].trustLevel}, workload ${candidates[0].currentWorkload}/${candidates[0].maxConcurrent}.`
                : `No available ${classResolution.executorType} matched capability "${requiredCapability ?? 'any'}".`,
        };
    }
}
export { DEFAULT_POLICY };

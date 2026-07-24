/**
 * Reasoning Engine — deterministic checks (Enterprise Intelligence Engine
 * Sprint, Part 4). Scoped to genuinely algorithmic checks — missing
 * evidence, duplicate signals — not ones that would need an LLM to judge.
 * Conflict detection and decision-consistency checking need a real
 * definition of "conflicting" that's a business-rule decision, not
 * inferable — left as real follow-up work rather than a guessed heuristic.
 */

export interface MissingEvidenceFinding {
  signalId: string;
  source: string;
  severity: string;
  ageDays: number;
}

/**
 * Flags Signals with zero linked Evidence, past a grace period — a
 * genuinely risky state. The grace period exists because a Signal detected
 * 5 minutes ago legitimately hasn't had time to be investigated yet.
 */
export function detectMissingEvidence(
  signals: Array<{ id: string; source: string; severity: string; createdDate: string }>,
  evidenceSignalIds: Set<string>,
  graceDays = 3
): MissingEvidenceFinding[] {
  const now = Date.now();
  return signals
    .filter((s) => !evidenceSignalIds.has(s.id))
    .map((s) => ({ ...s, ageDays: (now - new Date(s.createdDate).getTime()) / (1000 * 60 * 60 * 24) }))
    .filter((s) => s.ageDays >= graceDays)
    .map((s) => ({ signalId: s.id, source: s.source, severity: s.severity, ageDays: Math.round(s.ageDays) }))
    .sort((a, b) => b.ageDays - a.ageDays);
}

export interface DuplicateSignalFinding {
  signalIds: string[];
  source: string;
  classification: string;
  count: number;
}

/**
 * Flags Signals that look like duplicates — same source, same
 * classification, same department, within a short time window. Exact-match
 * on the fields that would make two Signals represent the same underlying
 * event, not a fuzzy-match that could hide genuinely distinct issues.
 */
export function detectDuplicateSignals(
  signals: Array<{ id: string; source: string; classification: string; departmentId: string | null; createdDate: string }>,
  windowHours = 24
): DuplicateSignalFinding[] {
  const groups = new Map<string, typeof signals>();
  for (const s of signals) {
    const key = `${s.source}::${s.classification}::${s.departmentId ?? 'none'}`;
    const group = groups.get(key) ?? [];
    group.push(s);
    groups.set(key, group);
  }

  const findings: DuplicateSignalFinding[] = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
    const cluster: typeof signals = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const hoursSincePrevious = (new Date(sorted[i].createdDate).getTime() - new Date(cluster[cluster.length - 1].createdDate).getTime()) / (1000 * 60 * 60);
      if (hoursSincePrevious <= windowHours) {
        cluster.push(sorted[i]);
      } else if (cluster.length >= 2) {
        break;
      } else {
        cluster.length = 0;
        cluster.push(sorted[i]);
      }
    }
    if (cluster.length >= 2) {
      const [source, classification] = key.split('::');
      findings.push({ signalIds: cluster.map((s) => s.id), source, classification, count: cluster.length });
    }
  }
  return findings;
}

export interface UnaddressedRiskFinding {
  signalId: string;
  classification: string;
  severity: string;
  ageDays: number;
}

/**
 * Early Warning check (Student Intelligence MVP milestone, Part 5).
 * Deterministic, same pattern as detectMissingEvidence/detectDuplicateSignals
 * — no invented "risk score," just a real fact: a high-severity signal that
 * has sat open for longer than the grace period with no Recommendation
 * ever generated from it. The "evidence for the alert" IS the signal's own
 * real fields — severity, age, absence of downstream action — not a
 * fabricated explanation.
 */
export function detectUnaddressedHighSeveritySignals(
  signals: Array<{ id: string; classification: string; severity: string; status: string; createdDate: string }>,
  signalIdsWithRecommendations: Set<string>,
  graceDays = 2
): UnaddressedRiskFinding[] {
  const now = Date.now();
  return signals
    .filter((s) => s.status === 'open' && (s.severity === 'high' || s.severity === 'critical') && !signalIdsWithRecommendations.has(s.id))
    .map((s) => ({ ...s, ageDays: (now - new Date(s.createdDate).getTime()) / (1000 * 60 * 60 * 24) }))
    .filter((s) => s.ageDays >= graceDays)
    .map((s) => ({ signalId: s.id, classification: s.classification, severity: s.severity, ageDays: Math.round(s.ageDays) }))
    .sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0) || b.ageDays - a.ageDays);
}

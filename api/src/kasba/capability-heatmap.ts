import type { CapabilityProficiency, CapabilityAssignment, Person } from '@hpbrain/database';

export interface CapabilityHeatmapCell {
  capabilityId: string;
  departmentId: string | null;
  averageLevel: number;
  assessedCount: number;
}

/**
 * Org-wide Capability Heatmap (Workforce Intelligence sprint, Part 2/6).
 * Pure aggregation of REAL assessed proficiency data — mean overall level
 * per capability, per department. No invented scoring, no ranking of
 * individual people.
 *
 * Deliberately does NOT include anything resembling Part 5's "Talent
 * Intelligence" (retention risk, future-leader identification, succession
 * ranking) — declined outright, not scoped down. Labeling a real employee
 * as a flight risk or a high-potential leader requires a validated HR
 * methodology this system doesn't have; a heuristic dressed up as that
 * kind of judgment could unfairly influence a real person's career. This
 * function only ever answers "how proficient is this department in this
 * capability, on average, based on real assessments."
 */
export function computeCapabilityHeatmap(
  proficiencyRecords: CapabilityProficiency[],
  assignments: CapabilityAssignment[],
  people: Person[]
): CapabilityHeatmapCell[] {
  const assignmentById = new Map(assignments.map((a) => [a.id, a]));
  const departmentByPersonId = new Map(people.map((p) => [p.id, p.departmentId]));

  const buckets = new Map<string, { sum: number; count: number; capabilityId: string; departmentId: string | null }>();

  for (const record of proficiencyRecords) {
    const assignment = assignmentById.get(record.assignmentId);
    if (!assignment || assignment.targetType !== 'person') continue;

    const dims = [record.knowledgeLevel, record.abilityLevel, record.skillLevel, record.behaviourLevel, record.attitudeLevel].filter((d): d is number => d != null);
    if (dims.length === 0) continue;
    const overall = dims.reduce((a, b) => a + b, 0) / dims.length;

    const departmentId = departmentByPersonId.get(assignment.targetId) ?? null;
    const key = `${assignment.capabilityId}::${departmentId ?? 'none'}`;
    const bucket = buckets.get(key) ?? { sum: 0, count: 0, capabilityId: assignment.capabilityId, departmentId };
    bucket.sum += overall;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((b) => ({ capabilityId: b.capabilityId, departmentId: b.departmentId, averageLevel: Number((b.sum / b.count).toFixed(2)), assessedCount: b.count }))
    .sort((a, b) => b.assessedCount - a.assessedCount);
}

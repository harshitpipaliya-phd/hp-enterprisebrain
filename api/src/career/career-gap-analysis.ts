import type { CapabilityProficiency, OccupationRequirement } from '@hpbrain/database';

export interface CareerGapFinding {
  capabilityId: string;
  currentLevel: number | null;
  requiredLevel: number;
  gap: number;
}

export interface CareerReadiness {
  readinessScore: number | null;
  gaps: CareerGapFinding[];
  requirementsMet: number;
  requirementsTotal: number;
}

/**
 * Career Gap Analysis (Career Intelligence sprint, Part 5). Deliberately
 * separate from Labour Market Intelligence (Part 6) — this compares a
 * person's REAL assessed capability proficiency against an occupation's
 * REQUIRED capability levels. Nothing here touches salary, demand, or
 * job-market data — safe to compute today because it never needs an
 * external labour-market source, unlike Part 6.
 */
export function computeCareerReadiness(
  requirements: OccupationRequirement[],
  proficiencyByCapabilityId: Map<string, CapabilityProficiency | null>
): CareerReadiness {
  if (requirements.length === 0) {
    return { readinessScore: null, gaps: [], requirementsMet: 0, requirementsTotal: 0 };
  }

  const gaps: CareerGapFinding[] = [];
  let met = 0;

  for (const req of requirements) {
    const proficiency = proficiencyByCapabilityId.get(req.capabilityId) ?? null;
    const dims = proficiency
      ? [proficiency.knowledgeLevel, proficiency.abilityLevel, proficiency.skillLevel, proficiency.behaviourLevel, proficiency.attitudeLevel].filter((d): d is number => d != null)
      : [];
    const currentLevel = dims.length > 0 ? dims.reduce((a, b) => a + b, 0) / dims.length : null;

    if (currentLevel != null && currentLevel >= req.requiredLevel) {
      met++;
    } else {
      gaps.push({ capabilityId: req.capabilityId, currentLevel, requiredLevel: req.requiredLevel, gap: Number((req.requiredLevel - (currentLevel ?? 0)).toFixed(2)) });
    }
  }

  return {
    readinessScore: Number((met / requirements.length).toFixed(3)),
    gaps: gaps.sort((a, b) => b.gap - a.gap),
    requirementsMet: met,
    requirementsTotal: requirements.length,
  };
}

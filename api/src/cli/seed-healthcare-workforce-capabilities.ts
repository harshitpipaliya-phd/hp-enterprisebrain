/**
 * Healthcare Workforce capability seed (Healthcare Industry Pack, Part 3
 * only — the safe part of this sprint). Staff capability domains, same
 * draft-content pattern as the Teacher and Student seeds. Deliberately
 * contains ZERO patient, clinical, diagnosis, treatment, or medication
 * content — this is about a doctor or nurse's own professional
 * competency, not about patient care decisions.
 *
 * Run with: cd api && npx tsx src/cli/seed-healthcare-workforce-capabilities.ts
 */
import { CapabilityRepository, type CreateCapabilityInput } from '@hpbrain/database';

const TENANT_ID = 'demo-tenant';
const ORG_ID = 'demo-org';
const SEEDED_BY = 'seed-healthcare-workforce-capabilities';

const HEALTHCARE_STAFF_DOMAINS: Array<{ code: string; name: string; description: string }> = [
  { code: 'HC-CLINPRAC', name: 'Clinical Practice Standards', description: 'Adherence to the institution\'s own documented clinical practice standards and protocols — not a source of clinical guidance itself.' },
  { code: 'HC-PATSAFE', name: 'Patient Safety Practice', description: 'Staff competency in the institution\'s patient safety procedures (hand hygiene, identification protocols, incident reporting).' },
  { code: 'HC-COMM', name: 'Clinical Communication', description: 'Clarity and effectiveness communicating with patients, families, and the care team.' },
  { code: 'HC-TEAMWORK', name: 'Interdisciplinary Teamwork', description: 'Ability to collaborate effectively across roles in a care team.' },
  { code: 'HC-DOCUMENT', name: 'Clinical Documentation Quality', description: 'Accuracy, completeness, and timeliness of required documentation practices.' },
  { code: 'HC-TECH', name: 'Medical Technology Proficiency', description: 'Effective use of the institution\'s clinical and administrative technology systems.' },
  { code: 'HC-CRISIS', name: 'Crisis Response', description: 'Composure and procedural adherence during emergency situations.' },
  { code: 'HC-PROFDEV', name: 'Professional Development', description: 'Engagement with continuing education and skill maintenance requirements.' },
];

async function main(): Promise<void> {
  const repo = new CapabilityRepository();
  const existing = await repo.list(TENANT_ID);
  if (existing.some((c) => c.capabilityCode.startsWith('HC-'))) {
    console.log('Healthcare workforce capabilities already seeded — skipping (idempotent, safe to re-run).');
    return;
  }

  console.log('Seeding DRAFT healthcare STAFF capability domains (workforce only — no patient/clinical content). Review with clinical governance before real use.');
  for (const domain of HEALTHCARE_STAFF_DOMAINS) {
    const input: CreateCapabilityInput = {
      tenantId: TENANT_ID,
      orgId: ORG_ID,
      capabilityCode: domain.code,
      name: domain.name,
      description: domain.description,
      category: 'healthcare_workforce',
      capabilityType: 'core',
      difficulty: 'intermediate',
      criticality: 'high',
      createdBy: SEEDED_BY,
      knowledge: { description: `Institutional knowledge relevant to ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      ability: { description: `Applied ability for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      skill: { description: `Demonstrated skill for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      behaviour: { description: `Observable behaviour for ${domain.name}`, targetLevel: 3, evidenceRequired: false },
      attitude: { description: `Professional attitude toward ${domain.name}`, targetLevel: 3, evidenceRequired: false },
    };
    await repo.create(input);
    console.log(`  Seeded: ${domain.name} (${domain.code})`);
  }
  console.log('Done. 8 draft healthcare workforce domains created — real clinical governance review still required.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

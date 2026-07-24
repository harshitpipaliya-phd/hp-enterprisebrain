/**
 * Teacher Intelligence — capability content seed (Sprint 17, scoped).
 *
 * HONEST SCOPE: this is DRAFT content, not expert-validated pedagogical
 * competency definitions. Target levels (1-5 scale) are reasonable
 * placeholders for structure, not the result of an instructional-design
 * process. An education SME should review and correct every one of these
 * before this is used for a real teacher's assessment.
 *
 * Uses the EXISTING Capability entity and its EXISTING KasbaElement fields
 * (targetLevel per K/A/S/B/A dimension) — no new schema.
 *
 * Run with: cd api && npx tsx src/cli/seed-teacher-capabilities.ts
 */
import { CapabilityRepository, type CreateCapabilityInput } from '@hpbrain/database';

const TENANT_ID = 'demo-tenant';
const ORG_ID = 'demo-org';
const SEEDED_BY = 'seed-teacher-capabilities';

// The 10 domains named explicitly in Part 3 of the Teacher Intelligence
// sprint. Target levels are draft placeholders (3 = "proficient" on a 1-5
// scale) — an SME should set real targets per role/experience level.
const TEACHING_DOMAINS: Array<{ code: string; name: string; description: string }> = [
  { code: 'TCH-SUBJ', name: 'Subject Knowledge', description: 'Depth and accuracy of subject-matter expertise in the teacher\'s assigned subject(s).' },
  { code: 'TCH-PED', name: 'Pedagogical Ability', description: 'Ability to translate subject knowledge into effective instruction for the student\'s level.' },
  { code: 'TCH-SKILL', name: 'Teaching Skills', description: 'Practical classroom delivery skills — pacing, explanation clarity, questioning technique.' },
  { code: 'TCH-BEH', name: 'Behaviour', description: 'Observable professional conduct in the classroom and with colleagues.' },
  { code: 'TCH-ATT', name: 'Professional Attitude', description: 'Disposition toward continuous improvement, feedback, and student wellbeing.' },
  { code: 'TCH-COMM', name: 'Communication', description: 'Clarity and effectiveness of communication with students, parents, and staff.' },
  { code: 'TCH-TECH', name: 'Technology', description: 'Effective use of classroom and instructional technology.' },
  { code: 'TCH-MGMT', name: 'Classroom Management', description: 'Ability to maintain a productive, safe, and orderly learning environment.' },
  { code: 'TCH-ASSESS', name: 'Assessment', description: 'Skill in designing, administering, and interpreting student assessments.' },
  { code: 'TCH-ENGAGE', name: 'Student Engagement', description: 'Ability to motivate and sustain active student participation.' },
];

async function main(): Promise<void> {
  const repo = new CapabilityRepository();
  const existing = await repo.list(TENANT_ID);
  if (existing.some((c) => c.capabilityCode.startsWith('TCH-'))) {
    console.log('Teaching capabilities already seeded for this tenant — skipping (idempotent, safe to re-run).');
    return;
  }

  console.log('Seeding DRAFT teaching capability domains — review target levels with an education SME before real use.');
  for (const domain of TEACHING_DOMAINS) {
    const input: CreateCapabilityInput = {
      tenantId: TENANT_ID,
      orgId: ORG_ID,
      capabilityCode: domain.code,
      name: domain.name,
      description: domain.description,
      category: 'teaching',
      capabilityType: 'core',
      difficulty: 'intermediate',
      criticality: 'high',
      createdBy: SEEDED_BY,
      knowledge: { description: `Subject/domain knowledge for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      ability: { description: `Applied ability for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      skill: { description: `Practiced skill for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      behaviour: { description: `Observable behaviour for ${domain.name}`, targetLevel: 3, evidenceRequired: false },
      attitude: { description: `Professional attitude for ${domain.name}`, targetLevel: 3, evidenceRequired: false },
    };
    await repo.create(input);
    console.log(`  Seeded: ${domain.name} (${domain.code})`);
  }
  console.log('Done. 10 draft teaching capability domains created — real content review still required.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

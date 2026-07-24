/**
 * Student Intelligence — capability content seed (Sprint 18, scoped).
 *
 * Same honest scope as the Teacher capability seed: DRAFT content, not
 * expert-validated learning-science competency definitions. A learning
 * scientist / curriculum expert should review before real use.
 *
 * Uses the EXISTING Capability entity and KasbaElement fields — no new
 * schema.
 *
 * Run with: cd api && npx tsx src/cli/seed-student-capabilities.ts
 */
import { CapabilityRepository, type CreateCapabilityInput } from '@hpbrain/database';

const TENANT_ID = 'demo-tenant';
const ORG_ID = 'demo-org';
const SEEDED_BY = 'seed-student-capabilities';

// The 12 domains named in Part 3. Note: "Knowledge, Ability, Skills,
// Behaviour, Attitude" ARE the KASBA dimensions themselves, not separate
// capability domains — seeding them as domains would double-count what the
// KasbaElement fields already represent on every capability. Seeded here
// are the 7 genuinely distinct competency domains beyond KASBA itself.
const STUDENT_DOMAINS: Array<{ code: string; name: string; description: string }> = [
  { code: 'STU-CRIT', name: 'Critical Thinking', description: 'Ability to analyze information, question assumptions, and reason toward sound conclusions.' },
  { code: 'STU-COMM', name: 'Communication', description: 'Clarity and effectiveness expressing ideas verbally and in writing.' },
  { code: 'STU-CREAT', name: 'Creativity', description: 'Ability to generate original ideas and approaches to problems.' },
  { code: 'STU-COLLAB', name: 'Collaboration', description: 'Ability to work productively with peers toward a shared goal.' },
  { code: 'STU-PROB', name: 'Problem Solving', description: 'Ability to identify problems and apply appropriate methods to solve them.' },
  { code: 'STU-DIGI', name: 'Digital Literacy', description: 'Effective and responsible use of digital tools for learning.' },
  { code: 'STU-LEAD', name: 'Leadership', description: 'Ability to take initiative and positively influence peers in group settings.' },
];

async function main(): Promise<void> {
  const repo = new CapabilityRepository();
  const existing = await repo.list(TENANT_ID);
  if (existing.some((c) => c.capabilityCode.startsWith('STU-'))) {
    console.log('Student capabilities already seeded for this tenant — skipping (idempotent, safe to re-run).');
    return;
  }

  console.log('Seeding DRAFT student capability domains — review target levels with a learning scientist before real use.');
  for (const domain of STUDENT_DOMAINS) {
    const input: CreateCapabilityInput = {
      tenantId: TENANT_ID,
      orgId: ORG_ID,
      capabilityCode: domain.code,
      name: domain.name,
      description: domain.description,
      category: 'student_competency',
      capabilityType: 'core',
      difficulty: 'intermediate',
      criticality: 'medium',
      createdBy: SEEDED_BY,
      knowledge: { description: `Conceptual understanding relevant to ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      ability: { description: `Applied ability for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      skill: { description: `Demonstrated skill for ${domain.name}`, targetLevel: 3, evidenceRequired: true },
      behaviour: { description: `Observable behaviour for ${domain.name}`, targetLevel: 3, evidenceRequired: false },
      attitude: { description: `Disposition toward ${domain.name}`, targetLevel: 3, evidenceRequired: false },
    };
    await repo.create(input);
    console.log(`  Seeded: ${domain.name} (${domain.code})`);
  }
  console.log('Done. 7 draft student competency domains created — real content review still required.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

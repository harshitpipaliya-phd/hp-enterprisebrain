/**
 * Seed script (expanded — Version 1.0 RC pass). Walks the COMPLETE loop for
 * real, using the actual Service classes (not just repositories, so events
 * fire and graph sync happens the same way it would for a real user):
 * Organization -> Department -> Person -> Capability -> Signal -> Evidence
 * -> Case -> Hypothesis (proposed, then confirmed) -> Reasoning ->
 * Recommendation -> Decision -> ESO Execution -> Outcome -> Learning ->
 * Mental Model. Plus Executors and Policies from the original Sprint 8 seed.
 *
 * This directly answers Step 7 of the "Version 1.0 RC" request: "a new user
 * should be able to experience the entire product immediately." Previously,
 * this script referenced a hardcoded orgId that was never actually inserted
 * as a real Organization record — fixed here, a real org now gets created.
 *
 * Idempotent: checks for existing data first, safe to re-run.
 * Run with: cd api && npx tsx src/cli/seed.ts
 */
import { OrganizationRepository, DepartmentRepository, PersonRepository, CapabilityRepository, ExecutorRepository, PolicyRepository, SignalRepository, } from '@hpbrain/database';
import { OrganizationService } from '../org/org.service.js';
import { DepartmentService } from '../department/department.service.js';
import { PersonService } from '../person/person.service.js';
import { CapabilityService } from '../capability/capability.service.js';
import { SignalService } from '../signal/signal.service.js';
import { EvidenceService } from '../evidence/evidence.service.js';
import { CaseService } from '../case/case.service.js';
import { HypothesisService } from '../case/hypothesis.service.js';
import { ReasoningService } from '../reasoning/reasoning.service.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';
import { DecisionService } from '../decision/decision.service.js';
import { EsoRuntimeService } from '../eso/eso-runtime.service.js';
import { OutcomeService } from '../outcome/outcome.service.js';
import { LearningService } from '../learning/learning.service.js';
import { MentalModelService } from '../mental-model/mental-model.service.js';
import { ReasoningStepRepository, RecommendationRepository, DecisionRepository, EsoExecutionRepository, OutcomeRepository, LearningRepository, MentalModelRepository, CaseRepository, HypothesisRepository, EvidenceRepository, } from '@hpbrain/database';
const TENANT_ID = 'demo-tenant';
const SEEDED_BY = 'seed-script';
async function alreadySeeded() {
    const orgs = await new OrganizationRepository().list(TENANT_ID);
    return orgs.length > 0;
}
async function main() {
    if (await alreadySeeded()) {
        console.log(`Tenant "${TENANT_ID}" already has seed data — skipping (idempotent, safe to re-run).`);
        return;
    }
    console.log(`Seeding demo data for tenant "${TENANT_ID}" — walking the complete loop...`);
    // 1. Organization -> Department -> Person -> Capability
    const orgService = new OrganizationService(new OrganizationRepository());
    const org = await orgService.create({ tenantId: TENANT_ID, name: 'Riverside Public School', orgCode: 'RPS-001', industry: 'K-12 Education', country: 'IN', createdBy: SEEDED_BY });
    console.log(`  Organization: ${org.name}`);
    const deptService = new DepartmentService(new DepartmentRepository());
    const dept = await deptService.create({ tenantId: TENANT_ID, orgId: org.id, name: 'Fee Administration', departmentType: 'department', createdBy: SEEDED_BY });
    console.log(`  Department: ${dept.name}`);
    const personService = new PersonService(new PersonRepository());
    const person = await personService.create({ tenantId: TENANT_ID, orgId: org.id, employeeId: 'EMP-001', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@riverside.example.edu', createdBy: SEEDED_BY });
    console.log(`  Person: ${person.firstName} ${person.lastName}`);
    const capabilityService = new CapabilityService(new CapabilityRepository());
    const capability = await capabilityService.create({ tenantId: TENANT_ID, orgId: org.id, capabilityCode: 'FEE-COLLECTION', name: 'Fee Collection Management', category: 'operations', createdBy: SEEDED_BY });
    console.log(`  Capability: ${capability.name}`);
    // 2. Executors and Policies (unchanged from the original Sprint 8 seed)
    const executorRepo = new ExecutorRepository();
    const collectionsAgent = await executorRepo.register({ tenantId: TENANT_ID, name: 'Collections Agent', executorType: 'ai_agent', capabilityTags: ['fee_collection'], trustLevel: 0.9, maxConcurrent: 20 });
    await executorRepo.register({ tenantId: TENANT_ID, name: 'Priya Sharma (Ops Lead)', executorType: 'human', capabilityTags: ['fee_collection', 'enrollment_processing'], trustLevel: 1.0, maxConcurrent: 5 });
    console.log(`  Executors registered`);
    const policyRepo = new PolicyRepository();
    await policyRepo.create({
        tenantId: TENANT_ID, name: 'Auto-approve high-confidence fee collection risk', scope: 'recommendations', policyType: 'business_rule',
        rules: [{ conditions: [{ field: 'recommendation.category', operator: 'eq', value: 'risk' }, { field: 'recommendation.confidence', operator: 'gte', value: 0.8 }], match: 'all', action: 'auto_approve' }],
        createdBy: SEEDED_BY,
    });
    console.log(`  Policy registered`);
    // 3. The complete intelligence loop: Signal -> Evidence -> Case -> Hypothesis -> Reasoning -> Recommendation -> Decision -> Execution -> Outcome -> Learning -> Memory
    const signalService = new SignalService(new SignalRepository());
    const signal = await signalService.detect({
        tenantId: TENANT_ID, orgId: org.id, departmentId: dept.id, source: 'attendance',
        classification: 'defaulter_risk', priority: 'high', createdBy: SEEDED_BY,
    });
    console.log(`  Signal: ${signal.classification}`);
    const evidenceService = new EvidenceService(new EvidenceRepository());
    const evidence = await evidenceService.collect({
        tenantId: TENANT_ID, signalId: signal.id, source: 'internal', evidenceType: 'payment_record',
        content: { note: '3 consecutive missed fee payments in Grade 9' }, provenance: { confidence: 0.9 }, confidence: 0.9, createdBy: SEEDED_BY,
    });
    console.log(`  Evidence collected`);
    const caseService = new CaseService(new CaseRepository());
    const demoCase = await caseService.open({ tenantId: TENANT_ID, signalId: signal.id, title: 'Recurring fee shortfall — Grade 9', createdBy: SEEDED_BY });
    await caseService.transition(TENANT_ID, demoCase.id, 'investigating', SEEDED_BY);
    await caseService.attachEvidence(TENANT_ID, demoCase.id, evidence.id, SEEDED_BY);
    console.log(`  Case opened: ${demoCase.title}`);
    const hypothesisService = new HypothesisService(new HypothesisRepository(), caseService);
    const hypothesis = await hypothesisService.propose({
        tenantId: TENANT_ID, caseId: demoCase.id, statement: 'Motivation issue, not a Capability gap — family is aware but deprioritizing payment',
        rootCauseFamily: 'Motivation', supportingEvidenceIds: [evidence.id], proposedBy: SEEDED_BY,
    });
    console.log(`  Hypothesis proposed: ${hypothesis.rootCauseFamily}`);
    const reasoningService = new ReasoningService(new ReasoningStepRepository(), new EvidenceRepository());
    const reasoningStep = await reasoningService.reason({
        tenantId: TENANT_ID, signalId: signal.id, caseId: demoCase.id, description: 'Reasoning over confirmed motivation-driven payment delay pattern', createdBy: SEEDED_BY,
    });
    console.log(`  Reasoning step recorded (confidence: ${reasoningStep.confidenceScore})`);
    await hypothesisService.confirm(TENANT_ID, demoCase.id, hypothesis.id, SEEDED_BY);
    console.log(`  Hypothesis confirmed — case resolved`);
    const recommendationService = new RecommendationService(new RecommendationRepository(), new ReasoningStepRepository());
    const recommendation = await recommendationService.generate({
        tenantId: TENANT_ID, reasoningStepId: reasoningStep.id, category: 'risk', title: 'Send targeted payment reminder to Grade 9 families', createdBy: SEEDED_BY,
    });
    console.log(`  Recommendation generated: ${recommendation.title}`);
    const decisionService = new DecisionService(new DecisionRepository(), new RecommendationRepository());
    const decision = await decisionService.approve({
        tenantId: TENANT_ID, recommendationId: recommendation.id, decidedBy: person.id, rationale: 'Approved based on confirmed root cause and evidence trail',
    });
    console.log(`  Decision approved — executor: ${decision.executorType}`);
    const esoRuntime = new EsoRuntimeService(new EsoExecutionRepository());
    const execution = await esoRuntime.execute({ tenantId: TENANT_ID, esoId: 'eso-fee-reminder-v1', decisionId: decision.id, executedBy: collectionsAgent.id, executorType: 'ai_agent' });
    await esoRuntime.transition(TENANT_ID, execution.id, 'running', SEEDED_BY);
    await esoRuntime.transition(TENANT_ID, execution.id, 'completed', SEEDED_BY, { output: { reminderSent: true } });
    console.log(`  ESO executed and completed`);
    const outcomeService = new OutcomeService(new OutcomeRepository());
    const outcome = await outcomeService.capture({
        tenantId: TENANT_ID, decisionId: decision.id, result: 'success', metrics: { paymentReceived: true, daysToPay: 4 }, confidence: 0.85, createdBy: SEEDED_BY,
    });
    console.log(`  Outcome captured: ${outcome.result}`);
    const mentalModelService = new MentalModelService(new MentalModelRepository());
    const learningService = new LearningService(new LearningRepository(), new OutcomeRepository(), mentalModelService);
    const learning = await learningService.extract({
        tenantId: TENANT_ID, outcomeId: outcome.id, domain: 'fee-collection', pattern: 'Targeted reminders resolve motivation-driven payment delays within a week', createdBy: SEEDED_BY,
    });
    console.log(`  Learning captured (reusable: ${learning.reusable}) — Mental Model reinforced for domain "fee-collection"`);
    console.log('\nSeed complete. The full loop now has real data: Organization -> Department -> Person -> Capability -> Signal -> Evidence -> Case -> Hypothesis -> Reasoning -> Recommendation -> Decision -> Execution -> Outcome -> Learning -> Memory.');
}
main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});

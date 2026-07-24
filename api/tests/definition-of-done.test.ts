import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CaseService } from '../src/case/case.service.js';
import { HypothesisService } from '../src/case/hypothesis.service.js';
import { EvidenceService } from '../src/evidence/evidence.service.js';
import { ReasoningService } from '../src/reasoning/reasoning.service.js';
import { RecommendationService } from '../src/recommendation/recommendation.service.js';
import { DecisionService } from '../src/decision/decision.service.js';
import { EsoRuntimeService } from '../src/eso/eso-runtime.service.js';
import { OutcomeService } from '../src/outcome/outcome.service.js';
import { LearningService } from '../src/learning/learning.service.js';
import { MentalModelService } from '../src/mental-model/mental-model.service.js';
import { ExecutorResolverService } from '../src/executor/executor-resolver.service.js';
import type {
  Case, Hypothesis, Evidence, ReasoningStep, Recommendation, Decision, EsoExecution, Outcome, Learning, MentalModel,
} from '@hpbrain/database';

/**
 * The exact "Definition of Done" scenario from the MVP mission: Create Case
 * -> Attach Evidence -> AI Analysis -> Recommendation -> Decision ->
 * Execution -> Outcome -> Learning -> Memory Updated.
 *
 * Every service here is real. Only the repositories are in-memory, same
 * convention as every other test in this suite. This proves the loop is
 * genuinely CONNECTED — Case flows into Reasoning via caseId (a field that
 * has existed since Sprint 2/3 but was never exercisable until Case became a
 * real entity this session) — without requiring a single new UI screen.
 */
function stores() {
  return {
    cases: {} as Record<string, Case>,
    hypotheses: {} as Record<string, Hypothesis>,
    evidence: {} as Record<string, Evidence>,
    reasoningSteps: {} as Record<string, ReasoningStep>,
    recommendations: {} as Record<string, Recommendation>,
    decisions: {} as Record<string, Decision>,
    executions: {} as Record<string, EsoExecution>,
    outcomes: {} as Record<string, Outcome>,
    learnings: {} as Record<string, Learning>,
    mentalModels: {} as Record<string, MentalModel>,
  };
}

test('Definition of Done: Case -> Evidence -> Reasoning -> Recommendation -> Decision -> Execution -> Outcome -> Learning -> Memory', async () => {
  const db = stores();
  let seq = 1;
  const nextId = (p: string) => `${p}-${seq++}`;
  const TENANT = 't1', USER = 'u1';

  const caseService = new CaseService({
    create: async (input) => {
      const now = new Date().toISOString();
      const c: Case = { id: nextId('case'), tenantId: input.tenantId, signalId: input.signalId ?? null, title: input.title, description: input.description ?? null, status: 'open', resolvedHypothesisId: null, createdBy: input.createdBy, createdDate: now, updatedDate: now };
      db.cases[c.id] = c; return c;
    },
    findById: async (_t, id) => db.cases[id] ?? null,
    findBySignal: async () => [],
    list: async (t) => Object.values(db.cases).filter((c) => c.tenantId === t),
    transition: async (_t, id, status, resolvedHypothesisId) => { db.cases[id] = { ...db.cases[id], status, resolvedHypothesisId: resolvedHypothesisId ?? db.cases[id].resolvedHypothesisId }; return db.cases[id]; },
    linkEvidence: async () => {},
    getLinkedEvidenceIds: async () => [],
  });

  const hypothesisService = new HypothesisService({
    propose: async (input) => {
      const h: Hypothesis = { id: nextId('hyp'), tenantId: input.tenantId, caseId: input.caseId, statement: input.statement, rootCauseFamily: input.rootCauseFamily, confidence: input.confidence ?? 0.5, status: 'proposed', supportingEvidenceIds: input.supportingEvidenceIds ?? [], rejectedReason: null, proposedBy: input.proposedBy, createdDate: new Date().toISOString() };
      db.hypotheses[h.id] = h; return h;
    },
    recordOutcome: async (_t, _c, originalId, status, proposedBy) => {
      const original = db.hypotheses[originalId];
      const h: Hypothesis = { ...original, id: nextId('hyp'), status, proposedBy, createdDate: new Date().toISOString() };
      db.hypotheses[h.id] = h; return h;
    },
    findById: async (_t, id) => db.hypotheses[id] ?? null,
    findByCase: async (t, caseId) => Object.values(db.hypotheses).filter((h) => h.tenantId === t && h.caseId === caseId),
  }, caseService);

  const evidenceService = new EvidenceService({
    create: async (input) => {
      const e: Evidence = { id: nextId('ev'), tenantId: input.tenantId, signalId: input.signalId ?? null, source: input.source, evidenceType: input.evidenceType ?? 'observation', content: input.content, provenance: input.provenance, confidence: input.confidence ?? 0.5, hash: 'h', version: 1, status: 'active', observedDate: new Date().toISOString(), createdBy: input.createdBy, createdDate: new Date().toISOString() };
      db.evidence[e.id] = e; return e;
    },
    findById: async (_t, id) => db.evidence[id] ?? null,
    findBySignal: async (t, sigId) => Object.values(db.evidence).filter((e) => e.tenantId === t && e.signalId === sigId),
    list: async (t) => Object.values(db.evidence).filter((e) => e.tenantId === t),
  });

  const reasoningService = new ReasoningService(
    {
      create: async (input) => {
        const r: ReasoningStep = { id: nextId('rs'), tenantId: input.tenantId, caseId: input.caseId ?? null, signalId: input.signalId ?? null, mentalModelId: input.mentalModelId ?? null, stepOrder: input.stepOrder, description: input.description, confidenceScore: input.confidenceScore, createdBy: input.createdBy, createdDate: new Date().toISOString() };
        db.reasoningSteps[r.id] = r; return r;
      },
      findBySignal: async () => [],
      findById: async (_t, id) => db.reasoningSteps[id] ?? null,
    },
    { findBySignal: async (t, sigId) => Object.values(db.evidence).filter((e) => e.tenantId === t && e.signalId === sigId) }
  );

  const recommendationService = new RecommendationService(
    {
      create: async (input) => {
        const r: Recommendation = { id: nextId('rec'), tenantId: input.tenantId, reasoningStepId: input.reasoningStepId ?? null, category: input.category, title: input.title, description: input.description ?? null, priority: input.priority ?? 'medium', urgency: input.urgency ?? 'normal', confidence: input.confidence, impact: input.impact ?? null, expectedRoi: input.expectedRoi ?? null, cost: input.cost ?? null, risk: input.risk ?? null, dependencies: input.dependencies ?? [], status: 'pending', createdBy: input.createdBy, createdDate: new Date().toISOString(), updatedDate: new Date().toISOString() };
        db.recommendations[r.id] = r; return r;
      },
      findById: async (_t, id) => db.recommendations[id] ?? null,
      list: async (t) => Object.values(db.recommendations).filter((r) => r.tenantId === t),
      updateStatus: async (_t, id, status) => { db.recommendations[id].status = status; return db.recommendations[id]; },
    },
    { findById: async (_t, id) => db.reasoningSteps[id] ?? null }
  );

  const decisionService = new DecisionService(
    {
      create: async (input) => {
        const d: Decision = { id: nextId('dec'), tenantId: input.tenantId, recommendationId: input.recommendationId ?? null, decidedBy: input.decidedBy, executorType: input.executorType, rationale: input.rationale, alternativesConsidered: input.alternativesConsidered ?? [], confidence: input.confidence ?? 0.5, explanation: input.explanation ?? null, trace: input.trace ?? [], status: input.status ?? 'approved', createdDate: new Date().toISOString() };
        db.decisions[d.id] = d; return d;
      },
      findById: async (_t, id) => db.decisions[id] ?? null,
      list: async (t) => Object.values(db.decisions).filter((d) => d.tenantId === t),
    },
    { findById: async (_t, id) => db.recommendations[id] ?? null, updateStatus: async (_t, id, status) => { db.recommendations[id].status = status; return db.recommendations[id]; } },
    new ExecutorResolverService()
  );

  const esoRuntimeService = new EsoRuntimeService({
    queue: async (input) => { const e: EsoExecution = { id: nextId('exec'), tenantId: input.tenantId, esoId: input.esoId, decisionId: input.decisionId ?? null, status: 'queued', executedBy: input.executedBy, executorType: input.executorType, input: input.input ?? {}, output: null, error: null, startedDate: null, completedDate: null, createdDate: new Date().toISOString() }; db.executions[e.id] = e; return e; },
    findById: async (_t, id) => db.executions[id] ?? null,
    findByEso: async () => [],
    list: async () => [],
    transition: async (_t, id, status, patch = {}) => { db.executions[id] = { ...db.executions[id], status, output: patch.output ?? db.executions[id].output }; return db.executions[id]; },
  });

  const outcomeService = new OutcomeService({
    create: async (input) => { const o: Outcome = { id: nextId('out'), tenantId: input.tenantId, decisionId: input.decisionId ?? null, result: input.result, metrics: input.metrics ?? {}, kpis: input.kpis ?? {}, evidenceIds: input.evidenceIds ?? [], feedback: input.feedback ?? null, confidence: input.confidence ?? 0.5, createdBy: input.createdBy, createdDate: new Date().toISOString() }; db.outcomes[o.id] = o; return o; },
    findById: async (_t, id) => db.outcomes[id] ?? null,
    findByDecision: async () => [],
    list: async (t) => Object.values(db.outcomes).filter((o) => o.tenantId === t),
  });

  const mentalModelService = new MentalModelService({
    create: async (input) => { const m: MentalModel = { id: nextId('mm'), tenantId: input.tenantId, name: input.name, description: input.description ?? null, domain: input.domain, rules: input.rules ?? { patterns: [] }, confidence: input.confidence ?? 0.5, reinforcementCount: 0, version: 1, status: 'active', createdBy: input.createdBy, createdDate: new Date().toISOString(), updatedDate: new Date().toISOString() }; db.mentalModels[m.id] = m; return m; },
    findById: async (_t, id) => db.mentalModels[id] ?? null,
    findActiveByDomain: async (t, domain) => Object.values(db.mentalModels).find((m) => m.tenantId === t && m.domain === domain) ?? null,
    list: async (t) => Object.values(db.mentalModels).filter((m) => m.tenantId === t),
    reinforce: async (_t, id) => { db.mentalModels[id].reinforcementCount++; return db.mentalModels[id]; },
  });

  const learningService = new LearningService(
    { create: async (input) => { const l: Learning = { id: nextId('learn'), tenantId: input.tenantId, outcomeId: input.outcomeId ?? null, mentalModelId: input.mentalModelId ?? null, pattern: input.pattern, description: input.description ?? null, confidence: input.confidence ?? 0.5, reusable: input.reusable ?? true, createdBy: input.createdBy, createdDate: new Date().toISOString() }; db.learnings[l.id] = l; return l; },
      list: async (t) => Object.values(db.learnings).filter((l) => l.tenantId === t), findReusable: async () => [] },
    { findById: async (_t, id) => db.outcomes[id] ?? null },
    mentalModelService
  );

  const c = await caseService.open({ tenantId: TENANT, title: 'Recurring fee collection shortfall in Grade 9', createdBy: USER });
  await caseService.transition(TENANT, c.id, 'investigating', USER);

  const ev = await evidenceService.collect({ tenantId: TENANT, source: 'internal', content: { note: '3 consecutive missed payments' }, provenance: { confidence: 0.9 }, confidence: 0.9, createdBy: USER });

  const hyp = await hypothesisService.propose({ tenantId: TENANT, caseId: c.id, statement: 'Motivation issue, not a Capability gap', rootCauseFamily: 'Motivation', supportingEvidenceIds: [ev.id], proposedBy: USER });
  assert.equal((await caseService.get(TENANT, c.id))!.status, 'hypothesized');

  const step = await reasoningService.reason({ tenantId: TENANT, signalId: 'sig-none', caseId: c.id, description: 'Reasoning tied to case ' + c.id, createdBy: USER });
  assert.equal(step.caseId, c.id, 'ReasoningStep must actually carry the caseId, not just accept it');

  const confirmed = await hypothesisService.confirm(TENANT, c.id, hyp.id, USER);
  assert.equal((await caseService.get(TENANT, c.id))!.status, 'resolved');
  assert.equal((await caseService.get(TENANT, c.id))!.resolvedHypothesisId, confirmed.id);

  const rec = await recommendationService.generate({ tenantId: TENANT, reasoningStepId: step.id, category: 'risk', title: 'Send targeted payment reminder', createdBy: USER });

  const decision = await decisionService.approve({ tenantId: TENANT, recommendationId: rec.id, decidedBy: USER, rationale: 'Approved based on confirmed root cause' });
  assert.equal((await recommendationService.get(TENANT, rec.id))!.status, 'approved');

  const exec = await esoRuntimeService.execute({ tenantId: TENANT, esoId: 'eso-fee-reminder-v1', decisionId: decision.id, executedBy: USER, executorType: decision.executorType });
  await esoRuntimeService.transition(TENANT, exec.id, 'running', USER);
  const completed = await esoRuntimeService.transition(TENANT, exec.id, 'completed', USER, { output: { reminderSent: true } });
  assert.equal(completed.status, 'completed');

  const outcome = await outcomeService.capture({ tenantId: TENANT, decisionId: decision.id, result: 'success', metrics: { paymentReceived: true }, confidence: 0.8, createdBy: USER });

  const learning = await learningService.extract({ tenantId: TENANT, outcomeId: outcome.id, domain: 'fee-collection', pattern: 'Targeted reminders resolve motivation-driven payment delays', createdBy: USER });
  assert.equal(learning.reusable, true);

  const memory = await mentalModelService.forDomain(TENANT, 'fee-collection');
  assert.ok(memory, 'Memory (Mental Model) must exist after a reusable Learning in this domain');
  assert.equal(memory!.id, learning.mentalModelId);

  assert.equal(step.caseId, c.id);
  assert.equal(rec.reasoningStepId, step.id);
  assert.equal(decision.recommendationId, rec.id);
  assert.equal(exec.decisionId, decision.id);
  assert.equal(outcome.decisionId, decision.id);
  assert.equal(learning.outcomeId, outcome.id);
  assert.equal(learning.mentalModelId, memory!.id);
});

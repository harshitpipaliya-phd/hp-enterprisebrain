import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignalService } from '../src/signal/signal.service.js';
import { EvidenceService } from '../src/evidence/evidence.service.js';
import { ReasoningService } from '../src/reasoning/reasoning.service.js';
import { RecommendationService } from '../src/recommendation/recommendation.service.js';
import { DecisionService } from '../src/decision/decision.service.js';
import { EsoRuntimeService } from '../src/eso/eso-runtime.service.js';
import { OutcomeService } from '../src/outcome/outcome.service.js';
import { LearningService } from '../src/learning/learning.service.js';
import { ExecutorResolverService } from '../src/executor/executor-resolver.service.js';
import type {
  Signal, Evidence, ReasoningStep, Recommendation, Decision, EsoExecution, Outcome, Learning,
} from '@hpbrain/database';

/**
 * Sprint 3 Story 10: Closed Intelligence Loop.
 *
 * Not a mocked demonstration — every service under test is the real class used by
 * the real API routes; only the persistence layer is an in-memory stand-in, same
 * convention as every other test file in this suite, because there is no live
 * Postgres/Neo4j in this environment. This proves the *wiring* is coherent: a
 * Signal detected here really can flow, through real business logic (confidence
 * computation, category forcing, executor resolution, reusability gating, DPDP
 * anonymization), all the way to a reusable Learning — without any step faked.
 */

function inMemoryStores() {
  return {
    signals: {} as Record<string, Signal>,
    evidence: {} as Record<string, Evidence>,
    reasoningSteps: {} as Record<string, ReasoningStep>,
    recommendations: {} as Record<string, Recommendation>,
    decisions: {} as Record<string, Decision>,
    executions: {} as Record<string, EsoExecution>,
    outcomes: {} as Record<string, Outcome>,
    learnings: {} as Record<string, Learning>,
  };
}

test('Closed Intelligence Loop: Signal -> Evidence -> Reasoning -> Recommendation -> Decision -> ESO -> Outcome -> Learning', async () => {
  const db = inMemoryStores();
  let seq = 1;
  const nextId = (prefix: string) => `${prefix}-${seq++}`;

  const signalService = new SignalService({
    create: async (input) => {
      const s: Signal = {
        id: nextId('sig'), tenantId: input.tenantId, orgId: input.orgId, departmentId: input.departmentId ?? null, source: input.source,
        classification: input.classification ?? 'unclassified', priority: input.priority ?? 'normal',
        severity: input.severity ?? 'low', confidence: input.confidence ?? 0.5,
        relatedEntityType: input.relatedEntityType ?? null, relatedEntityId: input.relatedEntityId ?? null,
        status: 'new', metadata: input.metadata ?? {}, createdBy: input.createdBy,
        createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
      };
      db.signals[s.id] = s;
      return s;
    },
    findById: async (_t, id) => db.signals[id] ?? null,
    list: async (t) => Object.values(db.signals).filter((s) => s.tenantId === t),
    updateStatus: async (_t, id, patch) => { db.signals[id].status = patch.status; return db.signals[id]; },
  });

  const evidenceService = new EvidenceService({
    create: async (input) => {
      const e: Evidence = {
        id: nextId('ev'), tenantId: input.tenantId, signalId: input.signalId ?? null, source: input.source,
        evidenceType: input.evidenceType ?? 'observation', content: input.content, provenance: input.provenance,
        confidence: input.confidence ?? 0.5, hash: 'h', version: 1, status: 'active', observedDate: new Date().toISOString(),
        createdBy: input.createdBy, createdDate: new Date().toISOString(),
      };
      db.evidence[e.id] = e;
      return e;
    },
    findById: async (_t, id) => db.evidence[id] ?? null,
    findBySignal: async (t, sigId) => Object.values(db.evidence).filter((e) => e.tenantId === t && e.signalId === sigId),
    list: async (t) => Object.values(db.evidence).filter((e) => e.tenantId === t),
  });

  const reasoningService = new ReasoningService(
    {
      create: async (input) => {
        const r: ReasoningStep = {
          id: nextId('rs'), tenantId: input.tenantId, caseId: input.caseId ?? null, signalId: input.signalId ?? null,
          mentalModelId: input.mentalModelId ?? null, stepOrder: input.stepOrder, description: input.description,
          confidenceScore: input.confidenceScore, createdBy: input.createdBy, createdDate: new Date().toISOString(),
        };
        db.reasoningSteps[r.id] = r;
        return r;
      },
      findBySignal: async (t, sigId) => Object.values(db.reasoningSteps).filter((r) => r.tenantId === t && r.signalId === sigId),
      findById: async (_t, id) => db.reasoningSteps[id] ?? null,
    },
    { findBySignal: async (t, sigId) => Object.values(db.evidence).filter((e) => e.tenantId === t && e.signalId === sigId) }
  );

  const recommendationService = new RecommendationService(
    {
      create: async (input) => {
        const r: Recommendation = {
          id: nextId('rec'), tenantId: input.tenantId, reasoningStepId: input.reasoningStepId ?? null,
          category: input.category, title: input.title, description: input.description ?? null,
          priority: input.priority ?? 'medium', urgency: input.urgency ?? 'normal', confidence: input.confidence, impact: input.impact ?? null, expectedRoi: input.expectedRoi ?? null,
          cost: input.cost ?? null, risk: input.risk ?? null, dependencies: input.dependencies ?? [],
          status: 'pending', createdBy: input.createdBy, createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
        };
        db.recommendations[r.id] = r;
        return r;
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
        const d: Decision = {
          id: nextId('dec'), tenantId: input.tenantId, recommendationId: input.recommendationId ?? null,
          decidedBy: input.decidedBy, executorType: input.executorType, rationale: input.rationale,
          alternativesConsidered: input.alternativesConsidered ?? [], confidence: input.confidence ?? 0.5, explanation: input.explanation ?? null, trace: input.trace ?? [], status: input.status ?? 'approved',
          createdDate: new Date().toISOString(),
        };
        db.decisions[d.id] = d;
        return d;
      },
      findById: async (_t, id) => db.decisions[id] ?? null,
      list: async (t) => Object.values(db.decisions).filter((d) => d.tenantId === t),
    },
    {
      findById: async (_t, id) => db.recommendations[id] ?? null,
      updateStatus: async (_t, id, status) => { db.recommendations[id].status = status; return db.recommendations[id]; },
    },
    new ExecutorResolverService()
  );

  const esoRuntimeService = new EsoRuntimeService({
    queue: async (input) => {
      const e: EsoExecution = {
        id: nextId('exec'), tenantId: input.tenantId, esoId: input.esoId, decisionId: input.decisionId ?? null,
        status: 'queued', executedBy: input.executedBy, executorType: input.executorType, input: input.input ?? {},
        output: null, error: null, startedDate: null, completedDate: null, createdDate: new Date().toISOString(),
      };
      db.executions[e.id] = e;
      return e;
    },
    findById: async (_t, id) => db.executions[id] ?? null,
    findByEso: async (t, esoId) => Object.values(db.executions).filter((e) => e.tenantId === t && e.esoId === esoId),
    list: async (t) => Object.values(db.executions).filter((e) => e.tenantId === t),
    transition: async (_t, id, status, patch = {}) => {
      db.executions[id] = { ...db.executions[id], status, output: patch.output ?? db.executions[id].output, error: patch.error ?? db.executions[id].error };
      return db.executions[id];
    },
  });

  const outcomeService = new OutcomeService({
    create: async (input) => {
      const o: Outcome = {
        id: nextId('out'), tenantId: input.tenantId, decisionId: input.decisionId ?? null, result: input.result,
        metrics: input.metrics ?? {}, kpis: input.kpis ?? {}, evidenceIds: input.evidenceIds ?? [],
        feedback: input.feedback ?? null, confidence: input.confidence ?? 0.5, createdBy: input.createdBy,
        createdDate: new Date().toISOString(),
      };
      db.outcomes[o.id] = o;
      return o;
    },
    findById: async (_t, id) => db.outcomes[id] ?? null,
    findByDecision: async (t, decId) => Object.values(db.outcomes).filter((o) => o.tenantId === t && o.decisionId === decId),
    list: async (t) => Object.values(db.outcomes).filter((o) => o.tenantId === t),
  });

  const learningService = new LearningService(
    {
      create: async (input) => {
        const l: Learning = {
          id: nextId('learn'), tenantId: input.tenantId, outcomeId: input.outcomeId ?? null,
          mentalModelId: input.mentalModelId ?? null, pattern: input.pattern, description: input.description ?? null,
          confidence: input.confidence ?? 0.5, reusable: input.reusable ?? true, createdBy: input.createdBy,
          createdDate: new Date().toISOString(),
        };
        db.learnings[l.id] = l;
        return l;
      },
      list: async (t) => Object.values(db.learnings).filter((l) => l.tenantId === t),
      findReusable: async (t) => Object.values(db.learnings).filter((l) => l.tenantId === t && l.reusable),
    },
    { findById: async (_t, id) => db.outcomes[id] ?? null }
  );

  const TENANT = 't1', ORG = 'org1', USER = 'u1';

  const signal = await signalService.detect({
    tenantId: TENANT, orgId: ORG, source: 'capability', classification: 'territory_expansion',
    priority: 'high', createdBy: USER,
  });
  assert.equal(signal.status, 'new');

  await evidenceService.collect({
    tenantId: TENANT, signalId: signal.id, source: 'internal', evidenceType: 'sales_record',
    content: { territoriesWon: 2, revenue: 20000000 }, provenance: { confidence: 0.9 }, confidence: 0.9, createdBy: USER,
  });
  await evidenceService.collect({
    tenantId: TENANT, signalId: signal.id, source: 'competitor_data', evidenceType: 'market_report',
    content: { competitorWeakness: 'after-sales support' }, provenance: { confidence: 0.7 }, confidence: 0.7, createdBy: USER,
  });

  const step = await reasoningService.reason({
    tenantId: TENANT, signalId: signal.id,
    description: 'Rep won 2 territories; competitor weak on after-sales in adjacent territory X', createdBy: USER,
  });
  assert.ok(step.confidenceScore > 0.3, 'reasoning must be informed by evidence, not just the 0.3 base');

  const recommendation = await recommendationService.generate({
    tenantId: TENANT, reasoningStepId: step.id, category: 'opportunity',
    title: 'Expand into Territory X', createdBy: USER,
  });
  assert.equal(recommendation.status, 'pending');

  const decision = await decisionService.approve({
    tenantId: TENANT, recommendationId: recommendation.id, decidedBy: USER, rationale: 'Manager approved expansion',
  });
  assert.equal(decision.executorType, 'human', 'opportunity recommendations must resolve to human executor');
  assert.equal(db.recommendations[recommendation.id].status, 'approved');

  const execution = await esoRuntimeService.execute({
    tenantId: TENANT, esoId: 'eso-territory-expansion-v1', decisionId: decision.id, executedBy: USER, executorType: 'human',
  });
  await esoRuntimeService.transition(TENANT, execution.id, 'running', USER);
  const completed = await esoRuntimeService.transition(TENANT, execution.id, 'completed', USER, { output: { territoryLaunched: true } });
  assert.equal(completed.status, 'completed');

  const outcome = await outcomeService.capture({
    tenantId: TENANT, decisionId: decision.id, result: 'success',
    metrics: { revenueImpact: 14000000 }, confidence: 0.75, createdBy: USER,
  });
  assert.equal(outcome.result, 'success');

  const learning = await learningService.extract({
    tenantId: TENANT, outcomeId: outcome.id,
    pattern: 'Consultative bundling worked for Rahul Sharma in Territory X, contact rahul@company.com',
    createdBy: USER,
  });
  assert.equal(learning.reusable, true);
  assert.ok(!learning.pattern.includes('rahul@company.com'), 'email must be redacted before persisting as reusable knowledge');
  assert.ok(!learning.pattern.includes('Rahul Sharma'), 'person name must be generalized before persisting as reusable knowledge');

  assert.equal(Object.values(db.evidence)[0].signalId, signal.id);
  assert.equal(step.signalId, signal.id);
  assert.equal(recommendation.reasoningStepId, step.id);
  assert.equal(decision.recommendationId, recommendation.id);
  assert.equal(execution.decisionId, decision.id);
  assert.equal(outcome.decisionId, decision.id);
  assert.equal(learning.outcomeId, outcome.id);
});

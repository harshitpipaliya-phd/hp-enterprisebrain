import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CaseService } from '../src/case/case.service.js';
import { HypothesisService } from '../src/case/hypothesis.service.js';
import type { Case, CaseStatus, Hypothesis, CreateCaseInput, ProposeHypothesisInput } from '@hpbrain/database';

function createMockCaseRepo() {
  const store: Record<string, Case> = {};
  const evidenceLinks: Record<string, Set<string>> = {};
  let nextId = 1;
  return {
    create: async (input: CreateCaseInput): Promise<Case> => {
      const id = `case-${nextId++}`;
      const now = new Date().toISOString();
      const c: Case = {
        id, tenantId: input.tenantId, signalId: input.signalId ?? null, title: input.title,
        description: input.description ?? null, status: 'open', resolvedHypothesisId: null,
        createdBy: input.createdBy, createdDate: now, updatedDate: now,
      };
      store[id] = c;
      return c;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findBySignal: async (t: string, signalId: string) => Object.values(store).filter((c) => c.tenantId === t && c.signalId === signalId),
    list: async (t: string) => Object.values(store).filter((c) => c.tenantId === t),
    transition: async (_t: string, id: string, status: CaseStatus, resolvedHypothesisId?: string | null) => {
      const existing = store[id];
      if (!existing) return null;
      store[id] = { ...existing, status, resolvedHypothesisId: resolvedHypothesisId ?? existing.resolvedHypothesisId };
      return store[id];
    },
    linkEvidence: async (_t: string, caseId: string, evidenceId: string) => {
      evidenceLinks[caseId] = evidenceLinks[caseId] ?? new Set();
      evidenceLinks[caseId].add(evidenceId);
    },
    getLinkedEvidenceIds: async (_t: string, caseId: string) => [...(evidenceLinks[caseId] ?? [])],
  };
}

function createMockHypothesisRepo() {
  const store: Record<string, Hypothesis> = {};
  let nextId = 1;
  return {
    propose: async (input: ProposeHypothesisInput): Promise<Hypothesis> => {
      const id = `hyp-${nextId++}`;
      const h: Hypothesis = {
        id, tenantId: input.tenantId, caseId: input.caseId, statement: input.statement,
        rootCauseFamily: input.rootCauseFamily, confidence: input.confidence ?? 0.5, status: 'proposed',
        supportingEvidenceIds: input.supportingEvidenceIds ?? [], rejectedReason: null,
        proposedBy: input.proposedBy, createdDate: new Date().toISOString(),
      };
      store[id] = h;
      return h;
    },
    recordOutcome: async (tenantId: string, caseId: string, originalId: string, status: any, proposedBy: string, rejectedReason?: string, additionalEvidenceIds?: string[]) => {
      const original = store[originalId];
      if (!original) throw new Error('hypothesis_not_found');
      const id = `hyp-${nextId++}`;
      const merged = [...new Set([...original.supportingEvidenceIds, ...(additionalEvidenceIds ?? [])])];
      const h: Hypothesis = { ...original, id, status, rejectedReason: rejectedReason ?? null, supportingEvidenceIds: merged, proposedBy, createdDate: new Date().toISOString() };
      store[id] = h;
      return h;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findByCase: async (t: string, caseId: string) => Object.values(store).filter((h) => h.tenantId === t && h.caseId === caseId).sort((a, b) => a.createdDate.localeCompare(b.createdDate)),
  };
}

test('Case state machine: open -> investigating -> hypothesized -> resolved -> closed', async () => {
  const s = new CaseService(createMockCaseRepo() as any);
  const c = await s.open({ tenantId: 't1', title: 'Low homework completion in Class 8B', createdBy: 'u1' });
  assert.equal(c.status, 'open');

  const investigating = await s.transition('t1', c.id, 'investigating', 'u1');
  assert.equal(investigating.status, 'investigating');

  const hypothesized = await s.transition('t1', c.id, 'hypothesized', 'u1');
  assert.equal(hypothesized.status, 'hypothesized');

  const resolved = await s.transition('t1', c.id, 'resolved', 'u1', 'hyp-1');
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.resolvedHypothesisId, 'hyp-1');

  const closed = await s.transition('t1', c.id, 'closed', 'u1');
  assert.equal(closed.status, 'closed');
});

test('Case state machine rejects invalid transitions (cannot skip investigating)', async () => {
  const s = new CaseService(createMockCaseRepo() as any);
  const c = await s.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await assert.rejects(() => s.transition('t1', c.id, 'hypothesized', 'u1'), /invalid_transition/);
});

test('Case cannot be resolved without a confirmed hypothesis', async () => {
  const s = new CaseService(createMockCaseRepo() as any);
  const c = await s.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await s.transition('t1', c.id, 'investigating', 'u1');
  await s.transition('t1', c.id, 'hypothesized', 'u1');
  await assert.rejects(() => s.transition('t1', c.id, 'resolved', 'u1'), /resolved_requires_hypothesis/);
});

test('Proposing a hypothesis on an investigating case auto-advances it to hypothesized', async () => {
  const caseRepo = createMockCaseRepo();
  const caseService = new CaseService(caseRepo as any);
  const hypothesisService = new HypothesisService(createMockHypothesisRepo() as any, caseService);

  const c = await caseService.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await caseService.transition('t1', c.id, 'investigating', 'u1');

  await hypothesisService.propose({
    tenantId: 't1', caseId: c.id, statement: 'Motivation issue, not a Capability gap',
    rootCauseFamily: 'Motivation', proposedBy: 'u1',
  });

  const updated = await caseService.get('t1', c.id);
  assert.equal(updated!.status, 'hypothesized');
});

test('Rejecting a hypothesis requires a reason, and preserves the original in the ledger (append-only)', async () => {
  const caseRepo = createMockCaseRepo();
  const caseService = new CaseService(caseRepo as any);
  const hypothesisService = new HypothesisService(createMockHypothesisRepo() as any, caseService);

  const c = await caseService.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await caseService.transition('t1', c.id, 'investigating', 'u1');
  const hyp = await hypothesisService.propose({ tenantId: 't1', caseId: c.id, statement: 'Capability gap', rootCauseFamily: 'Capability', proposedBy: 'u1' });

  await assert.rejects(() => hypothesisService.reject('t1', c.id, hyp.id, '', 'u1'), /rejection_requires_reason/);

  const rejected = await hypothesisService.reject('t1', c.id, hyp.id, 'Diagnostic probe showed teacher had already covered the material', 'u1');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectedReason, 'Diagnostic probe showed teacher had already covered the material');

  const ledger = await hypothesisService.ledger('t1', c.id);
  assert.equal(ledger.length, 2, 'the ledger must contain both the original proposal and the rejection — nothing overwritten');
  assert.equal(ledger[0].status, 'proposed');
  assert.equal(ledger[1].status, 'rejected');
});

test('Confirming a hypothesis resolves the case, linking the resolvedHypothesisId', async () => {
  const caseRepo = createMockCaseRepo();
  const caseService = new CaseService(caseRepo as any);
  const hypothesisService = new HypothesisService(createMockHypothesisRepo() as any, caseService);

  const c = await caseService.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await caseService.transition('t1', c.id, 'investigating', 'u1');
  const hyp = await hypothesisService.propose({ tenantId: 't1', caseId: c.id, statement: 'Information gap', rootCauseFamily: 'Information', proposedBy: 'u1' });

  const confirmed = await hypothesisService.confirm('t1', c.id, hyp.id, 'u1');
  assert.equal(confirmed.status, 'confirmed');

  const resolvedCase = await caseService.get('t1', c.id);
  assert.equal(resolvedCase!.status, 'resolved');
  assert.equal(resolvedCase!.resolvedHypothesisId, confirmed.id);
});

test('Evidence attaches to a case and is retrievable', async () => {
  const s = new CaseService(createMockCaseRepo() as any);
  const c = await s.open({ tenantId: 't1', title: 'Test case', createdBy: 'u1' });
  await s.attachEvidence('t1', c.id, 'ev-1', 'u1');
  await s.attachEvidence('t1', c.id, 'ev-2', 'u1');
  const linked = await s.linkedEvidence('t1', c.id);
  assert.equal(linked.length, 2);
});

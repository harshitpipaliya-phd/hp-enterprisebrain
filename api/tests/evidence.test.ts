import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceService } from '../src/evidence/evidence.service.js';
import type { Evidence, CreateEvidenceInput } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Evidence> = {};
  let nextId = 1;
  return {
    create: async (input: CreateEvidenceInput): Promise<Evidence> => {
      const id = `ev-${nextId++}`;
      const e: Evidence = {
        id, tenantId: input.tenantId, signalId: input.signalId ?? null, source: input.source,
        evidenceType: input.evidenceType ?? 'observation', content: input.content, provenance: input.provenance,
        confidence: input.confidence ?? 0.5, hash: 'deadbeef', version: 1, status: 'active', observedDate: new Date().toISOString(),
        createdBy: input.createdBy, createdDate: new Date().toISOString(),
      };
      store[id] = e;
      return e;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findBySignal: async (tenantId: string, signalId: string) =>
      Object.values(store).filter((e) => e.tenantId === tenantId && e.signalId === signalId),
    list: async (tenantId: string) => Object.values(store).filter((e) => e.tenantId === tenantId),
  };
}

test('EvidenceService.collect stores evidence with provenance', async () => {
  const s = new EvidenceService(createMockRepo() as any);
  const e = await s.collect({
    tenantId: 't1', signalId: 'sig-1', source: 'competitor_data',
    content: { note: 'competitor weak on after-sales' },
    provenance: { source: 'market-report', confidence: 0.7 },
    createdBy: 'u1',
  });
  assert.equal(e.tenantId, 't1');
  assert.equal(e.signalId, 'sig-1');
  assert.ok(e.hash);
});

test('EvidenceService.forSignal returns only matching evidence', async () => {
  const repo = createMockRepo();
  const s = new EvidenceService(repo as any);
  await repo.create({ tenantId: 't1', signalId: 'sig-1', source: 'internal', content: {}, provenance: {}, createdBy: 'u1' });
  await repo.create({ tenantId: 't1', signalId: 'sig-2', source: 'internal', content: {}, provenance: {}, createdBy: 'u1' });
  const results = await s.forSignal('t1', 'sig-1');
  assert.equal(results.length, 1);
});

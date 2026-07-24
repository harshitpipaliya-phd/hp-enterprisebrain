import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignalService } from '../src/signal/signal.service.js';
import { eventBus, SignalEvents } from '@hpbrain/events';
import type { Signal, CreateSignalInput, SignalStatus } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Signal> = {};
  let nextId = 1;

  return {
    create: async (input: CreateSignalInput): Promise<Signal> => {
      const id = `sig-${nextId++}`;
      const now = new Date().toISOString();
      const signal: Signal = {
        id,
        tenantId: input.tenantId,
        orgId: input.orgId,
        departmentId: input.departmentId ?? null,
        source: input.source,
        classification: input.classification ?? 'unclassified',
        priority: input.priority ?? 'normal',
        severity: input.severity ?? 'low',
        confidence: input.confidence ?? 0.5,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        status: 'new',
        metadata: input.metadata ?? {},
        createdBy: input.createdBy,
        createdDate: now,
        updatedDate: now,
      };
      store[id] = signal;
      return signal;
    },
    findById: async (_tenantId: string, id: string): Promise<Signal | null> => store[id] ?? null,
    list: async (tenantId: string, orgId?: string, status?: SignalStatus): Promise<Signal[]> =>
      Object.values(store).filter(
        (s) => s.tenantId === tenantId && (!orgId || s.orgId === orgId) && (!status || s.status === status)
      ),
    updateStatus: async (_tenantId: string, id: string, patch: { status: SignalStatus }): Promise<Signal | null> => {
      const existing = store[id];
      if (!existing) return null;
      const updated = { ...existing, status: patch.status, updatedDate: new Date().toISOString() };
      store[id] = updated;
      return updated;
    },
  };
}

test('SignalService.detect creates a signal with default severity/confidence', async () => {
  const s = new SignalService(createMockRepo() as any);
  const signal = await s.detect({ tenantId: 't1', orgId: 'o1', source: 'attendance', createdBy: 'u1' });
  assert.equal(signal.tenantId, 't1');
  assert.equal(signal.source, 'attendance');
  assert.equal(signal.severity, 'low');
  assert.equal(signal.confidence, 0.5);
  assert.equal(signal.status, 'new');
  assert.ok(signal.id);
});

test('SignalService.detect emits SignalDetected event', async () => {
  const s = new SignalService(createMockRepo() as any);
  let captured: any = null;
  const handler = (e: any) => { captured = e; };
  eventBus.on(SignalEvents.Detected, handler);
  try {
    const signal = await s.detect({ tenantId: 't1', orgId: 'o1', source: 'performance', createdBy: 'u1' });
    assert.ok(captured);
    assert.equal(captured.type, SignalEvents.Detected);
    assert.equal(captured.entityId, signal.id);
    assert.equal(captured.tenantId, 't1');
  } finally {
    eventBus.off(SignalEvents.Detected, handler);
  }
});

test('SignalService.list filters by tenant and status', async () => {
  const repo = createMockRepo();
  const s = new SignalService(repo as any);
  await repo.create({ tenantId: 't1', orgId: 'o1', source: 'leave', createdBy: 'u1' });
  await repo.create({ tenantId: 't1', orgId: 'o1', source: 'tasks', createdBy: 'u1' });
  await repo.create({ tenantId: 't2', orgId: 'o2', source: 'leave', createdBy: 'u1' });
  const results = await s.list('t1');
  assert.equal(results.length, 2);
});

test('SignalService.changeStatus updates status and emits SignalStatusChanged', async () => {
  const repo = createMockRepo();
  const s = new SignalService(repo as any);
  const created = await repo.create({ tenantId: 't1', orgId: 'o1', source: 'capability', createdBy: 'u1' });
  let captured: any = null;
  const handler = (e: any) => { captured = e; };
  eventBus.on(SignalEvents.StatusChanged, handler);
  try {
    const updated = await s.changeStatus('t1', created.id, 'triaged', 'u2');
    assert.equal(updated?.status, 'triaged');
    assert.ok(captured);
    assert.equal(captured.payload.from, 'new');
    assert.equal(captured.payload.to, 'triaged');
  } finally {
    eventBus.off(SignalEvents.StatusChanged, handler);
  }
});

test('SignalService.changeStatus returns null for unknown signal', async () => {
  const s = new SignalService(createMockRepo() as any);
  const result = await s.changeStatus('t1', 'nonexistent', 'triaged', 'u1');
  assert.equal(result, null);
});

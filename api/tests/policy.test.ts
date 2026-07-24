import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PolicyService } from '../src/policy/policy.service.js';
import type { Policy, CreatePolicyInput, PolicyRule } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Policy> = {};
  let nextId = 1;
  return {
    create: async (input: CreatePolicyInput): Promise<Policy> => {
      const id = `pol-${nextId++}`;
      const p: Policy = {
        id, tenantId: input.tenantId, name: input.name, scope: input.scope, policyType: input.policyType,
        allowedExecutorClasses: input.allowedExecutorClasses ?? [], trustLevels: input.trustLevels ?? [],
        routingCriteria: input.routingCriteria ?? {}, escalationPath: input.escalationPath ?? [],
        rules: input.rules ?? [], version: 1, previousVersionId: null, status: 'active',
        createdBy: input.createdBy, createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
      };
      store[id] = p;
      return p;
    },
    createVersion: async (tenantId: string, previousId: string, rules: PolicyRule[], createdBy: string): Promise<Policy> => {
      const previous = store[previousId];
      if (!previous) throw new Error('policy_not_found');
      const id = `pol-${nextId++}`;
      const p: Policy = { ...previous, id, rules, version: previous.version + 1, previousVersionId: previousId, createdBy };
      store[id] = p;
      return p;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    list: async (tenantId: string) => Object.values(store).filter((p) => p.tenantId === tenantId),
    history: async (tenantId: string, policyId: string) => {
      const chain: Policy[] = [];
      let current: Policy | null = store[policyId] ?? null;
      while (current) {
        chain.unshift(current);
        current = current.previousVersionId ? store[current.previousVersionId] ?? null : null;
      }
      return chain;
    },
  };
}

test('PolicyService.evaluate matches rules against a context object', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const policy = await s.create({
    tenantId: 't1', name: 'Compliance Gate', scope: 'recommendations', policyType: 'business_rule',
    rules: [
      { field: 'recommendation.category', operator: 'eq', value: 'compliance', action: 'require_human_approval' },
      { field: 'recommendation.confidence', operator: 'gte', value: 0.8, action: 'auto_approve_eligible' },
    ],
    createdBy: 'u1',
  });
  const result = s.evaluate(policy, { recommendation: { category: 'compliance', confidence: 0.9 } });
  assert.equal(result.matched.length, 2);
  assert.ok(result.actions.includes('require_human_approval'));
  assert.ok(result.actions.includes('auto_approve_eligible'));
});

test('PolicyService.evaluate does not match rules with no eval/Function - safe field traversal only', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const policy = await s.create({
    tenantId: 't1', name: 'Test', scope: 'x', policyType: 'business_rule',
    rules: [{ field: 'recommendation.category', operator: 'eq', value: 'risk', action: 'escalate' }],
    createdBy: 'u1',
  });
  const result = s.evaluate(policy, { recommendation: { category: 'opportunity' } });
  assert.equal(result.matched.length, 0);
});

test('PolicyService.evaluate supports AND composition across multiple conditions', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const policy = await s.create({
    tenantId: 't1', name: 'High-confidence compliance only', scope: 'recommendations', policyType: 'business_rule',
    rules: [{
      conditions: [
        { field: 'recommendation.category', operator: 'eq', value: 'compliance' },
        { field: 'recommendation.confidence', operator: 'gte', value: 0.8 },
      ],
      match: 'all',
      action: 'auto_approve',
    }],
    createdBy: 'u1',
  });
  const matched = s.evaluate(policy, { recommendation: { category: 'compliance', confidence: 0.9 } });
  assert.equal(matched.matched.length, 1);
  const notMatched = s.evaluate(policy, { recommendation: { category: 'compliance', confidence: 0.5 } });
  assert.equal(notMatched.matched.length, 0, 'AND requires both conditions; confidence too low should fail the rule');
});

test('PolicyService.evaluate supports OR composition across multiple conditions', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const policy = await s.create({
    tenantId: 't1', name: 'Urgent categories', scope: 'recommendations', policyType: 'business_rule',
    rules: [{
      conditions: [
        { field: 'recommendation.category', operator: 'eq', value: 'compliance' },
        { field: 'recommendation.category', operator: 'eq', value: 'risk' },
      ],
      match: 'any',
      action: 'escalate',
    }],
    createdBy: 'u1',
  });
  const matched = s.evaluate(policy, { recommendation: { category: 'risk' } });
  assert.equal(matched.matched.length, 1, 'OR should match if either condition is true');
});

test('PolicyService.evaluate: the original flat form still works unchanged after adding composite support', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const policy = await s.create({
    tenantId: 't1', name: 'Legacy flat rule', scope: 'x', policyType: 'business_rule',
    rules: [{ field: 'recommendation.category', operator: 'eq', value: 'risk', action: 'escalate' }],
    createdBy: 'u1',
  });
  const matched = s.evaluate(policy, { recommendation: { category: 'risk' } });
  assert.equal(matched.matched.length, 1);
});

test('PolicyService.createVersion preserves the previous version and links to it', async () => {
  const s = new PolicyService(createMockRepo() as any);
  const v1 = await s.create({
    tenantId: 't1', name: 'Gate', scope: 'x', policyType: 'business_rule',
    rules: [{ field: 'a', operator: 'eq', value: 1, action: 'x' }], createdBy: 'u1',
  });
  const v2 = await s.createVersion('t1', v1.id, [{ field: 'a', operator: 'eq', value: 2, action: 'y' }], 'u1');
  assert.equal(v2.version, 2);
  assert.equal(v2.previousVersionId, v1.id);
  const history = await s.history('t1', v2.id);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, v1.id);
  assert.equal(history[1].id, v2.id);
});

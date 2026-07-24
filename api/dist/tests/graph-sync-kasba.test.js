import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCapabilityForGraph } from '../src/graph/graph.sync.service.js';
test('flattenCapabilityForGraph produces no nested objects anywhere in its output — the actual bug this fixes', () => {
    const result = flattenCapabilityForGraph({
        id: 'c1', tenantId: 't1', name: 'Leadership',
        knowledge: { targetLevel: 4, currentLevel: 2, evidenceRequired: true },
        ability: { targetLevel: 3, currentLevel: null, evidenceRequired: false },
        skill: null,
    });
    for (const [key, value] of Object.entries(result)) {
        const isRealNestedObject = value !== null && typeof value === 'object';
        assert.equal(isRealNestedObject, false, `${key} is still a real nested object — Neo4j would reject this (null itself is fine)`);
    }
});
test('flattenCapabilityForGraph correctly flattens a real KasbaElement into scalar properties', () => {
    const result = flattenCapabilityForGraph({
        id: 'c1', tenantId: 't1',
        knowledge: { targetLevel: 4, currentLevel: 2, evidenceRequired: true },
    });
    assert.equal(result.knowledgeTargetLevel, 4);
    assert.equal(result.knowledgeCurrentLevel, 2);
    assert.equal(result.knowledgeEvidenceRequired, true);
});
test('flattenCapabilityForGraph handles a null KASBA dimension without throwing or producing a nested null object', () => {
    const result = flattenCapabilityForGraph({ id: 'c1', tenantId: 't1', knowledge: null });
    assert.equal('knowledgeTargetLevel' in result, false);
});
test('flattenCapabilityForGraph preserves real scalar fields unchanged', () => {
    const result = flattenCapabilityForGraph({ id: 'c1', tenantId: 't1', capabilityCode: 'CAP1', name: 'Leadership', version: 2 });
    assert.equal(result.capabilityCode, 'CAP1');
    assert.equal(result.name, 'Leadership');
    assert.equal(result.version, 2);
});
test('flattenCapabilityForGraph handles all five real KASBA dimensions at once, matching the real Capability shape', () => {
    const element = { targetLevel: 3, currentLevel: 3, evidenceRequired: false };
    const result = flattenCapabilityForGraph({
        id: 'c1', tenantId: 't1',
        knowledge: element, ability: element, skill: element, behaviour: element, attitude: element,
    });
    for (const dim of ['knowledge', 'ability', 'skill', 'behaviour', 'attitude']) {
        assert.equal(result[`${dim}TargetLevel`], 3, `${dim} should be flattened`);
    }
});

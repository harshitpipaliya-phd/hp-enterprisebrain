import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PromptTemplateRepository } from '@hpbrain/database';
function mockTemplate(template) {
    return { id: 't1', tenantId: 'tenant1', name: 'test', template, variables: [], version: 1, previousVersionId: null, status: 'active', createdBy: 'u1', createdDate: new Date().toISOString() };
}
test('PromptTemplateRepository.render substitutes known variables', () => {
    const repo = new PromptTemplateRepository();
    const rendered = repo.render(mockTemplate('Analyze the {{entityType}} case: {{caseTitle}}'), { entityType: 'fee collection', caseTitle: 'Grade 9 shortfall' });
    assert.equal(rendered, 'Analyze the fee collection case: Grade 9 shortfall');
});
test('PromptTemplateRepository.render leaves unknown variables as placeholders rather than silently dropping them', () => {
    const repo = new PromptTemplateRepository();
    const rendered = repo.render(mockTemplate('Case: {{caseTitle}}, Domain: {{missingVar}}'), { caseTitle: 'Test' });
    assert.equal(rendered, 'Case: Test, Domain: {{missingVar}}');
});
test('PromptTemplateRepository.render handles a template with no variables', () => {
    const repo = new PromptTemplateRepository();
    const rendered = repo.render(mockTemplate('A static prompt with no placeholders'), {});
    assert.equal(rendered, 'A static prompt with no placeholders');
});

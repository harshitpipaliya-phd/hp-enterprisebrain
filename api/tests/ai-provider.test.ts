import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAIProvider, listAvailableProviders } from '../src/ai/provider.factory.js';
import { ProviderNotConfiguredError, type AIProvider, type ChatMessage, type ChatResult, type EmbeddingResult } from '../src/ai/provider.interface.js';
import { EvidenceSummarizerService } from '../src/ai/evidence-summarizer.service.js';
import { DecisionExplainerService } from '../src/ai/decision-explainer.service.js';
import { RecommendationImproverService } from '../src/ai/recommendation-improver.service.js';
import { AnthropicProvider } from '../src/ai/providers/anthropic.provider.js';
import { OpenAIProvider } from '../src/ai/providers/openai.provider.js';

test('getAIProvider switches based on AI_PROVIDER env var', () => {
  const original = process.env.AI_PROVIDER;
  try {
    process.env.AI_PROVIDER = 'openai';
    assert.equal(getAIProvider().name, 'openai');
    process.env.AI_PROVIDER = 'gemini';
    assert.equal(getAIProvider().name, 'gemini');
    process.env.AI_PROVIDER = 'ollama';
    assert.equal(getAIProvider().name, 'ollama');
  } finally {
    if (original) process.env.AI_PROVIDER = original; else delete process.env.AI_PROVIDER;
  }
});

test('getAIProvider falls back to a real (unconfigured) provider when AI_PROVIDER is unset', () => {
  const original = process.env.AI_PROVIDER;
  try {
    delete process.env.AI_PROVIDER;
    const provider = getAIProvider();
    assert.ok(provider.name, 'must return a real provider object, not null/undefined');
  } finally {
    if (original) process.env.AI_PROVIDER = original;
  }
});

test('listAvailableProviders reports all 5 requested providers', () => {
  const providers = listAvailableProviders();
  const names = providers.map((p) => p.name);
  assert.ok(names.includes('anthropic'));
  assert.ok(names.includes('openai'));
  assert.ok(names.includes('azure-openai'));
  assert.ok(names.includes('gemini'));
  assert.ok(names.includes('ollama'));
});

test('Anthropic and OpenAI providers correctly report unavailable when no API key is set in this environment', () => {
  const anthropic = new AnthropicProvider();
  const openai = new OpenAIProvider();
  assert.equal(anthropic.available, !!process.env.ANTHROPIC_API_KEY);
  assert.equal(openai.available, !!process.env.OPENAI_API_KEY);
});

test('An unconfigured provider throws ProviderNotConfiguredError, not a fake response', async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const provider = new AnthropicProvider();
    await assert.rejects(() => provider.chat([{ role: 'user', content: 'test' }]), ProviderNotConfiguredError);
  } finally {
    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  }
});

class MockProvider implements AIProvider {
  readonly name = 'mock';
  readonly available = true;
  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    return { content: `Summary of: ${messages[messages.length - 1].content.slice(0, 20)}`, model: 'mock-model', provider: 'mock', inputTokens: 10, outputTokens: 5, latencyMs: 1 };
  }
  async embed(): Promise<EmbeddingResult> {
    return { vector: [0.1, 0.2], model: 'mock-embed', provider: 'mock' };
  }
}

function mockExecutionRepo() {
  const logs: any[] = [];
  return { log: async (input: any) => { logs.push(input); return { ...input, id: 'exec-1', createdDate: new Date().toISOString() }; }, logs };
}

test('EvidenceSummarizerService.summarize returns a real summary and logs a success execution', async () => {
  const repo = mockExecutionRepo();
  const service = new EvidenceSummarizerService(new MockProvider(), repo as any);
  const result = await service.summarize('t1', 'u1', 'Fee payments dropped 20% in Grade 9 this month.', 'ev-1');
  assert.ok('summary' in result);
  assert.ok((result as any).summary.length > 0);
  assert.equal(repo.logs.length, 1);
  assert.equal(repo.logs[0].status, 'success');
  assert.equal(repo.logs[0].entityId, 'ev-1');
});

test('EvidenceSummarizerService.summarize handles ProviderNotConfiguredError gracefully', async () => {
  const repo = mockExecutionRepo();
  const unconfigured: AIProvider = {
    name: 'unconfigured-test',
    available: false,
    chat: async () => { throw new ProviderNotConfiguredError('unconfigured-test', 'TEST_API_KEY'); },
    embed: async () => { throw new ProviderNotConfiguredError('unconfigured-test', 'TEST_API_KEY'); },
  };
  const service = new EvidenceSummarizerService(unconfigured, repo as any);
  const result = await service.summarize('t1', 'u1', 'Some evidence.');
  assert.ok('error' in result);
  assert.equal((result as any).providerConfigured, false);
  assert.equal(repo.logs[0].status, 'not_configured');
});

test('DecisionExplainerService.explain grounds the prompt in the real decision data, not free-form', async () => {
  const repo = mockExecutionRepo();
  let capturedPrompt = '';
  const capturingProvider: AIProvider = {
    name: 'mock', available: true,
    chat: async (messages) => { capturedPrompt = messages[messages.length - 1].content; return { content: 'Explained.', model: 'mock', provider: 'mock', inputTokens: 1, outputTokens: 1, latencyMs: 1 }; },
    embed: async () => { throw new Error('not used'); },
  };
  const service = new DecisionExplainerService(capturingProvider, repo as any);
  const result = await service.explain('t1', 'u1', { rationale: 'Confirmed root cause was Motivation', confidence: 0.85, executorType: 'human', trace: [] }, 'dec-1');
  assert.ok('explanation' in result);
  assert.match(capturedPrompt, /Motivation/, 'the actual decision rationale must reach the prompt, not a generic template');
  assert.equal(repo.logs[0].entityType, 'Decision');
});

test('DecisionExplainerService.explain logs not_configured on an unconfigured provider, same as EvidenceSummarizer', async () => {
  const repo = mockExecutionRepo();
  const unconfigured: AIProvider = {
    name: 'unconfigured-test', available: false,
    chat: async () => { throw new ProviderNotConfiguredError('unconfigured-test', 'TEST_API_KEY'); },
    embed: async () => { throw new ProviderNotConfiguredError('unconfigured-test', 'TEST_API_KEY'); },
  };
  const service = new DecisionExplainerService(unconfigured, repo as any);
  const result = await service.explain('t1', 'u1', { rationale: 'x', confidence: 0.5, executorType: 'human', trace: [] });
  assert.ok('error' in result);
  assert.equal(repo.logs[0].status, 'not_configured');
});

test('RecommendationImproverService.improve returns a real suggestion and logs against the Recommendation entity', async () => {
  const repo = mockExecutionRepo();
  const service = new RecommendationImproverService(new MockProvider(), repo as any);
  const result = await service.improve('t1', 'u1', { title: 'Send reminder', description: null, category: 'risk', priority: 'high', confidence: 0.7 }, 'rec-1');
  assert.ok('suggestion' in result);
  assert.equal(repo.logs[0].entityType, 'Recommendation');
  assert.equal(repo.logs[0].entityId, 'rec-1');
});

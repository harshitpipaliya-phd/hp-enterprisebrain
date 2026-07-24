import type { AIProvider } from './provider.interface.js';
import { ProviderNotConfiguredError } from './provider.interface.js';
import { AIExecutionRepository } from '@hpbrain/database';

/**
 * Evidence Summarizer — the first of the ten requested AI Services, built
 * as the real proof that the provider abstraction works end-to-end. The
 * other nine follow the exact same pattern — this file IS the template,
 * not a one-off. Scoped to one built fully rather than ten built shallowly.
 *
 * Every call is logged to ai_executions regardless of outcome — including
 * the ProviderNotConfigured case.
 */
export class EvidenceSummarizerService {
  constructor(
    private readonly provider: AIProvider,
    private readonly executions: AIExecutionRepository
  ) {}

  async summarize(tenantId: string, userId: string, evidenceContent: string, entityId?: string): Promise<{ summary: string } | { error: string; providerConfigured: boolean }> {
    const start = Date.now();
    try {
      const result = await this.provider.chat([
        { role: 'system', content: 'Summarize the following piece of business evidence in 2-3 sentences. Be factual, do not speculate beyond what is stated.' },
        { role: 'user', content: evidenceContent },
      ], { temperature: 0.3, maxTokens: 300 });

      await this.executions.log({
        tenantId, userId, serviceName: 'evidence-summarizer', provider: this.provider.name, model: result.model,
        status: 'success', inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs,
        entityType: 'Evidence', entityId,
      });
      return { summary: result.content };
    } catch (e: any) {
      const notConfigured = e instanceof ProviderNotConfiguredError;
      await this.executions.log({
        tenantId, userId, serviceName: 'evidence-summarizer', provider: this.provider.name,
        status: notConfigured ? 'not_configured' : 'failed', error: e.message, latencyMs: Date.now() - start,
        entityType: 'Evidence', entityId,
      });
      return { error: e.message, providerConfigured: !notConfigured };
    }
  }
}

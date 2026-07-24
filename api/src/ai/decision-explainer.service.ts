import type { AIProvider } from './provider.interface.js';
import { ProviderNotConfiguredError } from './provider.interface.js';
import { AIExecutionRepository } from '@hpbrain/database';

/**
 * Decision Explainer — second AI Service, same template as
 * EvidenceSummarizerService. Explains a Decision in plain language from its
 * real rationale/confidence/trace, grounded in recorded data, not invented.
 */
export class DecisionExplainerService {
  constructor(
    private readonly provider: AIProvider,
    private readonly executions: AIExecutionRepository
  ) {}

  async explain(
    tenantId: string, userId: string,
    decision: { rationale: string; confidence: number; executorType: string; trace: unknown[] },
    entityId?: string
  ): Promise<{ explanation: string } | { error: string; providerConfigured: boolean }> {
    const start = Date.now();
    try {
      const result = await this.provider.chat([
        { role: 'system', content: 'Explain the following business decision in 2-3 plain-language sentences for a non-technical stakeholder. Ground your explanation only in the provided rationale, confidence, and trace — do not invent justification not present in the data.' },
        { role: 'user', content: `Rationale: ${decision.rationale}\nConfidence: ${decision.confidence}\nExecuted by: ${decision.executorType}\nTrace: ${JSON.stringify(decision.trace)}` },
      ], { temperature: 0.3, maxTokens: 300 });

      await this.executions.log({
        tenantId, userId, serviceName: 'decision-explainer', provider: this.provider.name, model: result.model,
        status: 'success', inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs,
        entityType: 'Decision', entityId,
      });
      return { explanation: result.content };
    } catch (e: any) {
      const notConfigured = e instanceof ProviderNotConfiguredError;
      await this.executions.log({
        tenantId, userId, serviceName: 'decision-explainer', provider: this.provider.name,
        status: notConfigured ? 'not_configured' : 'failed', error: e.message, latencyMs: Date.now() - start,
        entityType: 'Decision', entityId,
      });
      return { error: e.message, providerConfigured: !notConfigured };
    }
  }
}

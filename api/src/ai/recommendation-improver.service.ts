import type { AIProvider } from './provider.interface.js';
import { ProviderNotConfiguredError } from './provider.interface.js';
import { AIExecutionRepository } from '@hpbrain/database';

/**
 * Recommendation Improver — third AI Service, same template. Suggests a
 * sharper title/description, grounded in category/priority/confidence.
 */
export class RecommendationImproverService {
  constructor(
    private readonly provider: AIProvider,
    private readonly executions: AIExecutionRepository
  ) {}

  async improve(
    tenantId: string, userId: string,
    recommendation: { title: string; description: string | null; category: string; priority: string; confidence: number },
    entityId?: string
  ): Promise<{ suggestion: string } | { error: string; providerConfigured: boolean }> {
    const start = Date.now();
    try {
      const result = await this.provider.chat([
        { role: 'system', content: 'Suggest a clearer, more actionable title and one-sentence description for this business recommendation. Keep the same category and intent — improve clarity and specificity only.' },
        { role: 'user', content: `Title: ${recommendation.title}\nDescription: ${recommendation.description ?? '(none)'}\nCategory: ${recommendation.category}\nPriority: ${recommendation.priority}\nConfidence: ${recommendation.confidence}` },
      ], { temperature: 0.4, maxTokens: 200 });

      await this.executions.log({
        tenantId, userId, serviceName: 'recommendation-improver', provider: this.provider.name, model: result.model,
        status: 'success', inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs,
        entityType: 'Recommendation', entityId,
      });
      return { suggestion: result.content };
    } catch (e: any) {
      const notConfigured = e instanceof ProviderNotConfiguredError;
      await this.executions.log({
        tenantId, userId, serviceName: 'recommendation-improver', provider: this.provider.name,
        status: notConfigured ? 'not_configured' : 'failed', error: e.message, latencyMs: Date.now() - start,
        entityType: 'Recommendation', entityId,
      });
      return { error: e.message, providerConfigured: !notConfigured };
    }
  }
}

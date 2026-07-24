import type { AIProvider, ChatMessage, ChatOptions, ChatResult, EmbeddingResult } from '../provider.interface.js';
import { ProviderNotConfiguredError } from '../provider.interface.js';

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';

/**
 * OpenAI adapter. Real Chat Completions + Embeddings calls. Also serves
 * Azure OpenAI: set OPENAI_BASE_URL to the Azure endpoint — same wire
 * format, one adapter, not a duplicated one for Azure as a separate
 * provider (Azure OpenAI's Chat Completions API is OpenAI-compatible).
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  get available(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  private baseUrl(): string {
    return process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    if (!this.available) throw new ProviderNotConfiguredError(this.name, 'OPENAI_API_KEY');
    const start = Date.now();

    const res = await fetch(`${this.baseUrl()}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${body}`);
    }
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model,
      provider: this.name,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.available) throw new ProviderNotConfiguredError(this.name, 'OPENAI_API_KEY');
    const res = await fetch(`${this.baseUrl()}/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: DEFAULT_EMBED_MODEL, input: text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI embeddings error (${res.status}): ${body}`);
    }
    const data = await res.json();
    return { vector: data.data[0].embedding, model: data.model, provider: this.name };
  }
}

import type { AIProvider, ChatMessage, ChatOptions, ChatResult, EmbeddingResult } from '../provider.interface.js';
import { ProviderNotConfiguredError } from '../provider.interface.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';

/** Gemini adapter. Real generateContent API — Gemini uses 'model' not 'assistant' for its role field, handled here. */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  get available(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    if (!this.available) throw new ProviderNotConfiguredError(this.name, 'GEMINI_API_KEY');
    const start = Date.now();
    const model = options.model ?? DEFAULT_MODEL;
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          generationConfig: { temperature: options.temperature, maxOutputTokens: options.maxTokens },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${body}`);
    }
    const data = await res.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      model,
      provider: this.name,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      latencyMs: Date.now() - start,
    };
  }

  async embed(): Promise<EmbeddingResult> {
    throw new Error('GeminiProvider.embed() not implemented in this pass — Gemini has a real embeddings API (embedContent), scoped out to keep this addition bounded.');
  }
}

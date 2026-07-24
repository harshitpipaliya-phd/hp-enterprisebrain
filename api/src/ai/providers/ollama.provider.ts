import type { AIProvider, ChatMessage, ChatOptions, ChatResult, EmbeddingResult } from '../provider.interface.js';
import { ProviderNotConfiguredError } from '../provider.interface.js';

const DEFAULT_MODEL = 'llama3';

/**
 * Ollama adapter (local LLM). No API key — gated on OLLAMA_BASE_URL being
 * explicitly set, so it's opt-in rather than silently attempted against
 * localhost:11434 everywhere.
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  get available(): boolean {
    return !!process.env.OLLAMA_BASE_URL;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    if (!this.available) throw new ProviderNotConfiguredError(this.name, 'OLLAMA_BASE_URL');
    const start = Date.now();
    const model = options.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;

    const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        options: { temperature: options.temperature },
        stream: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama error (${res.status}): ${body}`);
    }
    const data = await res.json();
    return {
      content: data.message?.content ?? '',
      model,
      provider: this.name,
      inputTokens: data.prompt_eval_count ?? 0,
      outputTokens: data.eval_count ?? 0,
      latencyMs: Date.now() - start,
    };
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.available) throw new ProviderNotConfiguredError(this.name, 'OLLAMA_BASE_URL');
    const model = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';
    const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
    });
    if (!res.ok) throw new Error(`Ollama embeddings error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return { vector: data.embedding, model, provider: this.name };
  }
}

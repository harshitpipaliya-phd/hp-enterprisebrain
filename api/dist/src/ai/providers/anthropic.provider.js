import { ProviderNotConfiguredError } from '../provider.interface.js';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
/**
 * Anthropic adapter. Real, not a stub — if ANTHROPIC_API_KEY is set, this
 * genuinely calls the Messages API correctly. If it isn't, every call
 * throws ProviderNotConfiguredError immediately, not a fake response.
 */
export class AnthropicProvider {
    name = 'anthropic';
    get available() {
        return !!process.env.ANTHROPIC_API_KEY;
    }
    async chat(messages, options = {}) {
        if (!this.available)
            throw new ProviderNotConfiguredError(this.name, 'ANTHROPIC_API_KEY');
        const start = Date.now();
        const system = messages.find((m) => m.role === 'system')?.content;
        const rest = messages.filter((m) => m.role !== 'system');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: options.model ?? DEFAULT_MODEL,
                max_tokens: options.maxTokens ?? 1024,
                temperature: options.temperature,
                ...(system ? { system } : {}),
                messages: rest.map((m) => ({ role: m.role, content: m.content })),
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Anthropic API error (${res.status}): ${body}`);
        }
        const data = await res.json();
        return {
            content: data.content?.[0]?.text ?? '',
            model: data.model,
            provider: this.name,
            inputTokens: data.usage?.input_tokens ?? 0,
            outputTokens: data.usage?.output_tokens ?? 0,
            latencyMs: Date.now() - start,
        };
    }
    async embed() {
        throw new Error('AnthropicProvider does not support embeddings — Anthropic has no embeddings API. Use a different provider for embed().');
    }
}

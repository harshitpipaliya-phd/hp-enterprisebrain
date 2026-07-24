import type { AIProvider } from './provider.interface.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OllamaProvider } from './providers/ollama.provider.js';

const PROVIDERS: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  openai: () => new OpenAIProvider(),
  'azure-openai': () => new OpenAIProvider(), // same adapter — set OPENAI_BASE_URL to the Azure endpoint
  gemini: () => new GeminiProvider(),
  ollama: () => new OllamaProvider(),
};

/**
 * The actual vendor-independence mechanism. AI_PROVIDER selects which
 * adapter every AI Service gets — nothing downstream imports a provider
 * class directly. Switching providers is an environment variable, not a
 * code change.
 */
export function getAIProvider(): AIProvider {
  const selected = process.env.AI_PROVIDER?.toLowerCase();
  const factory = selected ? PROVIDERS[selected] : undefined;
  if (!factory) {
    return PROVIDERS.anthropic();
  }
  return factory();
}

export function listAvailableProviders(): Array<{ name: string; available: boolean }> {
  return Object.keys(PROVIDERS).map((name) => ({ name, available: PROVIDERS[name]().available }));
}

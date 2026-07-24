/**
 * AI Provider abstraction (AI Intelligence Integration Sprint).
 *
 * The whole point of this interface: no business logic anywhere in this
 * codebase should ever import an OpenAI/Anthropic/Gemini SDK directly.
 * Every AI Service depends only on this interface. Swapping providers is a
 * config change (AI_PROVIDER env var), not a code change.
 *
 * Scoped honestly to chat() and embed() — the two primitives every
 * downstream AI Service actually needs — rather than implementing all
 * eight requested methods as separate provider primitives. Summarize,
 * reason, extract, generate, and evaluate are prompt-level distinctions,
 * not API-level ones: a Summarizer and a Root Cause Analyzer both just
 * need chat() with a different prompt template.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResult {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface EmbeddingResult {
  vector: number[];
  model: string;
  provider: string;
}

export interface AIProvider {
  readonly name: string;
  readonly available: boolean;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
  embed(text: string): Promise<EmbeddingResult>;
}

/** Thrown by every provider when called without configuration. */
export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string, envVarNeeded: string) {
    super(`AI provider "${providerName}" is not configured — set ${envVarNeeded} to enable it.`);
    this.name = 'ProviderNotConfiguredError';
  }
}

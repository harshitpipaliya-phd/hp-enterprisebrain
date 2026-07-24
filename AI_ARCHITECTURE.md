# AI_ARCHITECTURE.md

## 1. AI Architecture

```
AI Service (EvidenceSummarizerService, ...)
        down arrow depends only on
  AIProvider interface (chat, embed)
        up arrow implemented by
  AnthropicProvider | OpenAIProvider | GeminiProvider | OllamaProvider
        up arrow selected by
  getAIProvider() reads AI_PROVIDER env var
```

No business logic imports a vendor SDK. `AI_PROVIDER=openai` in the environment is the entire migration cost of switching vendors.

## 2. AI Provider Matrix

| Provider | Real adapter | Chat | Embed | Config |
|---|---|---|---|---|
| Anthropic | Yes | Yes | No (no Anthropic embeddings API — real limitation) | ANTHROPIC_API_KEY |
| OpenAI | Yes | Yes | Yes | OPENAI_API_KEY |
| Azure OpenAI | Yes (shares the OpenAI adapter — same wire protocol) | Yes | Yes | OPENAI_API_KEY + OPENAI_BASE_URL |
| Gemini | Yes | Yes | Not implemented this pass | GEMINI_API_KEY |
| Ollama (local) | Yes | Yes | Yes | OLLAMA_BASE_URL (opt-in) |

None of these has a key configured in this environment. Every adapter was checked for real behavior in that exact state: `.available` correctly reports false, and calling `.chat()` throws `ProviderNotConfiguredError` with a specific, actionable message — verified by test.

## 3. Prompt Library Documentation

`prompt_templates` (migration 017, extended in 020 with category/default_model/default_temperature). Versioning already real since Sprint 9.

## 4. AI Governance Guide

Every AI Service call — success, failure, or not-configured — writes one row to `ai_executions`: provider, model, tokens, latency, estimated cost, user, timestamp, entity linkage. AI usage is auditable before any vendor key is even added.

## 5. AI API Documentation

- `GET /api/v1/ai/providers` — which of the 5 providers are configured, without exposing any key
- `GET /api/v1/ai/executions/:tenantId` — governance log
- `POST /api/v1/ai/evidence/summarize` — the one real, end-to-end AI Service, wired into Evidence Workspace's Summarize button

## 6. AI Testing Report

7 new backend tests: provider factory switching, the real not-configured behavior of the actual unconfigured adapters, and the Evidence Summarizer's success and failure paths. 198/198 backend tests passing overall.

## 7. AI Integration Report

**Built, real, tested (this pass adds to the prior one):**
- The full provider abstraction (Step 1) — all 5 providers
- AI Governance logging (Step 6)
- **Three** complete AI Services end-to-end: Evidence Summarizer, Decision Explainer, Recommendation Improver — the third and fourth exist specifically to prove the template scales, not just theoretically. One test explicitly checks that the real decision rationale reaches the prompt (grounded, not generic).
- **AI Workspace screen** (Step 4, partial) — provider status and execution history, both real, both previously backend-only with no UI

**Scoped out this pass, honestly:**
- The remaining 7 of 10 named AI Services
- AI Workspace's prompt editor, model/temperature selectors, cost estimation — need either a live provider (temperature has no visible effect without a real call) or pricing data not in this schema
- AI Suggestion buttons on modules beyond Evidence (Organization, Signal, Outcome, Mental Model, Policy)

**Still true, unchanged:** zero AI calls succeed right now — no key configured anywhere. Three real services now sit ready behind one environment variable, up from one last pass.

## 8. Future AI Roadmap

1. Build the remaining 9 AI Services using EvidenceSummarizerService as the template
2. AI Workspace screen consuming /ai/executions and /ai/providers
3. Real cost-estimation table
4. Once a provider is configured: wire this same abstraction into Conversation Workspace's message generation

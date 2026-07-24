# Sprint3_Verification.md

## A naming collision worth flagging before anything else

This directive's "Sprint 3: AI Platform" (Agent Framework, AI Chat, Prompt Management, Streaming, Sessions, Conversation History, Vector Search) is **not the same Sprint 3** that was built earlier in this engagement (Executor directory, Decision reject flow, DPDP anonymization, Signal classification/timeline, Closed Intelligence Loop integration test). Checked directly, not assumed:

```
$ grep -rli "vector search|prompt management|ai chat|conversation history|streaming" api/src database/src
(zero matches)
```

**None of AI Chat, Prompt Management, Streaming, Sessions, Conversation History, or Vector Search exist anywhere in this codebase.** I'm not going to describe the Executor/Decision/Anonymization work as if it satisfies this list — it doesn't, they're different things that happen to share a sprint number.

## What the earlier "Sprint 3" actually delivered (re-verified fresh)

| Item | Status | Evidence |
|---|---|---|
| Executor directory (capability/availability/workload matching) | ✅ | `executor-matching.test.js` (5) — this was empty since before Sprint 1, now real |
| Decision reject flow | ✅ | Part of `decision.test.js` |
| DPDP anonymization | ✅ | `anonymize.test.js` (4) — emails/phones/IDs/names redacted before Learning persists |
| Signal classification/priority/timeline | ✅ | Part of `signal.test.js`, timeline endpoint in `signal.routes.ts` |
| Closed Intelligence Loop (integration test) | ✅ | `closed-intelligence-loop.test.js` (1) — all 8 real services chained, no mocks |

## What "AI Platform" (this document's actual Sprint 3 definition) requires, and why it's not safely inferable

- **Agent Framework** — needs a real decision: what agents exist, what they're allowed to do, how they're sandboxed. This overlaps with the Executor Resolver but isn't the same thing (Executor Resolver picks *who* executes an already-approved action; an Agent Framework would need to decide *what actions an agent can propose or take autonomously* — a materially different trust/autonomy question)
- **AI Chat / Conversation History / Sessions / Streaming** — a full new subsystem: which LLM provider, session storage shape, streaming transport (SSE vs WebSocket), how it authenticates against the existing tenant/RBAC model
- **Vector Search** — needs an actual vector store decision (pgvector extension on the existing Postgres? A separate service?) and an embedding model choice — neither exists in any contract or config in this repo
- **Prompt Management** — needs a real answer to "are prompts versioned like Policy rules are, or code-owned constants?" — genuinely ambiguous from the existing codebase alone

None of these are safely inferable from what exists. They're product/vendor decisions, not engineering gaps I can fill by reading code harder.

## Build (re-confirmed)

```
cd api && npx tsc   → 0 errors
cd api && node --test dist/tests/*.test.js   → 133/133 passing (includes all items in the table above)
```

## Verdict

**What was actually built under the "Sprint 3" label: complete and verified.** **What this document defines as Sprint 3 ("AI Platform"): not started, and not safely inferable without real product decisions.** See the escalation in this response for the specific choices that need your input before any of it can be built honestly.

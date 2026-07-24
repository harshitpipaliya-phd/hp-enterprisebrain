# SPRINT6_ARCHITECTURE.md

## Why this document exists, and its scope

No specification for "Sprint 6: Autonomous Enterprise" exists in this repository. Per the escalation protocol from the prior turn, I split this sprint's requested scope into what's safely engineering-inferable from existing architecture, and what genuinely requires a business/governance decision I was told not to invent.

## What was built: Autonomous Decision Execution

This wires an already-built-but-dormant capability into the actual decision flow, rather than inventing new governance:

- `PolicyService.evaluate()` (built Sprint 4) computed matched rules and actions correctly, but nothing in the Recommendation → Decision flow ever called it — it only ran from its own manual API route. Confirmed by search before writing any code.
- `DecisionService.tryAutoApprove(tenantId, recommendationId)` now calls it for real: if a tenant has an **active, explicitly-created** `business_rule` Policy whose evaluated actions include `auto_approve` for a given `pending` recommendation, the system creates a real Decision (`decidedBy: 'system:policy-engine'`, full trace, full explanation — same audit trail a human approval gets) and moves the recommendation to `approved`.

### Hard safety rule — not policy-overridable

`opportunity`-category recommendations can never be auto-approved, checked *before* any policy is even evaluated. This isn't a new rule invented for autonomy — it's the same principle already enforced at the executor-resolution layer since Sprint 2 ("the system proposes, it does not decide strategic direction"). Tested adversarially: a policy deliberately written to try to match `opportunity` recommendations still gets blocked (`autonomous-decision.test.ts`).

### Opt-in, not a default behavior change

Nothing auto-approves anything unless: (1) the tenant explicitly created an active policy, (2) that policy's rules match, (3) the endpoint is explicitly called (`POST /decisions/:tenantId/:recId/auto-approve-attempt`) — it does not fire automatically inside recommendation generation. A tenant with zero policies sees zero behavior change from every prior sprint.

## What was NOT built, and why — this is the larger part of the original Sprint 6 scope

| Requested | Why not attempted |
|---|---|
| Multi-Agent System, Agent Collaboration | Needs a real definition of what an "agent" is beyond the existing Executor (human/ai_agent/software/hybrid) and what agents are allowed to negotiate or decide among themselves — a trust/governance question, not inferable |
| Goal Planning, Task Planning, Workflow Engine | Needs a real workflow/state-machine model with no grounding in the existing schema — inventing one wholesale is "inventing a different product," not extending this one |
| Organization Digital Twin, Enterprise Simulation | Needs an actual answer to "simulating what, against which model, with what fidelity" — there's no existing simulation concept anywhere in this codebase to extend |
| Predictive Intelligence | Needs a forecasting/ML approach decision (which model, trained on what) — a real technical *and* business decision, not safely defaulted |
| Enterprise Automation, Optimization Engine | Same category as Workflow Engine — no existing scaffolding to extend |

Building any of these now would mean inventing the entire concept from nothing, which crosses the exact line this authorization drew: engineering decisions extending existing architecture are in scope; a new product surface with no grounding in what exists is not.

## Consistency check against the existing repository

- No new entity, no new table beyond what autonomous approval needed (none — it reuses `Decision`, `Policy`, `Recommendation` as-is)
- No change to `PolicyService.evaluate()`'s behavior, signature, or the rule format — reused exactly as built
- No change to `ExecutorResolverService` or the existing manual approve/reject flow — `tryAutoApprove` is additive, calling the same `approve()` path a human approval uses internally

## Verdict

**Autonomous Decision Execution: built, tested, safety-verified.** **The rest of "Sprint 6" as originally described: not started — genuinely requires the product/governance decisions named above, not inferable from code.**

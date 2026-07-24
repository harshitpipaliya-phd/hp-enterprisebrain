# AI (Product Layer)

> Product view of the AI/agent behaviour. **Planning only — no prompts/agents authored here.**

The authoritative AI assets live in `ai/` (owner Ajit): agents, prompts, guardrails. This folder maps product capabilities to the AI behaviour they require, keeping planning traceable to the asset folder.

## Capability → Epic → AI behaviour

| Capability | Epic | AI behaviour |
|---|---|---|
| Signal detection | EPIC-003 | classifiers / detectors |
| Reasoning & gotcha interpretation | EPIC-005 | reasoning agent + guardrails (envelope enforcement, §5.5) |
| ESO routing / recommendation | EPIC-006 | routing agent using `trigger` + `executorPolicy` |
| Decision support | EPIC-007 | explanation generation |
| ESO step execution (agent class) | EPIC-008 | agent executors per `procedure.steps[].executorClass` |
| Learning / calibration | EPIC-009 | outcome → trust calibration |

## Guardrails (product expectations)

Derived from `contracts/eso/eso.schema.yaml` §5.5 and Block 5:

- The runtime may **never** silently rewrite ESO procedure.
- The runtime may **never** exceed the `trustLevels` ceiling.
- The runtime may **never** skip `evidenceHooks` write-back (Principle P6).

## Conventions

- This folder holds product expectations of AI behaviour, not agent code.
- Agents/prompts/guardrails belong in `ai/`.
- Every note links to its parent Epic in `development/epics/`.

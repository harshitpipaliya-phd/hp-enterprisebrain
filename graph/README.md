# graph -- Neo4j (Uma)

`migrations/` runs in filename order. Never edit a migration that has shipped.

## Rules

- **Every node carries `tenantId`.** CI fails any Cypher that touches the graph
  without it. This is exit criterion #6 and it is not negotiable.
- **Every ingested fact carries provenance** -- source, system, method, timestamp,
  confidence, agent, type, version, hash. It cannot be backfilled.
- **Ledgers are append-only** -- Evidence, ReasoningStep, Task, Outcome, Learning.
  Current state = latest event. Never UPDATE.

## Run

```bash
cypher-shell -u neo4j -p "$NEO4J_PASSWORD" -f migrations/001_constraints.cypher
```

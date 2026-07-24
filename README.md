# HP Enterprise Brain

Organizational Intelligence & Execution System.

## THE ONE RULE

`contracts/` is the ONLY source of truth.

TypeScript and PHP types are GENERATED from it, never hand-written.
Need a field? Change the schema -> `cd contracts && npm run generate` -> commit.
Never edit `contracts/dist/` -- CI rejects it.

**Why this rule exists:** a React component (`ESOCard`) once defined the ESO
contract. The Engineering Blueprint said "nine fields." The real schema
(Product Discovery section 5.2) has **twelve**. That error survived for weeks because
definitions lived in four places at once. Never again.

## Windows developers

Use **Git Bash**, not PowerShell or CMD. All scripts assume a POSIX shell.

## Layout

| Folder      | Owner    | Holds                                     |
|-------------|----------|-------------------------------------------|
| contracts/  | Ajit     | ESO schema, taxonomy, OpenAPI -- **the hub** |
| api/        | Vivek    | Laravel -- auth, tenancy, REST             |
| graph/      | Uma      | Neo4j migrations, Cypher, canonical model |
| ai/         | Ajit     | agents, prompts, guardrails               |
| events/     | Rajesh   | outbox, append-only ledgers               |
| web/        | Frontend | React + design system                     |
| infra/      | DevOps   | terraform, CI, environments               |
| reference/  | Triz     | glossary -- GENERATED from contracts/      |

Seven packages, one repo (ADR-001 boundaries, no distributed-versioning tax).
Split into separate repos only when a team is genuinely blocked.

## Setup

```bash
npm install                      # installs workspaces
cd contracts && npm run generate # regenerate types
```

## Status

**Sprint 1 -- foundation only. No business features.**

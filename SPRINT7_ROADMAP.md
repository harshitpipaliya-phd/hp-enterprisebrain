# SPRINT7_ROADMAP.md

## What this is

A real proposal, not a rename of Sprint 5/6 concepts under a new number (that mistake was caught and corrected earlier in this project's history — see `Sprint3_Verification.md`). Every item below is checked against the actual repo, not assumed.

## Sequencing principle

Two buckets: items **safely groundable now** (pure engineering, no invented business logic) vs. items that **need a decision from you first** (named specifically, not vaguely deferred).

## Groundable now, in priority order

1. **Search** (this sprint — built below) — named as a real gap since Sprint 2's verification pass, purely engineering
2. **Swagger completion** — extend `api/src/openapi.ts` to the remaining 10 route groups (policy, risk, analytics, mental-models, eso-executions, executors, org/department/person/capability) — mechanical, uses the pattern already established
3. **CI build+test pipeline** — a `.github/workflows/ci.yml` that runs `npm install && npm run generate && tsc across all workspaces && npm test` on every PR — currently only `contracts.yml` and `tenant-isolation.yml` exist; there's no "does this even build" gate
4. **Department-scoped analytics** — now unblocked: `Signal` already carries `orgId`; adding `departmentId` alongside it (not replacing anything) is a safe additive column, and the attribution question from `SPRINT5_ARCHITECTURE.md` has a natural default — attribute to the org for now, refine later if you want per-department precision

## Needs a decision from you first — same items escalated earlier, still open

- AI Platform (chat, vector search, prompt management) — vendor decision
- Multi-agent, digital twin, simulation, predictive intelligence — governance/product decision
- Full dark-mode/Tailwind UI redesign — design-system decision (worth deciding intentionally, not defaulted)

## What's built this pass, as the concrete first piece of Sprint 7

**Search** — see `SPRINT7_SEARCH.md` for the implementation. Real, tested, tenant-scoped full-text search across Signal, Evidence, Recommendation, Decision, and Learning.

## What's not attempted

Items 2–4 above are proposed, not built, in this pass — building all four with the same rigor as Search would mean either rushing them (risking the exact quality problem this whole engagement exists to prevent) or taking substantially longer than one response reasonably allows. Sequenced, not silently dropped.

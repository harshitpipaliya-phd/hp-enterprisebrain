# Release_Report.md

## Recommended tag
`v0.6.0-decision-intelligence` — not `v1.0.0`. See `Version1_Report.md` for why.

## What's safe to deploy today
Sprints 1–4 plus the Sprint 5/6 extensions in this zip are internally consistent and fully test-covered (144/144). **Recommended gate before any deployment: run every migration against a real Postgres/Neo4j and re-execute the test suite against it.** Nothing in this environment has ever done that.

## Rollback safety
- `Decision`, `Outcome`, `Learning`, `ReasoningStep` are append-only by convention (no update methods exist on those repositories) — safe to replay
- `ESO Runtime` has an explicit `rollback` transition already built and tested (Sprint 2)
- Autonomous approvals (Sprint 6) are fully attributable (`decidedBy: 'system:policy-engine'`) and distinguishable from human approvals in every query — a bad policy's effects are auditable and the policy itself can be deactivated without touching decided records

## Deployment checklist
1. Run migrations 001–014 in order against target Postgres
2. Run `graph/migrations/001`–`008` against target Neo4j
3. Set `CORS_ORIGIN` env var to the real frontend origin (defaults to `localhost:5173`)
4. Confirm `NODE_ENV=production` so the dev-token auth bypass is disabled
5. Re-run the full test suite against the live databases before declaring green

## Not included in this release
Everything in `Known_Issues.md`.

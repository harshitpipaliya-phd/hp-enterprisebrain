# SPRINT4_REPORT.md

> Every claim below was independently verified by re-running the build/test commands shown, not copied from generation output.

---

## Sprint Goal

Decision Intelligence Engine — make HP Enterprise Brain's decisions explainable (confidence, explanation, trace on every Decision), extend it with genuinely new capabilities (Policy rule engine, Risk engine, decision analytics), and close real gaps found in the existing Signal→Evidence→Reasoning→Recommendation→Decision chain rather than rebuild it.

## A necessary correction, same as Sprint 3

Stories 1–4 (Decision, Evidence, Reasoning, Recommendation Engines) were described as if starting fresh. They already exist, tested, since Sprint 2/3 (133 tests total in this repo now, most inherited). Rebuilding them under Sprint 4 names would have duplicated logic. So this sprint did the same thing as last time: checked the actual repo for real gaps in those four stories, closed only those, and built the genuinely new stories (5, 6, 9) in full.

---

## Stories

| # | Story | What was actually done |
|---|---|---|
| 1 | Decision Engine | **Gap closed**: `confidence`, `explanation`, `trace` were missing on Decision. Added — `DecisionService.approve()`/`reject()` now build a structured trace and an auto-generated human-readable explanation, not just free-text rationale. |
| 2 | Evidence Engine | **Gap closed**: freshness was missing. Added `observedDate` + a half-life decay function (`computeFreshness`, 90-day half-life), and wired it into Reasoning's confidence computation — stale evidence now corroborates less, even at the same stated confidence. |
| 3 | Reasoning Engine | No genuine gap beyond the freshness wiring above (Story 2's fix). Reasoning Sessions/Execution Tree/Intermediate Thoughts as separate concepts were not built — flagged in Known Issues, not silently skipped. |
| 4 | Recommendation Engine | **Gap closed**: urgency and expected ROI were missing. Added both — urgency is *derived* (compliance+high-confidence → immediate, risk+high-confidence → high, watch → low), not caller-supplied, so it can't be gamed by whoever files the recommendation. |
| 5 | Policy Engine | **Genuinely new.** The `policies` table already existed (Sprint 2, for executor autonomy) — extended the same entity with a `policy_type` discriminator, `rules`, and version chaining, rather than creating a duplicate table. Real rule evaluation: structured field/operator/value rules, deliberately **not** an eval()-based expression language (that would be a code-execution vulnerability in enterprise software) — a safe dot-path field lookup instead. |
| 6 | Risk Engine | **Genuinely new.** `Risk` was never part of any prior canonical entity list. New table, new Neo4j node, deterministic scoring (`probability × impact weight`, not asserted), linked to both Decision and Recommendation. |
| 7 | Decision Graph | **One real bug found and fixed, not new relationships invented.** Traced every `MERGE ...-[:...]->...` in the sync service — the full Org→Dept→Person→Capability→Signal→Evidence→Reasoning→Recommendation→Decision→Outcome→Learning chain already existed, *except* `CapabilityAssigned` had been published as an event since Sprint 1 and never had a subscriber — the Person→Capability edge never actually got created despite the Postgres assignment existing. Fixed. Added Risk relationships (`HAS_RISK` from both Decision and Recommendation). |
| 8 | Decision Dashboard | **Extended, not rebuilt.** Added a real `DecisionAnalyticsPanel` (risk cards, stats) wired into the existing Intelligence Workspace navigation. Did **not** attempt dark mode, charts, or a responsive redesign — that's a genuinely large UI undertaking or, and claiming it done without real device/browser testing would repeat exactly the overclaiming this whole engagement has been correcting. Named honestly in Known Issues. |
| 9 | Decision Analytics | **Genuinely new**, fully real. `computeStatistics()` — acceptance rate, recommendation accuracy (successful outcomes / total outcomes), risk distribution by category, evidence quality (mean confidence), all computed from actual repository data, zero hardcoded numbers. Tested with 5 unit tests including an empty-data / no-division-by-zero case. |
| 10 | Documentation | This report. |

---

## Verification (commands actually run)

```
cd contracts && npm run generate       → OK
cd database && npx tsc                 → 0 errors
cd events && npx tsc                   → 0 errors
cd api && npx tsc                      → 0 errors
cd api && node --test dist/tests/*.test.js
  → # tests 133, # pass 133, # fail 0
cd web && npx tsc --noEmit             → 0 errors
```

Test breakdown: 121 inherited (Sprint 1–3 + runtime fix), plus 12 new this pass (Policy 3, Risk 4, Analytics 5).

**Still not live-database-verified.** Same caveat as every prior report — no Postgres/Neo4j in this environment. The migrations, repositories, and Cypher are structurally correct and pattern-matched against tested code, not run against a live instance.

---

## Files Added

```
database/migrations/013_decision_intelligence.sql
database/src/policy.repository.ts
database/src/risk.repository.ts
graph/migrations/008_risk.cypher
api/src/policy/{policy.service.ts, policy.routes.ts}
api/src/risk/{risk.service.ts, risk.routes.ts}
api/src/analytics/analytics.routes.ts
api/tests/{policy,risk,analytics}.test.ts
web/src/components/workspace/DecisionAnalyticsPanel.tsx
```

## Files Modified

```
database/migrations/008_intelligence_entities.sql   (executor_type column — carried from Sprint 3, unrelated fix noted for completeness)
database/src/{decision,evidence,recommendation}.repository.ts   (confidence/explanation/trace, observedDate, urgency/expectedRoi)
database/src/index.ts                                 (barrel exports)
events/bus.ts, events/index.ts                        (+PolicyEvents, +RiskEvents)
api/src/decision/decision.service.ts                  (trace + explanation generation)
api/src/evidence/evidence.service.ts                  (+computeFreshness)
api/src/reasoning/reasoning.service.ts                 (confidence now freshness-weighted)
api/src/recommendation/recommendation.service.ts       (+deriveUrgency, +expectedRoi passthrough)
api/src/graph/graph.sync.service.ts                    (+syncPolicy, +syncRisk, +syncCapabilityAssignment fix)
api/src/app.ts                                          (+policy, risk, analytics routes)
web/src/api/intelligence.ts                            (+risk/policy/analytics client calls)
web/src/App.tsx, web/src/components/organization/OrganizationDetails.tsx  (+analytics nav)
api/tests/{signal,decision,executor-matching,closed-intelligence-loop,evidence,reasoning,recommendation}.test.ts
  (mocks updated for new required fields — these are compile-fix updates, not behavior changes)
```

## Database Changes

`decisions` gained `confidence`, `explanation`, `trace`. `evidence` gained `observed_date`. `recommendations` gained `urgency`, `expected_roi`. `policies` gained `policy_type`, `rules`, `version`, `previous_version_id`. New table: `risks`.

## Neo4j Changes

New node label: `Risk`, with constraints. New relationships: `(Decision)-[:HAS_RISK]->(Risk)`, `(Recommendation)-[:HAS_RISK]->(Risk)`, and the fixed `(target)-[:HAS_CAPABILITY_ASSIGNMENT]->(Capability)` (Story 7). `Policy` sync added (previously had a graph constraint from Sprint 2 but no sync method — never actually reached the graph until now).

## API Summary

New route groups: `/api/v1/policies` (create, list, get, version, evaluate), `/api/v1/risks` (assess, list, get, mitigate), `/api/v1/analytics/:tenantId` (single aggregate endpoint).

## Decision / Evidence / Reasoning / Recommendation Engine Summary

See the Stories table above — each entry states exactly what changed vs. what was already correct.

## Policy Engine Summary

Business rules are structured (`field`, `operator`, `value`, `action`), evaluated by safe property-path traversal — deliberately not an eval-based expression language, which would be a code-execution risk in this context. Versioning creates a new row with a `previousVersionId` link rather than mutating the original, so a Decision made under an older rule set stays explainable against the rules that actually applied at the time.

## Risk Engine Summary

Score = `probability × impact weight` (low=1, medium=2.5, high=5, critical=10), computed server-side, never caller-supplied — two risks with the same inputs always get the same score.

## Test Summary

133/133 passing. 12 new tests this sprint, all for genuinely new logic (rule evaluation, versioning, risk scoring, analytics aggregation with an explicit empty-data case).

---

## Known Issues

1. **No live database verification** — unchanged limitation across every sprint in this environment.
2. **Decision Dashboard was extended, not redesigned.** No dark mode, no charting library, no responsive breakpoint work. The existing plain-CSS pattern was kept for consistency with the rest of the app rather than introducing a new UI framework mid-sprint, which would itself be a scope violation ("do not change technology stack").
3. **Reasoning Sessions / Execution Tree / Intermediate Thoughts** (Story 3's fuller vocabulary) were not built as separate concepts — `ReasoningStep` with `stepOrder` already covers ordered reasoning chains; a session/tree abstraction on top of it would be new scope, not a gap fix, so it's named here rather than added silently.
4. **Rule evaluation supports flat field comparisons only** (eq/neq/gte/lte/gt/lt/in) — no AND/OR composition across multiple conditions in one rule. Multiple rules with the same `action` approximate OR; there's no way to express AND within a single rule today. A real gap if compound conditions turn out to be needed.
5. **No seed data for Policies or Risks** — same pattern as the Executor directory in Sprint 3: the logic is real and tested, but there's nothing to see until you create records against a live database.

## Future Improvements

- AND/OR rule composition in the Policy Engine if compound business rules are needed
- Reasoning Session grouping if multiple ReasoningSteps need to be bundled under one investigation
- The dashboard redesign (dark mode, charts, responsive) as its own scoped piece of work, not folded into a sprint already covering five other stories

---

Not starting Sprint 5.

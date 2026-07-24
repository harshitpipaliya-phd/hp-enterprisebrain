# IMPLEMENTATION_MATRIX.md

> Every row below was verified against actual files and test runs this session — not assumed from prior conversation. Epic numbering follows `development/epics/`, the original pre-Sprint-1 roadmap, since it's the one authoritative sequence not redefined mid-conversation.

## Core Epics (original roadmap)

| # | Epic | Backend | Tests | Frontend | Status |
|---|---|---|---|---|---|
| 001 | Enterprise Workspace (Org/Dept/Person/Capability) | ✅ | ✅ | ✅ (5 screens) | **Complete** |
| 002 | Evidence Engine | ✅ `api/src/evidence/` | ✅ 2 tests | ❌ **None — zero UI presence anywhere, not even embedded** | **Partially complete** |
| 003 | Signal Engine | ✅ | ✅ 5 tests | ✅ Signal Dashboard | **Complete** |
| 004 | Case Engine | ✅ `api/src/case/` | ✅ 7 tests + 1 integration test | ❌ **None — zero UI presence** | **Partially complete** |
| 005 | Reasoning Engine | ✅ | ✅ 4 tests | ⚠️ Embedded only (confidence shown inside Recommendations, no standalone Reasoning view) | **Partially complete** |
| 006 | Recommendation Engine | ✅ | ✅ 3 tests | ✅ Shown in Intelligence Workspace | **Complete** |
| 007 | Decision Center | ✅ | ✅ 5 tests | ✅ Approve/reject in Intelligence Workspace | **Complete** |
| 008 | ESO Execution Engine | ✅ | ✅ 4 tests | ❌ No execution-status UI | **Partially complete** |
| 009 | Learning Engine | ✅ (+ Pattern Detection) | ✅ 3 tests | ✅ Reusable Learnings shown in Intelligence Workspace | **Complete** |

**Correction to standing documentation**: 8 of these 9 epics' own `## Development Status` sections still said "Planned" — stale since whenever each was actually built. Only EPIC-004 had been updated. Fixed as part of this audit (see below).

## Beyond the original 9 epics (built later, no epic doc)

| Capability | Backend | Tests | Frontend | Status |
|---|---|---|---|---|
| Policy Engine (incl. AND/OR) | ✅ | ✅ 6 tests | ❌ No UI | Partially complete |
| Risk Engine | ✅ | ✅ 4 tests | ✅ Risk cards in Decision Analytics | Complete |
| Mental Model / Organizational Learning | ✅ | ✅ 5 tests | ✅ Table in Executive Dashboard | Complete |
| Autonomous Decision Execution | ✅ | ✅ 6 tests | ❌ No UI (API-only, opt-in) | Partially complete |
| Decision Analytics | ✅ | ✅ 5 tests | ✅ | Complete |
| Executive Dashboard | ✅ | — | ✅ | Complete |
| Enterprise Search | ✅ (2 implementations — see note) | ✅ | ❌ No UI | Partially complete |
| Knowledge Graph Explorer | ✅ | ✅ 8 tests | ✅ | Complete |
| Multi-Agent Monitor | ✅ (reuses Executor) | — | ✅ | Complete |
| Conversation storage | ✅ | ✅ 3 tests (prompt rendering only) | ❌ No UI | Partially complete |
| AI generation / chat | ❌ Not built — needs LLM vendor decision | — | ❌ | **Blocked, not "incomplete"** |

**Note on Search**: there are genuinely two separate search implementations — `api/src/search/` (Postgres ILIKE, Sprint 7) and `api/src/graph-query/` (Neo4j substring match, Sprint 8). Both real, neither wrong, but this is duplication worth resolving — flagged, not fixed in this pass.

## Verified this session (commands actually run)

```
cd api && node --test dist/tests/evidence.test.js       → 2 pass
cd api && node --test dist/tests/signal.test.js          → 5 pass
cd api && node --test dist/tests/reasoning.test.js        → 4 pass
cd api && node --test dist/tests/recommendation.test.js   → 3 pass
cd api && node --test dist/tests/decision.test.js         → 5 pass
cd api && node --test dist/tests/eso-runtime.test.js      → 4 pass
cd api && node --test dist/tests/learning.test.js         → 3 pass
```

## First incomplete item, in epic order — CLOSED this pass

**EPIC-002 Evidence Engine's frontend.** Built: `web/src/components/workspace/EvidenceWorkspace.tsx` — list, collect form (source/content/confidence), freshness computed and displayed per row (Fresh/Recent/Aging/Stale). Wired into navigation. Verified: `web && npx tsc --noEmit` clean, full suite still 173/173.

## Next incomplete item, in epic order

**EPIC-004 Case Engine's frontend** (backend real since this session, 7 tests + 1 integration test, zero UI) — followed by EPIC-005's standalone Reasoning trace view and EPIC-008's execution-status UI. Recommend Case Engine next: strategically it's the piece §8/§12.3's "deliberation moment" demo actually depends on, and per audit ordering it's the very next gap after Evidence.

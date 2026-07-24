# FEP-001 — Wireframe Specification

> ASCII wireframe only. No React/HTML.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Scope: [Tenant ▾]  Unit: [All OrgUnits ▾]        ⚙  |  Workspace      │
├──────────────────────────────────────────────────────────────────────┤
│ Health Overview                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│ │ Units 12 │ │ People 84│ │ Caps 30  │ │ ESOs 9   │  Overall: WATCH   │
│ │ healthy  │ │ watch 3  │ │ crit 2   │ │ active 4 │                    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
├──────────────────────────────────────────────────────────────────────┤
│ Gap Board (by root-cause family)                                       │
│ Capability │ Capacity │ Process │ Information │ Motivation │ Coord │  │
│  [GC-1]    │  [CA-1]  │ [PR-2]  │   [IN-1]    │  [MO-1]    │ [CO-1] │  │
│ Coordination│ External │ Policy                                        │
│  [CO-1]    │  [EX-1]  │ [PO-1]                                         │
├──────────────────────────────────────────────────────────────────────┤
│ Gap Detail Drawer (GC-1 selected)                                      │
│  Family: Capability  Severity: high  Confidence: 0.82                  │
│  Evidence: EVD-… (provenance ↗)                                        │
│  Linked Case: CASE-204 (Hypothesis: Capability)                       │
│  Recommended ESO: eso.dev.capability.build  [Act ▸]                    │
│  Learning: lastOutcome improved +12% (Learning-…)                      │
└──────────────────────────────────────────────────────────────────────┘
```

Notes:
- The 8 gap-board columns map 1:1 to `contracts/taxonomy/root-cause.schema.yaml`.
- `Act ▸` is disabled when the ESO's `trustLevels` ceiling exceeds the operator's effective autonomy.

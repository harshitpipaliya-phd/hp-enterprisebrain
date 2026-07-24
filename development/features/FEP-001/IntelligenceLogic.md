# FEP-001 — Intelligence Logic (end-to-end flow)

> The six-stage cognitive loop, mapped to the Organization Health Dashboard.
> **No algorithms** — only the flow: Evidence → Signals → Reasoning → Recommendations → ESO Actions → Learning.

```
Evidence (read) ──▶ Signals (EPIC-003) ──▶ Reasoning (score + classify)
                                                   │
                                           Recommendations (EPIC-006 link)
                                                   │
                                           ESO Actions (handoff → EPIC-007/008)
                                                   │
                                           Learning (Outcome/Learning ledgers)
                                                   │
                                            └────▶ feeds next Reasoning
```

| Stage | Owner | Dashboard role | Contract / Graph anchor |
|---|---|---|---|
| Evidence | EPIC-002 | read provenance-bearing facts | `Evidence` (`graph/README.md`) |
| Signals | EPIC-003 | consume classified gaps | `gapTypes` → `root-cause.schema.yaml` (8 families) |
| Reasoning | this FEP | score + synthesize gaps | ESO Blocks 4/5/7/9/11 (read-only) |
| Recommendations | EPIC-006 | link gap → ESO via `trigger.gapTypes` | ESO Block 2 |
| ESO Actions | EPIC-007/008 | handoff (no execution) | ESO Blocks 4/5/9; `executorPolicy.trustLevels` |
| Learning | EPIC-009 | read/feed `Outcome`/`Learning` | `Outcome`, `Learning` (append-only) |

**Envelope (§5.5):** the dashboard never rewrites ESO procedure, never exceeds `trustLevels`, never skips `evidenceHooks`. It is a read + linkage surface inside the existing cognitive loop.

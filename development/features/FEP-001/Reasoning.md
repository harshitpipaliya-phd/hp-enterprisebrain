# FEP-001 — Reasoning

## Reasoning Layer (health scoring + gap synthesis)

The dashboard's reasoning is **bounded aggregation and classification**, not free-form inference. It stays inside the ESO envelope (§5.5): it never rewrites procedure, exceeds trust, or skips evidence hooks.

- **Inputs:** tenant-scoped `Evidence`, `Outcome`, `Learning`, open `Case`/`Hypothesis`, and EPIC-003 signals.
- **Health scoring:** for each `OrgUnit`/`Person`/`Capability`, derive a health state (healthy / watch / critical) from the confidence and recency of underlying `Evidence`/`Outcome` and the count/severity of open signals.
- **Gap synthesis:** group open signals into org-level gaps and tag each with its root-cause family.
- **Explainability:** every score links to the `Evidence`/`Case` that produced it (traceability).
- **Bounded by contract:** scoring reads ESO Blocks 4 (procedure), 5 (trust), 7 (gotchas), 9 (evidenceHooks), 11 (memory) definitions but does not alter them. If a `gotcha` (Block 7) fired on a related ESO, the dashboard surfaces it as a risk note.
- **Output:** an Organization Health model = { per-unit scores, gap board by family, linked Cases/ESOs }.

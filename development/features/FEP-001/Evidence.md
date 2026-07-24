# FEP-001 — Evidence

## Evidence Layer (consumed, not produced)

The dashboard does not generate evidence; it **reads** the `Evidence` ledger that other Epics populate.

- **What is read:** provenance-bearing facts attached to `Person`, `OrgUnit`, `Role`, `Capability`, `Case`, `ESO`, `Outcome`, `Learning` nodes.
- **Provenance contract:** every fact carries source, system, method, timestamp, confidence, agent, type, version, hash (`graph/README.md`). Not backfillable.
- **Role in health:** Evidence is the ground truth behind each health score and gap. The dashboard surfaces provenance on demand so an operator can trace a score to its facts.
- **Write-back:** when an operator acts on a gap (via EPIC-007/008), the ESO's `evidenceHooks.mustLog` (Block 9) records executor, context, artifacts, score, duration, exceptions — feeding future health.

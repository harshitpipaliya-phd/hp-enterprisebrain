# FEP-001 — Signals

## Signal Layer (consumed from EPIC-003)

Signals are produced by the **Signal Engine (EPIC-003)** and consumed by this dashboard.

- **What is shown:** organizational gaps detected from Evidence, each carrying a severity, confidence, and a `gapType`.
- **Classification:** every signal is classified against the 8 root-cause families in `contracts/taxonomy/root-cause.schema.yaml` (Capability, Capacity, Process, Information, Motivation, Coordination, External, Policy). The dashboard groups its gap board by these families — it does not re-classify.
- **Family → entity mapping (read-only view):**
  - Capability / Capacity → `Capability`, `Person` skill gaps
  - Process / Information → `Case` process breakdowns
  - Motivation / Coordination → `OrgUnit`, `Role` interaction gaps
  - External / Policy → `Policy`/compliance context
- **Filtering:** the dashboard filters signals by the selected `OrgUnit` scope and by family.
- **No duplication:** the dashboard references EPIC-003's signal definition; it does not redefine `gapTypes`.

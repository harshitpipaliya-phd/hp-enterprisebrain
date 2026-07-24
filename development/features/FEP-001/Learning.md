# FEP-001 — Learning

## Learning Layer (consumed + fed)

- **Consumed:** the dashboard reads `Learning`/`Outcome` (EPIC-009) to calibrate health scores and to show "what improved" per unit. Per ESO Block 11 (`memory.scope`), personalization state is declared by the ESO and stored in the graph (not in the contract).
- **Fed:** when an operator acts on a gap (via EPIC-007/008), the resulting `Outcome`/`Learning` entries reflect back into future dashboard scores — closing the loop.
- **Trust calibration:** `Outcome` quality feeds trust-level calibration (F-001.5 / Block 5) used by EPIC-006/008; the dashboard displays calibration trends but does not change trust levels itself.
- **Append-only:** all learning reads/writes honor the ledger rule in `graph/README.md` (Evidence, ReasoningStep, Task, Outcome, Learning are append-only; current state = latest event).

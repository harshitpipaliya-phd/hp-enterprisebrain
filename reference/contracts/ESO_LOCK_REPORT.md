# ESO_LOCK_REPORT.md

> ESO Contract Finalization Review — Chief Software Architect.
> Scope: review and verify the existing Enterprise Service Object (ESO) contract. **No new contract invented; the existing contract was NOT modified.**

---

## 1. Summary

| Item | Value |
|---|---|
| Artifact reviewed | `contracts/eso/eso.schema.yaml` (v1.0.0-draft) |
| Generated mirror | `contracts/dist/ESOContract.d.ts` (in sync) |
| Supporting in-repo doc | `contracts/taxonomy/root-cause.schema.yaml` (8 families) |
| Requested-but-ABSENT docs | **Product Bible**, **Engineering Blueprint**, **ADRs**, **`eb-contracts/`** — none exist in this repository |
| Internal structural correctness | ✅ Sound (no missing/duplicate fields, no undefined enums, no broken internal refs) |
| Publication gating | ❌ **Not satisfied** — schema is self-gated DRAFT with 7 open decisions |
| Decision | **DO NOT LOCK.** Status remains `DRAFT`, version remains `1.0.0-draft`. |

The ESO contract is **internally correct** but **not publishable** in its current state because it carries explicit unresolved decisions that its own header marks as blocking ("MUST BE RESOLVED BEFORE THIS SCHEMA IS PUBLISHED"). The resolving authorities (Product Bible, Engineering Blueprint) are not present in the repository, so they cannot be resolved here without inventing documents — which is out of scope and forbidden. Locking would violate the contract's own gate.

---

## 2. Findings (per review criterion)

### 2.1 Required fields — ✅ PASS
Top-level `required`: `identity, trigger, contract, procedure, executorPolicy, gotchas, assessment, evidenceHooks, lineage` (9 of 12 blocks; Blocks 6/10/11 correct optional). Per-block required sub-fields are complete. No required field is missing.

### 2.2 Optional fields — ✅ PASS
Blocks 6 (`scaffolding`), 10 (`resources`), 11 (`memory`) and many sub-fields (preconditions, prerequisites, constraintsPolicies, rubric, masteryThreshold, bloomLevel, dokLevel, acceptanceTests, detectionSignal, response, attemptHistory, adaptationsThatWorked, lastOutcome, composedOf, composesInto, supersedes, supersededBy, sourceEvidence) are correctly optional.

### 2.3 Enums — ✅ PASS (all defined)
`status` (3), `provenance` (3), `kasbaBinding.nodeType` (8 KASBA), `objective` (4), `executorClass` (4), `trustLevel` (4), `gotchas.kind` (4), `assessment.evaluator` (3), `evidenceHooks.mustLog` (6), `memory.scope` (2). **No undefined enums.** No enum references a value not declared.

### 2.4 Validation rules — ✅ PASS
`additionalProperties: false` on every object (prevents field creep); `minItems: 1` on `procedure.steps` and `gotchas`; `order` `minimum: 1`; `version` semver; `typedParam` requires `name`+`type`. The `contracts.yml` CI regenerates `dist/` and fails on staleness.

### 2.5 Runtime behavior — ⚠️ MINOR (external broken ref)
The §5.5 envelope is correctly specified (no silent procedure rewrite, no trust exceed, no skipped evidenceHooks). However line 30 references `eso-runtime.schema.yaml` (the contract-in-motion), which **does not exist** in the repo. This is a broken reference to a sibling document, not a field defect — but it blocks full runtime-contract coherence.

### 2.6 Autonomy policy — ✅ PASS (self-consistent)
Block 5 (`executorPolicy`) is complete: `allowedExecutorClasses`, `trustLevels`, `routingCriteria`, `escalationPath`. Trust ladder `observe|suggest|approve|autonomous` is coherent. Open Decision #3 (trustLevel-as-ceiling vs DML `{floor,ceiling,gate}`) is unresolved but the schema is internally consistent using trustLevel as the ceiling.

### 2.7 Required capabilities — ✅ PASS
`identity.kasbaBinding` binds to exactly one KASBA node (`Knowledge|Ability|Skill|Attitude|Behaviour|Task|Role|Capability`); graph has a `Capability` label (`graph/migrations/001_constraints.cypher`). `resources`/`scaffolding` reference capability material.

### 2.8 Memory model — ✅ PASS
Block 11 declares `scope` (`per-person|per-context`) + `attemptHistory`/`adaptationsThatWorked`/`lastOutcome`. Open Decision #4 (declaration vs storage) is unresolved, but the schema already declares only — consistent with the recommended decision. No mutable per-person state is stored in the contract.

### 2.9 Provenance — ✅ PASS
`identity.provenance` enum + `lineage.sourceEvidence` + `evidenceHooks` (write-back / Principle P6). Aligns with `graph/README.md` provenance rule.

### 2.10 Versioning — ✅ PASS
`identity.version` is semver; "a runtime wanting different behaviour must propose a NEW version (§5.5)" is explicit; `lineage.supersedes/supersededBy` supports version chains.

---

## 3. Check-For Results

| Check | Result |
|---|---|
| Missing fields | None required are missing. |
| Duplicate fields | None — every property name is unique within its object; `additionalProperties: false` forbids duplicates. |
| Contradictions | **Exist, but are the schema's own open decisions** (see §4), not internal inconsistencies. |
| Broken references | One: `eso-runtime.schema.yaml` (line 30) — absent sibling doc. |
| Undefined enums | None. |

---

## 4. Corrections / Open Decisions (from the schema's own footer + PROVENANCE block)

These are **carried, not invented**. They are why the contract cannot be locked:

1. **`objective` enum conflict** (line 103, Open Decision #1) — §5.2 (`DEVELOP|PERFORM|ASSESS|DECIDE`) vs Product Bible (`Assessment|Learning|Workflow|Communication`). Marked **"MUST BE RESOLVED BEFORE THIS SCHEMA IS PUBLISHED."** → **BLOCKING.**
2. **`executorClass` granularity** (#2) — §5.2 per-step 4-class vs Blueprint §6.3 per-ESO 3-class. Adopt §5.2.
3. **Autonomy model** (#3) — `trustLevel` vs DML `{floor,ceiling,gate}`. Recommend trustLevel = ceiling.
4. **Memory block** (#4) — declaration vs storage. Recommend declaration only (schema already does this).
5. **"nine-field contract" correction** (#5) — must be fixed in the (absent) Engineering Blueprint.
6. **Block 3 naming** (#6) — consider renaming "contract" → "specification".
7. **Storage authority** (#7) — contract-at-rest in Postgres, bindings/traces in Neo4j. Confirmed, no conflict.

Decisions #1 and #5 depend on the **Product Bible** and **Engineering Blueprint**, which are **not in this repository**. They therefore cannot be resolved within this review without inventing authority — prohibited.

---

## 5. Risks

- **R1 (HIGH):** Locking now would publish a contract the schema itself gates as DRAFT. Violates the contract's own publication condition.
- **R2 (MEDIUM):** `eso-runtime.schema.yaml` is missing; runtime-in-motion behaviour is unspecified, leaving EPIC-005/008 without a contract to bind to.
- **R3 (MEDIUM):** `objective` enum ambiguity will propagate to routing (Block 2), composition (Block 12), and the recommendation engine if not resolved before implementation.
- **R4 (LOW):** Absent authority docs (Bible/Blueprint/ADRs) mean downstream Epics cite unresolved sources; traceability risk, not a contract defect.

---

## 6. Decision

**DO NOT LOCK.**

- `status` remains **DRAFT** (line 5 unchanged).
- `version` remains **1.0.0-draft** (line 4 unchanged).
- The contract file was **not modified**.

Rationale: The contract is structurally sound and internally consistent, but it is explicitly gated against publication by its own open decisions — one of which ("MUST BE RESOLVED BEFORE THIS SCHEMA IS PUBLISHED") concerns the `objective` enum and depends on the Product Bible, which is absent from the repository. Per the instruction "DO NOT invent a new ESO contract" and the repo rule that `contracts/` is the only source of truth, the architect cannot resolve external-authority conflicts by fabrication. Locking would be premature and unsafe.

---

## 7. Future Changes (required before LOCK → 1.0.0)

1. Import/author the **Product Bible** and **Engineering Blueprint** (or re-point references to `contracts/eso/eso.schema.yaml` §5.2/§5.5) and resolve Open Decisions #1, #2, #5.
2. Create **`eso-runtime.schema.yaml`** (contract-in-motion) referenced at line 30; verify the §5.5 envelope against it.
3. Resolve autonomy model (#3) and memory storage (#4) with the graph/canonical-model owners; the schema already aligns with the recommended positions.
4. Re-run `cd contracts && npm run generate`; confirm `dist/ESOContract.d.ts` stays in sync; CI green.
5. Only after #1–#4, change `status: LOCKED` and `version: 1.0.0`, then regenerate.

> No contract file was edited. This report is the complete, honest finalization review.

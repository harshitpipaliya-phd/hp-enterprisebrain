# EPIC-003 — Signal Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Detect **gaps and signals** in the organization and classify them against the root-cause taxonomy so that the right ESO can be routed to address them. The Signal Engine is the perceptual front-end of the brain: it turns raw evidence into actionable gap types.

## Business Problem

Organizations generate vast noise but little signal. Without a dedicated layer that detects gaps (capability shortfalls, process breakdowns, coordination failures) and tags them with a root-cause family, the system cannot know *what* to act on, and ESO routing (EPIC-006) has nothing to match against.

## Business Value

- Converts passive evidence (EPIC-002) into prioritized, classified gaps.
- Provides the `gapTypes` input the ESO contract needs for routing (`contracts/eso/eso.schema.yaml` Block 2 `trigger.gapTypes`).
- Enables proactive rather than reactive operation.

## Users

- **Operations Leaders** — consume signals as a dashboard of organizational health.
- **Analysts** — tune signal detectors and thresholds.
- **The Brain (system)** — consumes signals to trigger ESOs.

## Features

- F-003.1 Gap/signal detection from evidence streams.
- F-003.2 Classification against the eight root-cause families (`contracts/taxonomy/root-cause.schema.yaml`: Capability, Capacity, Process, Information, Motivation, Coordination, External, Policy).
- F-003.3 Signal severity / confidence scoring.
- F-003.4 Signal → ESO trigger mapping (feeds Block 2 `trigger.descriptionForMachine` and `gapTypes`).
- F-003.5 Signal suppression / deduplication.

## Dependencies

- EPIC-002 (Evidence Engine) as the signal source.
- `contracts/taxonomy/root-cause.schema.yaml` — the authoritative eight-family taxonomy.
- `contracts/eso/eso.schema.yaml` Block 2 (`trigger`) — defines how ESOs declare the gap types they address.
- EPIC-001 (tenant scoping).

## Required Data

- Root-cause taxonomy families (from `contracts/taxonomy/root-cause.schema.yaml`).
- Evidence aggregates (from EPIC-002).
- Signal records: type, family, severity, confidence, source evidence refs.

## Screens

> Product planning only.

- Organizational signal dashboard.
- Root-cause breakdown (by the eight families).
- Signal detail / drill-down.

## Acceptance Criteria

1. Every emitted signal is classified against one of the eight families in `contracts/taxonomy/root-cause.schema.yaml`.
2. Signals reference the evidence that produced them (traceable to EPIC-002).
3. Signals carry `gapTypes` compatible with ESO `trigger.gapTypes` (Block 2).
4. Signals are scoped to `tenantId`.

## Future Enhancements

- Predictive signals (leading indicators).
- Cross-family signal correlation.
- Automated detector authoring via ESOs (links EPIC-008).

## Development Status

**Implemented.** Detection, classification, priority, timeline, and a working Signal Dashboard screen, since Sprint 2/3.

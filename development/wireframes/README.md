# Wireframes

> Low-fidelity wireframes and flow sketches for HP Enterprise Brain. **Planning artifacts only — no implementation.**

Wireframes describe layout intent and information flow. They are intentionally tool-agnostic and reference the same contracts as the rest of the product layer.

## Relationship to Screens and Contracts

- `development/screens/` defines *what* each screen is for.
- This folder defines *how* it is laid out at a conceptual level.
- Both trace to `contracts/eso/eso.schema.yaml` (12-block ESO), `contracts/taxonomy/root-cause.schema.yaml`, and the `graph/` canonical model.

## Conventions

- One flow/wireframe per file, named `<flow-slug>.md`.
- Keep wireframes text/ASCII only; no embedded UI code.
- Every wireframe notes the Epic and the screen(s) it realizes.

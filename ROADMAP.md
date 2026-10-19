# ROADMAP

This document outlines planned work for upcoming Ribocode versions. It is directional, not a strict guarantee.


## Principles

- Prefer deterministic behavior and strong regression coverage.
- Address bug reports from Ribocode project as the main priority.
- Consider feature requests from Ribocode project as a second priority.
- Refer to issues made via GitHub.


## Planned Versions


### v0.18.x Bug Fixes.
- ...


### v0.19.x Support residue type colour themes.
Goal: Users can already load a colour theme for colouring by chain. Additionally we want to support colouring by residue type.


### v0.20.x Additional controls for camera.
Goal: Allow users to load/save camera position and viewer settings. Support users to navigate using an alpha-numeric control to move to a coordinate, rotate to a vector and choose a camera angle.


### v0.21.x Improve alignment quality.
- Maintain objective benchmark tracking for:
  - 6XU6/6XU8 chain CU -> CU (stable reference case)
  - 7WTT/7WTZ chain e -> e (known weak case)
- Prioritize correspondence and pairing quality improvements over translation-only post-adjustments.
- Investigate and expand automated coverage for residue-correspondence-based chain alignment behavior.
- Accept changes only when weak-case metrics improve without regressing stable-case metrics.

#### Investigation note (2026-10-17): initial load orientation mismatch
- Symptom reported: for 6XU6/6XU8, initial Aligned display in viewer B can appear ~180-degree rotated relative to viewer A before any manual selection/re-align.
- Important constraint: do not rely on pre-selected chains for initial auto-alignment because shared chain identity is not generally known in advance.
- Work attempted:
  - Re-tested historical Molstar alignment boundaries (centroid mapping and shared-atom fallback commits).
  - Tried broader initial atom selector policy (`P` + `C`) for first-load alignment.
  - Tried first-load camera orientation synchronization/re-application between viewers.
  - Tried chain-aware initial alignment payload/correspondence in Molstar.
- Outcome so far:
  - Chain realign metrics remained stable and good for CU->CU.
  - User-observed initial 180-degree presentation issue for 6XU6/6XU8 persisted.
  - No candidate fix produced a clear manual improvement without introducing extra complexity/risk.
- Current decision:
  - Pause this line of investigation and keep runtime behavior unchanged until a clearer reproduction strategy and acceptance criteria are defined.
- Recommended next revisit steps:
  - Add a deterministic first-load orientation diagnostic (separate from chain realign metrics) that compares viewer A/B camera forward/up vectors and projected principal axes immediately after load.
  - Evaluate whether orientation parity should be defined by camera state, structure transform, or a canonical molecular frame.
  - Re-run targeted experiments only after those diagnostics are in place.


## Tracking and Release Notes

- Released functionality is recorded in [CHANGELOG.md](CHANGELOG.md).
- Alignment validation guidance is documented in [DeveloperGuide.md](DeveloperGuide.md#alignment-regression-testing).
- Alignment quality gates and ownership split are documented in [ADR-0001](decisions/ADR-0001-alignment-quality-gates.md).
- This roadmap should be updated when priorities change or major work lands.

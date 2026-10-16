# ROADMAP

This document outlines planned work for upcoming Ribocode versions. It is directional, not a strict guarantee.


## Principles

- Prefer deterministic behavior and strong regression coverage.
- Address bug reports from Ribocode project as the main priority.
- Consider feature requests from Ribocode project as a second priority.
- Refer to issues made via GitHub.


## Planned Versions


### v0.17.x Bug Fixes.
- ...


### v0.18.x Support selection of 2 Chains and residues from each of these. 
Support selection of 2 Chains, residues from each chain, and generally improve residue selection.
Goal: Users can select up to 2 chains for alignment and residue selection. Currently users can only select a single chain and then only select residues from that chain. Residue selection uses a list. As well as a list, users want to be able to select a range using numbers, select by residue types, and have a way to invert selection.


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


## Tracking and Release Notes

- Released functionality is recorded in [CHANGELOG.md](CHANGELOG.md).
- Alignment validation guidance is documented in [DeveloperGuide.md](DeveloperGuide.md#alignment-regression-testing).
- Alignment quality gates and ownership split are documented in [ADR-0001](decisions/ADR-0001-alignment-quality-gates.md).
- This roadmap should be updated when priorities change or major work lands.

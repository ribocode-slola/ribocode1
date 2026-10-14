# ROADMAP

This document outlines planned work for upcoming Ribocode versions. It is directional, not a strict guarantee.

## Principles

- Prefer deterministic behavior and strong regression coverage.
- Address bug reports from Ribocode project as a priority.
- Consider feature requests from Ribocode project as a priority.
- Refer to issues made via GitHub.

## Planned Versions

## v0.17.x (Session and Visual Presets)

- Persist selection-display preferences in session state:
  - Display mode, dim-unselected setting, and intensity controls.
- Add reusable visual presets for common analysis workflows.
- Improve cross-viewer synchronization for visual settings.

## Alignment Quality Investigation (In Progress)

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

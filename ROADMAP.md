# ROADMAP

This document outlines planned work for upcoming Ribocode versions. It is directional, not a strict guarantee.

## Principles

- Prioritize workflows that improve side-by-side structural comparison.
- Keep highlight/selection UX visually clear under overlapping loci.
- Prefer deterministic behavior and strong regression coverage.
- Keep generated documentation output (`docs/`) out of code-focused commits.

## Planned Versions

## v0.16.x (Highlighting and Selection UX)

- Finalize a hybrid selection model:
  - Halo markers for immediate highlight emphasis.
  - Optional per-level colour overlays for structural context.
- Add a display-mode toggle for selection visuals:
  - `Highlight (halo)`
  - `Colour overlay`
  - `Hybrid`
- Add optional "dim unselected" mode:
  - Use a neutral unselected appearance to increase selected-feature contrast.
  - Make dim strength adjustable.
- Ensure deterministic overlay ordering remains:
  - Subunit -> Chain -> Residues.
- Expand regression coverage for visual-state persistence and rendering consistency.

## v0.17.x (Session and Visual Presets)

- Persist selection-display preferences in session state:
  - Display mode, dim-unselected setting, and intensity controls.
- Add reusable visual presets for common analysis workflows.
- Improve cross-viewer synchronization for visual settings.

## v0.18.x (Interaction Quality and Performance)

- Reduce flicker/race conditions in rapid toggle sequences.
- Optimize highlight updates for large structures and dense residue selections.
- Add targeted performance benchmarks for highlight operations.

## v0.19.x (Exploration and Accessibility)

- Add clearer keyboard focus and shortcut support for selection controls.
- Improve ARIA state reporting for nested selection/highlight controls.
- Add visual accessibility presets (contrast-forward palettes and emphasis modes).

## Tracking and Release Notes

- Released functionality is recorded in [CHANGELOG.md](CHANGELOG.md).
- This roadmap should be updated when priorities change or major work lands.

## [v0.8.0] - 2026-06-22
- Updated chain labels to prefer ribosomal `family` names from `RP_name_table_uniprot.csv` (first column), shown in selectors as `<family> [<label>]` when matched.
- Added species-aware RP lookup resolution so each dataset uses the correct homolog column (arabidopsis, drosophila, human, yeast) with robust fallback to all-species mapping.
- Updated chain select option ordering to sort by displayed family label rather than raw chain ID.
- Added regression tests for species-specific CSV parsing, species inference from mmCIF source metadata, family label resolution, and chain option ordering.

## [v0.7.4] - 2026-06-22
- Extended session save/load to persist and restore UI state exactly, including `Residue Zoom` (`extraRadius`, `minRadius`), subunit/chain/residue selections for both columns, sync state, and active viewer.
- Added camera snapshot persistence for both viewers so orientation and zoom radius are restored on session load.
- Added integration coverage for `uiState` save/restore behavior, including regression checks for sync and camera state restoration.

## [v0.7.3] - 2026-06-22
- Fixed residue zoom wiring in `App.tsx` so `Residue Zoom extraRadius` and `minRadius` are passed through to Mol* focus calls.
- Added regression coverage for residue zoom option forwarding in `viewerHelpers` tests.
- Included chain/residue selection reliability fixes and chain label improvements using `RP_name_table_uniprot.csv` lookup data.

## [v0.7.2] - 2026-06-22
- Added per-column `Show Advanced Mol* Controls` / `Hide Advanced Mol* Controls` toggle below each viewer.
- Hid non-canvas Mol* interface panels (sequence, menu, controls, log) by default to reduce UI clutter.
- Kept the core Mol* `3D Canvas` visible, with advanced panels available on demand.

## [v0.7.1] - 2026-05-29
- Save/Load session buttons added.
- Code moved from App.tsx into hooks and components. Constants and Types defined separately. - Tests added for functional files.
- End to End (E2E) testing added using Playwright
  
## [v0.7.0] - 2026-01-02
- Added control to select a subunit to help filter chain selection.
- Commented out `Load Dictionary` and `Load Alignment` buttons.
- Added `Re-align` functionality.
- Added [User Guide](./UserGuide.md) and [Developer Guide](./DeveloperGuide.md).
- Started using [TypeDoc](https://typedoc.org/) to generate API documentation from TypeScript source code and comments.

## [v0.6.0] - 2026-01-01
- Added `Residue Zoom` controls for setting `extraRadius` and `minRadius`.

## [v0.5.1] - 2025-12-28
- General update to css styles and layout.
- Functionality to delete representations added.
- Functionality for zooming to residue.

## [v0.5.0] - 2025-12-24
- Functionality to choose the style of representation with a drop down.

## [v0.4.4] - 2025-12-22
- Added `Select Chain` buttons to select chains for AlignedTo and Aligned data.
- The `Select and Zoom` is replaced by `Zoom to:` buttons for each molecule in each viewer.
- If the viewers are set to sync, then the zoom happens in both. Otherwise the zoom happens only in the viewer where the `Zoom to:` button is actioned.

## [v0.4.3] - 2025-12-20
- Updated README.md
- Added LICENSE
- `Select and Zoom` button now zooms to a specific chain rather than the first atom.  
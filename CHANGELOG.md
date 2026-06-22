## [v0.7.3] - 2026-06-22
- Fixed residue zoom so the `Residue Zoom extraRadius` and `minRadius` settings are forwarded to Mol*.
- Added regression tests for residue zoom option forwarding.
- Kept the `RP_name_table_uniprot.csv` chain label lookup and related chain/residue selection fixes.

## [v0.7.2] - 2026-06-22
- Added per-column `Show Advanced Mol* Controls` / `Hide Advanced Mol* Controls` button below each viewer.
- Advanced Mol* interface panels (sequence, menu, controls, log) are now hidden by default to reduce UI clutter.
- Core Mol* `3D Canvas` remains visible by default, with advanced panels available on demand for power users.

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
# User Guide

Welcome to the ribocode1 User Guide!

## Table of Contents

- [Data and Mol* Aknowledgements](#data-and-mol-aknowledgements)
- [User Interface](#user-interface)
- [Sessions](#sessions)


## Data and Mol* Aknowledgements

In publications, users should acknowledge the data sources used, and the underlying [Mol*](https://github.com/molstar/molstar) technology using a citation along the following lines:
- David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.


## User Interface

The Ribocode User Interface (UI) is best displayed on a screen at a width of 1200 pixels and a height of at least 800 pixels. UI interaction is normally via a mouse and keyboard.

The UI layout is as follows:
 - Title containing the version with a link to this README.
 - `General Controls`
   - `Resdue Zoom` controls
   - `Select Sync` control for synchronization
   - `Re-align to Chains` control
 - Column `A`
   - `Load Molecule`
     - `Load AlignedTo` button for loading the dataset to align to (`AlignedTo`)
     - `Select Controls`
       - `Select Subunit` control
       - `Select Chain` control
       - `Select Residue` control
     - `Load Colours` button
     - `Select Representation` control
   - `MoleculeUI` components including:
     - `AlignedTo`
     - `Aligned`
   - `Mol* Viewer A`
     - `3D Canvas`
     - `Sequence Panel`
     - `Main Menu`
     - `Control Panel`
     - `Log Panel`
 - Column `B`
   - `Load Molecule` 
     - `Load Aligned` button for loading the dataset to be aligned (`Aligned`)
     - `Select Controls`
       - `Select Subunit` control
       - `Select Chain` control
       - `Select Residue` control
     - `Load Colours` button
     - `Select Representation` control
   - `MoleculeUI` components including:
     - `AlignedTo`
     - `Aligned`
   - `Mol* Viewer B`
     - `3D Canvas`
     - `Sequence Panel`
     - `Main Menu`
     - `Control Panel`
     - `Log Panel`
```
+-------------------------------------------------------------+
|           RiboCode Mol* Viewer, Version, README             |
+-------------------------------------------------------------+
|     [General Controls: Residue Zoom | Sync | Re-align]      |
+------------------------------+------------------------------+
|          Column A            |           Column B           |
+------------------------------+------------------------------+
|         Load AlignedTo       |          Load Aligned        |
| Select Subunit/Chain/Residue | Select Subunit/Chain/Residue |
|          Load Colours        |          Load Colours        |
+------------------------------+------------------------------+
|     MoleculeUI AlignedTo     |     MoleculeUI AlignedTo     |
|      MoleculeUI Aligned      |      MoleculeUI Aligned      |
|     MoleculeUI Re-aligned    |     MoleculeUI Re-aligned    |
|              ...             |             ...              |
+------------------------------+------------------------------+
|         Mol* Viewer A        |         Mol* Viewer B        |
|  +------------------------+  |  +------------------------+  |
|  |                        |  |  |                        |  |
|  |                        |  |  |                        |  |
|  |        3D Canvas       |  |  |        3D Canvas       |  |
|  |                        |  |  |                        |  |
|  |                        |  |  |                        |  |
|  +------------------------+  |  +------------------------+  |
|  |     Sequence Panel     |  |  |     Sequence Panel     |  |
|  +------------------------+  |  +------------------------+  |
|  |       Main Menu        |  |  |        Main Menu       |  |
|  +------------------------+  |  +------------------------+  |
|  |      Control Panel     |  |  |      Control Panel     |  |
|  +------------------------+  |  +------------------------+  |
|  |        Log Panel       |  |  |        Log Panel       |  |
|  +------------------------+  |  +------------------------+  |
+-------------------------------------------------------------+
```


## Sessions

A user starting from scratch starts a session by loading a dataset in [CIF](https://www.iucr.org/resources/cif/spec/version1.1) file format via the `Load AlignedTo` button. As the data load, the coordinates for all the atoms are centralized so that the coordinate origin is at the centre.

When the `AlignedTo` dataset is loaded several things happen:
  - The `Select Sync` control becomes actionable.
  - The `Load AlignedTo` button is replaced by the name of the dataset loaded.
  - The `AlignedTo` `Select Subunit` and `Select Chain` buttons become actionable.
  - The `Load Aligned` button becomes actionable.
  - The `MoleculeUI` for `AlignedTo` in both columns populates and becomes actionable.
  - A default `cartoon` style 3D visual representation of the dataset should appear in both `Viewer A` and `Viewer B`.

Next, the user can do several things:
  - Additional representations can be added via the `+` button in the `Representation` component of the `LoadMoleculeUI`. Initially this is set to add a `spacefill` representation, but other representation types can be selected.
  - Representation can be removed from the `MoleculeUI` components using the `x` button.
  - Custom colours for `AlignedTo` representations can be loaded from file via the actionable `Load Colours` button.
  - The 3D representation of the dataset in `Viewer A` can be rotated/zoomed.
  - The 3D representation of the dataset in `Viewer A` can be rotated/zoomed.
  - The `Select Sync` can be changed to `On`.
  - An `Aligned` dataset can be loaded via the `Load Aligned` button.
  - A subunit can be selected in the `Select Subunit` control to reduce the options in the chain can be selected via the `Select Chain` control.
  - A chain can be selected from the `Select Chain` control.
  
* As an `Aligned` dataset is loaded, it's atom positions are centralized and aligned with the centralized `AlignedTo` atom positions using an algorithm.
* If a chain is selected, the `Select Residue` control becomes actionable and in the `Zoom to Chain` control becomes actionable to zoom to the selected chain.
* If a residue is selected, the `Zoom to Residue` control becomes actionable to zoom to the selected residue within the chain. The selected residue will be in the viewer centre. How much is displayed around that depends on the `Residue Zoom` settings.
* If chains are selected for both `AlignedTo` and `Aligned` molecules, the `Re-align` button can be actioned to add a new re-aligned representation to the viewers. Multiple ones of these can be created. They can also be removed.

Ribosome data can be downloaded from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index) in CIF format. Two datasets which align well are: [4ug0](https://files.rcsb.org/download/4UG0.cif); and [6xu8](https://files.rcsb.org/download/6XU8.cif).

Sychronization is `Off` by default. If selected to be `On`, rotation/zoom in one `Mol* 3D Canvas` triggers rotation/zoom in the other.

Please refer to the [Mol* viewer Documentation](https://molstar.org/viewer-docs/) for details of the Mol* UI. In the Ribocode `Molstar Container`, the `Mol* 3D Canvas` is at the top followed by the `Mol* Sequence Panel`, `Mol* Main Menu`, `Mol* Control Panel` and `Mol* Log Panel`. The Mol* viewer style is adapted so that the UI fits in a column of 600 pixels in width. 

For convenience, users can save and load a session via the Session Menu. Loading a session does not load the data. For security reasons data loading is a manual process, but once the `AlignedTo` and `Aligned` data are selected, the representations are recreated and the loaded session should be in the state it was when the session was saved.

---
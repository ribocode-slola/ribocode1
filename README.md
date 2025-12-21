[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
A React Progressive Web App (PWA) Graphical User Interface (GUI) visualisation tool for the Ribocode Project. The latest release is available online via GitHub Pages at the following URL:
* https://ribocode-slola.github.io/ribocode1/

The PWA can be installed using the latest versions of most Web browsers and then used offline. The interface is designed to be intuitive. Start by loading a molecule file in CIF format, e.g [4ug0](https://files.rcsb.org/download/4UG0.cif). Then load another molecule, e.g. [6xu8](https://files.rcsb.org/download/6XU8.cif). (Those downloads are from the from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index).)

Ribocode is based on [Mol*](https://github.com/molstar/molstar). The GUI contains two Mol* viewers which on a normal sized screen appear side by side. These are in in their own container with some additional GUI controls for ease of use. There are buttons for loading molecules into both viewers, styling how these are visualised, and selecting parts of these to look at more closely. Viewer sychronization can be activated and deactivated. When activated rotation/zoom in one viewer causes rotation/zoom in the other. When deactivated zoom/rotation in each viewer is independent. Please refer to the [Mol* Viewer Documentation](https://molstar.org/viewer-docs/) for information about the controls and how to zoom/rotate. In Ribocode, the 3D Canvas of each Mol* viewer should appear above the sequence panel, main menu, control panel and log panel in that order.  

Ribocode is being developed to help researchers study the 3D strucutre of [ribosomes](https://en.wikipedia.org/wiki/Ribosome) and compare static 3D ribosome datasets. UKRI funded Ribocode development under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1). For more details of the project please see the [Ribocode Website](https://ribocode.org/)

When using Ribocode, please also cite Mol* using the following:

David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.


## Source Code

The main application code is in `App.tsx`. The App contains two RibocodeViewers as defined by `RibocodeViewer.tsx`. Each RibocodeViewer contains a MolstarContainer containing a Mol* viewer. `SyncButton.tsx` and `SyncContext.txt` contains GUI component and synchronisation logic code.

The `utils` directory contains:
* `colors.tsx` - code for applying different colours in molecule visualisation
* `data.tsx` - code for loading data into the Mol* viewers.
* `dictionary.tsx` - code to help identify different chains in ribosomes of different species which can have different codes.

Mol* is added as a workpackage inside Ribocode in the `workpackage/molstar` directory.


## Building and Running

### Platform Build Environment
* [node](https://nodejs.org/) 24.11.0

### Set up
1. Clone the Ribocode repository.
2. ```cd src/packages```
3. Clone [Ribocode Mol*](https://github.com/ribocode-slola/molstar) into `src/packages`.

### Build and run locally
From the Ribocode root directory run:
```npm install```
```npm run dev```
```npm run preview```


## Development
Ribocode is being developed at the [University of Leeds](https://www.leeds.ac.uk) as part of the Ribocode project. Ribocode project partners are encouraged to get involved in development by creating issues which can be feature requests as well as raising awareness of problems. To contribute source code, please fork your own copy of the repository and submit pull requests against this. With your own repository you can serve out the gh-pages branch on GitHub pages to test the PWA before creating a pull request using:
```npm run deploy```

To get the PWA working on your repository GitHub Pages, these need to be set up to serve the `gh-pages` branch.

If you want help please reach out. 

We aim to release Version 1 in 2026 and organise automated checks to welcome contributions from the wider community.

As of [v0.4.3] there is a CHANGELOG.md which outlines changes.

### Task List
1. Allow users to select a chain to zoom to. Currently this is hardcoded to a specific chain which may only work for the test 4ug0 dataset.
2. When zooming to selection, allow zoom to the specific viewer if synchronisation is off.
3. Use dictionary to look up chain ids to color and zoom to the same chains in datasets for different species.
4. Load colours created a 'spacefill' representation every time. It would be goodd for the user to be able to choose other representations.
5. Each representation wants an easy access on/off visibility button.

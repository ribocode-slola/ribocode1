[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
A React Progressive Web App (PWA) Graphical User Interface (GUI) visualisation tool for the Ribocode Project. The latest release is available online via GitHub Pages at the following URL:
* https://ribocode-slola.github.io/ribocode1/

The PWA can be installed using the latest versions of most Web browsers and then used offline.

Ribocode is based on [Mol*](https://github.com/molstar/molstar). It effectively contains two Mol* viewers each in their own container with some additional GUI controls for ease of use. There are buttons for loading molecules into both viewers, styling how these are visualised, and selecting parts of these to look at more closely. Viewer sychronization can be activated and deactivated. When activated rotation and zoom in one viewer rotates and zooms in the other viewer accordingly. When deactivated zoom and rotation in each viewer is independent.

Ribocode is being developed to help researchers studying and comparing ribosome datasets. UKRI funded Ribocode development under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1). For more details of the project please see the [Ribocode Website](https://ribocode.org/)

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

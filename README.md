[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
Ribocode is a Graphical User Interface (GUI) visualisation tool for the Ribocode Project. It is deployed on GitHub Pages as a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps):
* https://ribocode-slola.github.io/ribocode1/

The user needs a recent Web browser. Once installed it can be used offline. Ribocode is based on [React](https://react.dev/), and has been developed using [Vite](https://vite.dev/). The source code is mostly [TypeScript](https://www.typescriptlang.org/)

The GUI is hopefully intuitive to use and is best displayed on a typical landscape computer screen. Users start by loading a molecule to align to - a [CIF](https://www.iucr.org/resources/cif/spec/version1.1) format file. When loaded two viewers display the molecule in a default style. Users can then change the style and explore the data. Typically another molecule is loaded and displayed over the first molecule loaded after being automatically aligned. How well the algorithm aligns the data depends on how similar the molecules are. With both datasets loaded, they can be explored together in a visual way.

Ribosome data can be downloaded from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index) in CIF format: e.g. [4ug0](https://files.rcsb.org/download/4UG0.cif) - a human ribosome dataset; and [6xu8](https://files.rcsb.org/download/6XU8.cif) - a fruit fly ribosome dataset.

Ribocode is based on [Mol*](https://github.com/molstar/molstar). On a typcialy screen, two different Mol* viewers should appear side by side. Viewer sychronization can be activated and deactivated. When activated rotation/zoom in one viewer triggers rotation/zoom in the other. When deactivated zoom/rotation in each viewer is independent. Please refer to the [Mol* Viewer Documentation](https://molstar.org/viewer-docs/) for information about the Mol* controls and how to zoom/rotate using the mouse and keyboard. In Ribocode, the 3D Canvas of each Mol* viewer should appear above the sequence panel, main menu, control panel and log panel.

Ribocode is being developed to help researchers study the 3D strucutre of [ribosomes](https://en.wikipedia.org/wiki/Ribosome) and compare static 3D ribosome datasets. [UKRI](https://www.ukri.org/) are funding Ribocode development under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1). For more details of the project please see the [Ribocode Website](https://ribocode.org/)

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
1. Load colours created a 'spacefill' representation every time. It would be goodd for the user to be able to choose other representations.
2. Each representation wants an easy access on/off visibility button.
3. There is a dictionary for looking up Use dictionary to look up chain ids to color and zoom to the same chains in datasets for different species.

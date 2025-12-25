[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
Ribocode is for comparing [ribosome](https://en.wikipedia.org/wiki/Ribosome) data in [3D](https://en.wikipedia.org/wiki/Three-dimensional_space). There is a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) deployment via GitHub Pages:
* https://ribocode-slola.github.io/ribocode1/

This is generally available for use and can be easily duplicated. The user requires a recent [Web browser](https://en.wikipedia.org/wiki/Web_browser) (e.g. [Firefox](https://www.firefox.com/)) that will run [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript). Installed as a PWA, it can be used offline. Ribocode is based on [Node](https://nodejs.org/), [React](https://react.dev/) and [Mol*](https://github.com/molstar/molstar), and is mostly written in [TypeScript](https://www.typescriptlang.org/).

The interface is best displayed on a landscape computer screen. Interaction is generally easiest with a 3 button mouse and keyboard. Start by loading a ribosome dataset in [CIF](https://www.iucr.org/resources/cif/spec/version1.1) format file. The two viewers should display the data in 3D. The default style can be changed and the user can rotate and zoom in out. Another dataset can be loaded and aligned with the dataset first loaded using an algorithm.

Ribosome data can be downloaded from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index) in CIF format: e.g. [4ug0](https://files.rcsb.org/download/4UG0.cif); and [6xu8](https://files.rcsb.org/download/6XU8.cif).

Viewers can be sychronized so that rotation/zoom in one viewer triggers rotation/zoom in the other. Please refer to the [Mol* Viewer Documentation](https://molstar.org/viewer-docs/) for information on Mol* user interface elements and how to zoom/rotate using the mouse and keyboard. In Ribocode, the 3D Canvas of each Mol* viewer should appear above the sequence panel, main menu, control panel and log panel.

Ribocode is being developed as part of the [Ribocode project](https://ribocode.org/) funded by [UKRI](https://www.ukri.org/) under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1).

If you use Ribocode, please also cite Mol* using the following:

David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.


## Source Code Overview

- The main application code is in `App.tsx`. The `App` contains two `RibocodeViewers` as defined by `RibocodeViewer.tsx`. Each `RibocodeViewer` contains a `MolstarContainer` containing a Mol* viewer.
- `SyncButton.tsx` and `SyncContext.txt` contain the code for synchronizing the viewers.
- The `utils` directory contains:
  - `colors.tsx` - code for applying different colours in molecule visualisation
  - `data.tsx` - code for loading data into the Mol* viewers.
  - `dictionary.tsx` - code to help identify different chains in ribosomes of different species which can have different codes.

Mol* is added as a workpackage in the `src/workpackage/molstar` directory.


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
Ribocode project particiapnats are encouraged to get involved in development by providing feedback which can be done by raising issues. To contribute source code, please fork your own copy of the repository and submit pull requests against this. With your own repository you can serve out the gh-pages branch on GitHub pages to test the PWA using:
```npm run deploy```

To get the PWA working on your repository GitHub Pages, the repository needs configuring to serve the `gh-pages` branch.

It would be good to organise automated checks to manage contributions.

As of [v0.4.3] there is a [CHANGELOG](./CHANGELOG.md) which outlines changes.
[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
Ribocode is for comparing [ribosome](https://en.wikipedia.org/wiki/Ribosome) data in [3D](https://en.wikipedia.org/wiki/Three-dimensional_space). There is a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) deployment via GitHub Pages that is generally available for use and can be easily duplicated:
* https://ribocode-slola.github.io/ribocode1/

Users require a recent [Web browser](https://en.wikipedia.org/wiki/Web_browser) (e.g. [Firefox](https://www.firefox.com/)) that will run [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

Installed as a PWA, Ribocode can be used offline. Ribocode development is based on [Node](https://nodejs.org/), [React](https://react.dev/) and [Vite](https://vite.dev/). Ribocode uses [Mol*](https://github.com/molstar/molstar) extensively, and is mostly written in [TypeScript](https://www.typescriptlang.org/).

The interface is best displayed on a landscape computer screen with a width of 1200 pixels. Interaction is generally easiest with a 3 button mouse and keyboard.

Start by loading a ribosome dataset in [CIF](https://www.iucr.org/resources/cif/spec/version1.1) file format. Two Mol* containers should display the data in 3D in a default `cartoon` style. More representation styles can be added. The first molecule loaded is `Aligned To`. Custom colours for representations can be loaded from file. Representations can be removed. The user can rotate and zoom. An `Aligned` dataset can be loaded. This is automatically aligned with the `Aligned To` dataset using an algorithm.

Ribosome data can be downloaded from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index) in CIF format. Two datasets which align quite well are: [4ug0](https://files.rcsb.org/download/4UG0.cif); and [6xu8](https://files.rcsb.org/download/6XU8.cif).

Sychronization is `Off` by default. If selected to be `On`, rotation/zoom in one `Mol* 3D Canvas` triggers rotation/zoom in the other. Please refer to the [Mol* Viewer Documentation](https://molstar.org/viewer-docs/) for information on Mol* user interface elements and how to zoom/rotate using the mouse and keyboard. In Ribocode, the `Mol* 3D Canvas` appears above the other Mol* panels: sequence, main menu, control and log.

Ribocode is being developed as part of the [Ribocode project](https://ribocode.org/) funded by [UKRI](https://www.ukri.org/) under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1).

If you use Ribocode, please also cite Mol* using the following:

David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.


## Source Code Overview

- The main application code is in `App.tsx`. The `App` contains a title, some genral controls, then two columns each containing a `LoadDataRow`, an `Aligned To` `MoleculeRow` and an `Aligned` `Molecule Row`, and a `MolstarContainer` containing a Mol* viewer.
- Mol* is a workpackage in the `src/workpackage/molstar` directory.
- There are the following directories:
  - `components` contains code for different components.
  - `context` is for code that defines and exports React Contexts and their provider such as for synchronization.
  - `hooks` for custom React hooks — reusable functions that encapsulate stateful logic or side effects such as for interacting with Mol* viewers.
  - `types` contains code for types.
  - `utils` directory contains:
    - `Chain.tsx` - code for getting chain identifiers for molecules.
    - `Colors.tsx` - code for creating colour themes.
    - `Data.tsx` - code for loading data into the Mol* viewers.
    - `Dictionary.tsx` - code for mapping across ribosomes of different species.


## Building and Running
Main dev dependencies:
- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/)

### Recommended set up
1. Fork the Ribocode repository.
2. Clone the fork into a local directory (Ribocode root).
3. Change to the `src/packages` directory.
4. Clone [Ribocode Mol*](https://github.com/ribocode-slola/molstar) into `src/packages`.

### Build and run locally
From the Ribocode root directory run:
* ```npm install```
  - This should install all the other Ribocode dependencies.
* ```npm run dev```
  - This should build and start the development server.
* ```npm run preview```
  - This should launch a preview in our default Web browser.


## Development
Ribocode project participants are encouraged to get involved in development by providing feedback.

One way to provide feedback is to look at open [issues](https://github.com/ribocode-slola/ribocode1/issues), comment on these and create new ones as appropriate.

To contribute source code, please submit `pull requests` against your fork.

Serve out the `gh-pages` branch for your fork on `GitHub Pages` to create a PWA deployment. Deploy to this using the following command:
* ```npm run deploy```

The [Ribocode Mol*](https://github.com/ribocode-slola/molstar) is essentially Mol* 5.4.2 with some files added for Ribocode that might be generally useful for Mol* and are in [Mol* Pull Request #1726](https://github.com/molstar/molstar/pull/1726).

It is perhaps a good idea to organise automated checks to manage contributions...

As of [v0.4.3] there is a [CHANGELOG](./CHANGELOG.md) which focuses on User Interface changes, but might mention major refactoring. Full details of development is captured on GitHub.

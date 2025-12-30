[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
Ribocode provides a User Interface (UI) and algorithms for visualising and comparing [ribosome](https://en.wikipedia.org/wiki/Ribosome) data in [3D](https://en.wikipedia.org/wiki/Three-dimensional_space). It is deployed as a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) via GitHub Pages that can be easily duplicated. The latest vesion is released at the following URL:
* https://ribocode-slola.github.io/ribocode1/

The user requires a recent [Web browser](https://en.wikipedia.org/wiki/Web_browser) (e.g. [Firefox](https://www.firefox.com/)) that will run [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

Once installed as a PWA, Ribocode can be used offline.

Ribocode uses [Mol*](https://github.com/molstar/molstar) extensively. If you use Ribocode, please cite Mol* as follows:

David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.

Ribocode source code is mostly [TypeScript](https://www.typescriptlang.org/). Development and deployment uses [Node](https://nodejs.org/), [React](https://react.dev/), [Vite](https://vite.dev/), [Git](https://git-scm.com/) and [GitHub](https://github.com/). 

The Ribocode UI is best displayed on a screen at a width of 1200 pixels and a height of at least 800 pixels. Users are generally expected to interact via a mouse and keyboard. At the top of the UI is a title containing the version with a link to this README. Next is a `General Controls` component containing a `Select Sync` control for synchronization, a `Load Dictionary` button and a `Load Alignment` button. The rest of the UI is in two columns: `A` and `B`. In column `A`, the `Load Molecule` section contains a `Load AlignedTo` button. In column `B`, the `Load Molecule` section contains a `Load Aligned` button. These are for loading the dataset to align to and the dataset that is aligned respectively. The `Load Molecule` components also contain a `Select Chain` control, a `Select Residue` control, a `Load Colours` button, and a `Select Representation` control. After the `Load Molecule` component thers is a `MoleculeUI` component in each column. Each `MoleculeUI` component is comprised of an `AlignedTo` and `Aligned` component. After each `MoleculeUI` component is a `Molstar Container` each containing a `Mol* viewer`. The `Mol* viewer` in column `A` is referred to as `Viewer A` and the `Mol* viewer` in column `B` is referred to as `Viewer B`. 

A user session starts by loading a dataset in [CIF](https://www.iucr.org/resources/cif/spec/version1.1) file format via the `Load AlignedTo` button. As the data load, the coordinates for all the atoms are centralized so that the coordinate origin is at the centre.

When that dataset is loaded several things happen:
  - The `Select Sync` control becomes actionable.
  - The `Load AlignedTo` button is replaced by the name of the dataset loaded.
  - The `AlignedTo` `Select Chain` button becomes actionable.
  - The `Load Aligned` button becomes actionable.
  - The `MoleculeUI` for `AlignedTo` in both columns populates and becomes actionable.
  - A default `cartoon` style 3D visual representation of the dataset should appear in `Viewer A` and `Viewer B`.

So, the user can do several things next:
  - Additional representations can be added via the `+` button in the `Representation` component of the `LoadMoleculeUI`.
  - Representations can be removed from the `MoleculeUI` components using the `x` button.
  - Custom colours for `AlignedTo` representations can be loaded from file via the actionable `Load Colours` button.
  - The 3D representation of the dataset in `Viewer A` can be rotated/zoomed.
  - The 3D representation of the dataset in `Viewer A` can be rotated/zoomed.
  - The `Select Sync` can be changed to `On`.
  - An `Aligned` dataset can be loaded via the `Load Aligned` button.
  
If an `Aligned` dataset is loaded, it's atom posisitons are centralized and aligned with the loaded `AlignedTo` atom positions using an algorithm.

Ribosome data can be downloaded from the [RCSB Protein Data Bank](https://www.rcsb.org/pages/about-us/index) in CIF format. Two datasets which align quite well are: [4ug0](https://files.rcsb.org/download/4UG0.cif); and [6xu8](https://files.rcsb.org/download/6XU8.cif).

Sychronization is `Off` by default. If selected to be `On`, rotation/zoom in one `Mol* 3D Canvas` triggers rotation/zoom in the other.

Please refer to the [Mol* viewer Documentation](https://molstar.org/viewer-docs/) for details of the Mol* UI. In the Ribocode `Molstar Container`, the `Mol* 3D Canvas` is at the top followed by the `Mol* Sequence Panel`, `Mol* Main Menu`, `Mol* Control Panal` and `Mol* Log Panel`.

Ribocode is being developed as part of the [Ribocode project](https://ribocode.org/) funded by [UKRI](https://www.ukri.org/) under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1).


## Source Code Overview

- Configuration files are in the top level directory which will also contain directories for dependencies and built artefacts. There is also a `packages` directory and a `src` directory.
- Mol* is in the `packages/molstar` directory.
- The `src` directory contains:
  - `App.tsx` contains the top level application code and UI [JSX](https://www.typescriptlang.org/docs/handbook/jsx.html).
  - `App.css` a [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) for styling all components.
  - `components` is a directory containing code for UI components.
  - `context` is a directory for React context files that define and export context objects and providers, which allow for sharing state and functions across different components. This contains `SyncContext.tsx` which is the basis for synchronization between `Mol* viewers`.
  - `hooks` is a directory for [custom React hooks](https://react.dev/learn/reusing-logic-with-custom-hooks#extracting-your-own-custom-hook-from-a-component) code — reusable functions that encapsulate stateful logic or side effects such as for interaction with `Mol* viewers`.
  - `types` is a directory dependency types and contains `molstar.d.ts` - the types for `Mol*`. 
  - `utils` is a directory containing:
    - `Chain.tsx` - code for processing molecule assembly chains.
    - `Residue.tsx` - code for processing molecule assmebly residues.
    - `Colors.tsx` - code for creating Mol* colour themes.
    - `Data.tsx` - code for loading data into Mol* viewers.
    - `Dictionary.tsx` - code for mapping across datasets.
  - `public` is a directory containing static assets needed for the PWA function correctly.
  - `main.tsx` is the entry point for the React application. It is responsible for rendering the root App component into the HTML element with the id root. It applies global styles (like App.css), and wraps the app in React connects it to the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).
  - `service-worker.ts` contains the code for the [PWA service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), which is a script that runs in the background of the user's Web browser. It caches assets, enables offline functionality, and handles push notifications.
  - `serviceWorkerRegistration.ts` contains the code responsible for (un)registering the service worker. It contains code that checks if service workers are supported, and then registers the service-worker.ts file so the Web browser knows to use it.
  

## Building and Running
Main dev dependencies:
- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/)

### Recommended set up
1. Fork the Ribocode repository.
2. Clone the fork into a local directory (Ribocode root).
3. Change to the `packages` directory.
4. Clone [Ribocode Mol*](https://github.com/ribocode-slola/molstar) into `packages`.

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

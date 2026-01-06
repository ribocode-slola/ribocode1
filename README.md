[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)

# Ribocode
Ribocode orchestrates a User Interface (UI) based on two styled [Mol*](https://github.com/molstar/molstar) viewers and is specifically geared for comparing two [ribosome](https://en.wikipedia.org/wiki/Ribosome) datasets in [3D](https://en.wikipedia.org/wiki/Three-dimensional_space). It is deployed as a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) via GitHub Pages that can be easily duplicated. The latest vesion is released at the following URL:
* https://ribocode-slola.github.io/ribocode1/

The user requires a recent [Web browser](https://en.wikipedia.org/wiki/Web_browser) (e.g. [Firefox](https://www.firefox.com/)) that will run [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

Once installed as a PWA, Ribocode can be used offline.

In publications, users should acknowledge the data sources used, and the underlying [Mol*](https://github.com/molstar/molstar) technology using a citation along the following lines:
- David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: [Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314), *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314.

Ribocode source code is mostly [TypeScript](https://www.typescriptlang.org/). The UI is based on the [React](https://react.dev/) library. Build and deployment is based on [Node](https://nodejs.org/) and [Vite](https://vite.dev/). General deployment is via [GitHub](https://github.com/). Other key teachnologies used for development include [Git](https://git-scm.com/), [GitHub Copilot](https://docs.github.com/en/copilot) and [Visual Studio Code](https://code.visualstudio.com/).

The Ribocode UI is best displayed on a screen at a width of 1200 pixels and a height of at least 800 pixels. UI interaction is normally via a mouse and keyboard.

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

```mermaid
flowchart TD
    A[App Title & Version]
    B[General Controls<br/>(Subunit Select, Sync, Re-align, etc.)]
    subgraph VIEWERS[ ]
        direction LR
        C1[Viewer A<br/>MoleculeUI<br/>[Representations, Zoom, Remove]]
        C2[Viewer B<br/>MoleculeUI<br/>[Representations, Zoom, Remove]]
    end

    A --> B
    B --> VIEWERS
```
```
flowchart TD
    A[App Title, Version, README link]
    B[General Controls]
    C1[Column A]
    C2[Column B]
    D1[Load Molecule AlignedTo]
    D2[Load Molecule Aligned]
    E1[MoleculeUI]
    E2[MoleculeUI]
    F1[Molstar Viewer A]
    F2[Molstar Viewer B]

    A --> B
    B --> C1
    B --> C2
    C1 --> D1
    C2 --> D2
    D1 --> E1
    D2 --> E2
    E1 --> F1
    E2 --> F2
```

A user session starts by loading a dataset in [CIF](https://www.iucr.org/resources/cif/spec/version1.1) file format via the `Load AlignedTo` button. As the data load, the coordinates for all the atoms are centralized so that the coordinate origin is at the centre.

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

Ribocode is being developed as part of the [Ribocode project](https://ribocode.org/) funded by [UKRI](https://www.ukri.org/) under research grant [BB/X003086/1](https://gtr.ukri.org/projects?ref=BB%2FX003086%2F1).


## Source Code Overview

- Configuration files are in the top level directory. There is also a `packages` directory and a `src` directory.
- [Ribocode Mol*](https://github.com/ribocode-slola/molstar) is to be located in the `packages/molstar` directory.
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
- There is code written that is in the code base, but is currently not being used:
* `Load Dictionary` and `Load Alignment` components have been written to load dictionary data and alignment data, but other than loading the data and logging it, nothing was being done with it, so the button components are currently hidden.
* There are also UI components to control visualisation including controls for `fog` and `near` and `far` planes. These are not working properly yet and the UI components re hidden.
  

## Building
You will need [Git](https://git-scm.com/) to clone the repository and [Node](https://nodejs.org/). It is recommended to use Node version 24.11.0 or later. With these installed you can make a start by cloning from https://github.com/ribocode-slola/ribocode1 e.g.:
* ```git clone https://github.com/ribocode-slola/ribocode1.git```

### Recommended set up
1. Fork the Ribocode repository.
2. Clone the fork into a local directory (Ribocode root).
3. Change to the `packages` directory.
4. Clone [Ribocode Mol*](https://github.com/ribocode-slola/molstar) into `packages`.

### Build and run locally
From the Ribocode root directory run:
* ```npm install```
  - This should install all the other Ribocode dependencies.
  - The root directory will be populated with dependencies.
* ```npm run dev```
  - This should build and start the development server.
  - The root directory will be populated with built artefacts. 
* ```npm run preview```
  - This should launch a preview in our default Web browser.


## Development
Ribocode project participants and Scientific Advisory Board members are encouraged to get involved in development by providing feedback, in particular describing what can be improved and what additional features are wanted.

A good way to provide feedback is to comment on and create [issues](https://github.com/ribocode-slola/ribocode1/issues).

If you want help getting set up with a development environment or help contributing via a `pull request`, please let it be known.

To serve out the `gh-pages` branch for your fork on `GitHub Pages` to create a PWA deployment use the following command:
* ```npm run deploy```

[Ribocode Mol*](https://github.com/ribocode-slola/molstar) is essentially [Mol*](https://github.com/molstar/molstar) Version 5.4.2 with some files added for Ribocode that might be generally useful for Mol*. These are being contributed via [Mol* Pull Request #1726](https://github.com/molstar/molstar/pull/1726), but if this does not happen, they will be folded back into Ribocode to make it easier to build on later versions of Mol*.

It is perhaps a good idea to organise automated checks to manage contributions...

As of [v0.4.3] there is a [CHANGELOG](./CHANGELOG.md) which summarises changes, particularly changes to the UI or key underlying functionaility.

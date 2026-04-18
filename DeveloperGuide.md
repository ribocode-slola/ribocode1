# Developer Guide

Welcome to the Ribocode Developer Guide!

## Table of Contents

- [Setup](#setup)
- [Source Code Overview](#source-code-overview)
- [Mol*](#mol*)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Tests](#tests)
- [Contributing](#contributing)


## Setup

You will need [Git](https://git-scm.com/) to clone the repository and [Node](https://nodejs.org/). It is recommended to use Node version 24.11.0 or later. With these installed you can make a start by forking https://github.com/ribocode-slola/ribocode1 and then cloning the fork locally.

If you are a member of the Ribocode project and want help getting set up with a development environment or help contributing via a `pull request`, please let it be known.


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
  - This should launch a preview in your default Web browser.


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


## Mol*

Ribocode depends upon a customised version of [Mol*](https://github.com/molstar/molstar) - [Ribocode Mol*](https://github.com/ribocode-slola/molstar). This is currently Mol* Version 5.4.2 with some files added for Ribocode that might be generally useful for Mol*. These are being contributed via [Mol* Pull Request #1726](https://github.com/molstar/molstar/pull/1726), but if this does not happen, they will be folded back into Ribocode to make it easier to build on later versions of Mol*.


## Documentation

This project uses [TypeDoc](https://typedoc.org/) to generate API documentation from TypeScript source code and comments. There is a [User Guide](./UserGuide.md) to help users to use Ribocode.

There is a [CHANGELOG](./CHANGELOG.md) which summarises changes, particularly changes to the UI or key underlying functionality.


### How to Generate Documentation

- Documentation is generated into the `docs/` directory.
- To generate or update the documentation, run:
	```sh
	npm run docs -- --entryPointStrategy expand
	```
- The documentation will be available as static HTML files in the `docs/` folder.


### Configuration

- The TypeDoc configuration is in `typedoc.json` at the project root.
- The entry point is the `src/` directory.
- You can customize the output and included files by editing `typedoc.json`.


### Deployment Recommendation

- If you are using GitHub Pages for your PWA, you can serve the documentation alongside your app by ensuring the `docs/` directory is included in your deployment. For example, you can link to `https://<username>.github.io/<repo>/docs/index.html` from your site or README. This allows users to access both the app and the documentation from the same domain.

### Useful Links

- [TypeDoc documentation](https://typedoc.org/guides/doccomments/)


## Deployment

To serve out the `gh-pages` branch for your fork on `GitHub Pages` to create a PWA deployment use the following command:
* ```npm run deploy```


## Tests

This project uses [Jest](https://jestjs.io/) and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) for unit and component testing.


### Creating Tests

- Test files should be placed alongside the code they test, using the `.test.ts` or `.test.tsx` extension.
- Use descriptive test names and group related tests with `describe` blocks.
- Example test file:

```tsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders the component', () => {
	render(<MyComponent />);
	expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Running Tests

- To run all tests:
	```sh
	npm test
	```
- To run tests in watch mode (re-runs on file changes):
	```sh
	npm test -- --watch
	```
- To run a specific test file:
	```sh
	npm test -- src/components/MyComponent.test.tsx
	```

### Additional Resources

- [Jest documentation](https://jestjs.io/docs/getting-started)
- [Testing Library docs](https://testing-library.com/docs/)


## Contributing

If you contribute changes, please submit a Pull Request that includes documentation updates and if appropriate includes tests. Please add you details to the list of contributors and to the list of authors in the header of any source files modified.
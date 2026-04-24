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


#### Local Development

From the Ribocode root directory:

* `npm install`
  - Installs all dependencies.
* `npm run dev`
  - Starts the Vite development server using settings from `.env` (base path is `/`).
  - Visit the local URL shown in the terminal (usually http://localhost:5173/).

#### Production Build & Preview

* `npm run build`
  - Builds the app for production using settings from `.env.production` (base path is `/ribocode1/`).
  - Output is placed in the `dist/` directory.
* `npm run preview`
  - Serves the production build locally for testing (simulates deployment).
  - Visit the local preview URL (usually http://localhost:4173/ribocode1/).

#### Notes on Environment Files

- `.env` is used for local development (base path `/`).
- `.env.production` is used for production builds (base path `/ribocode1/`).
- The correct environment file is automatically picked up by the npm scripts.

#### Deployment

* `npm run deploy`
  - Builds and deploys the app to the `gh-pages` branch for GitHub Pages.
  - The app will be available at `https://<username>.github.io/ribocode1/`.


## Source Code Overview

Configuration files are in the top-level directory. The main source code is in the `src` directory, with additional dependencies in `packages`.

- [Ribocode Mol*](https://github.com/ribocode-slola/molstar) is located in the `packages/molstar` directory.
- The `src` directory contains:
  - `App.tsx`: The top-level application component, responsible for composing the main UI and wiring together state, providers, and layout.
  - `App.css`: Global CSS for styling all components.
  - `App.test.tsx`: Basic test for the App component.
  - `components/`: UI components, including ViewerColumn, GeneralControls, AppHeader, and others. Each major component typically has a corresponding `.test.tsx` file for tests.
  - `context/`: React context providers and objects for sharing state and logic (e.g., SelectionContext, SyncContext, ViewerStateContext).
  - `handlers/`: Event and UI handler logic, such as `uiHandlers.ts` for shared UI event logic.
  - `hooks/`: Custom React hooks for encapsulating stateful logic and side effects (e.g., useMolstarViewer, useMoleculeLoader, useUpdateColors, useSessionSave, etc.).
  - `constants/`: Centralized runtime constants (e.g., ribocode.ts for alignment and viewer key constants).
  - `types/`: Shared TypeScript types and interfaces (e.g., ribocode.ts for core app types, molstar.d.ts for Mol* types).
  - `utils/`: Utility functions and helpers for data processing, color themes, structure manipulation, and viewer helpers. Includes files like `chain.ts`, `residue.ts`, `colors.ts`, `data.ts`, `dictionary.ts`, `structureUtils.ts`, and `viewerHelpers.ts` (with corresponding test files).
  - `public/`: Static assets for the PWA (e.g., icons, manifest, robots.txt).
  - `main.tsx`: Entry point for the React application. Renders the root App component and applies global styles.
  - `service-worker.ts`: The PWA service worker for offline support and caching.
  - `serviceWorkerRegistration.ts`: Registers or unregisters the service worker as needed.

Notes:
- Some UI components for loading dictionary/alignment data and for advanced visualization controls (e.g., fog, camera planes) exist but may be hidden or under development.
- All major logic is modularized for maintainability, with helpers, types, and constants extracted to their own files.


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

This project uses [Vitest](https://vitest.dev/) and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) for unit and component testing. Vitest is a modern, fast test runner with native ESM support, ideal for Vite-based projects.


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
- To run the interactive UI test runner:
  ```sh
  npm run test:ui
  ```
- To run a specific test file:
  ```sh
  npm test -- src/components/MyComponent.test.tsx
  ```

### Additional Resources

- [Vitest documentation](https://vitest.dev/guide/)
- [Testing Library docs](https://testing-library.com/docs/)


## Contributing

If you contribute changes, please submit a Pull Request that includes documentation updates and, if appropriate, includes tests.

**Please add your name to the CONTRIBUTORS file in the repository when you make a contribution.**
Also, add your details to the list of authors in the header of any source files you modify.

For contribution ideas, bug reports, or feature requests, please visit the [GitHub Issues page](https://github.com/ribocode-slola/ribocode1/issues).
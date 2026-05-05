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
  - `session.integration.test.tsx`: Integration tests for session-related flows, such as session load/save, file input triggers, and modal appearance. Use this file for tests that simulate user workflows involving session management, rather than placing them in App.test.tsx or App.integration.test.tsx.
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



### Test File Structure

- **Unit/component tests**: Use `.test.ts` or `.test.tsx` files placed alongside the code they test (e.g., `App.test.tsx`, `components/ComponentName.test.tsx`).
- **Integration tests**: For flows involving multiple components or user workflows, use dedicated integration test files. For example:
  - `App.integration.test.tsx`: General integration tests for the main app UI and multi-component flows.
  - `session.integration.test.tsx`: Integration tests focused on session management (session save/load, file input, modal prompts, etc.).

This separation keeps tests organized and maintainable as the codebase grows.

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



## End-to-End (E2E) Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for end-to-end (E2E) browser testing. Playwright enables automated UI testing in real browsers, ensuring that real-world user workflows (including session save/load and dataset handling) work as expected.

### E2E Test Structure

- E2E tests are located in the `e2e/` directory at the project root.
- Real-world test datasets (e.g., `4UG0.cif`, `6XU8.cif`) are stored in `data/input/`.
- Example E2E tests:
  - `e2e/example-session.spec.ts`: Demonstrates loading a dataset, interacting with the UI, and verifying session logic.
  - `e2e/session-load.e2e.spec.ts`: Covers the full session load workflow, including file selection modal and session restoration.


### System Dependencies for Playwright (Linux)


Playwright's browsers (especially Chromium) require certain system libraries to be installed on Linux. If you see errors like:

  error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory


You need to install the missing libraries. On Ubuntu/Debian, run:


```sh
sudo apt-get update
sudo apt-get install libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libgtk-3-0 libxss1 libxshmfence1 libxfixes3 libxext6 libx11-xcb1
```

> **Note:** On some newer Ubuntu/Debian systems, `libasound2` may be provided as `libasound2t64`. If you see a message like:
>
>     Package libasound2 is a virtual package provided by: ... libasound2t64 ...
>
> then install it with:
>
> ```sh
> sudo apt-get install libasound2t64
> ```

On Fedora/RHEL/CentOS, use:

```sh
sudo dnf install nspr nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm alsa-lib pango gtk3 libXScrnSaver libxshmfence libXfixes libXext libX11-xcb
```

See the [Playwright system requirements](https://playwright.dev/docs/installation#system-dependencies) for more details.

### Installing Playwright

If not already installed, add Playwright and its test runner:

```sh
npm install --save-dev playwright @playwright/test
npx playwright install
```


### Running E2E Tests

**Important:** The Vite dev server must be running at `http://localhost:5173` before running Playwright E2E tests. In one terminal, start:

```sh
npm run dev
```


**Note:** Playwright E2E tests and unit/integration tests (run with Vitest) should be run separately. Do **not** combine them in a single command. E2E tests require a real browser and dev server, are slower, and have different dependencies and environments than fast, isolated unit/integration tests. Keeping them separate ensures clarity, speed, and easier debugging.

Run unit/integration tests with:
```sh
npm test
```
and E2E tests with:
```sh
npm run test:e2e
```

- To run all E2E tests:
  ```sh
  npm run test:e2e
  # or
  npx playwright test
  ```
- To run a specific E2E test file:
  **Good news!** Playwright is now configured to automatically start the Vite dev server using its `webServer` setting. You do **not** need to manually start the dev server before running E2E tests—just run the E2E test command and Playwright will handle it for you.
  npm run test:e2e:single -- e2e/session-load.e2e.spec.ts
  **Tip:** You can automate dev server startup by adding a `webServer` section to `playwright.config.ts`. See [Playwright webServer docs](https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests) for details.
  npx playwright test e2e/session-load.e2e.spec.ts
  ```
- To open the interactive Playwright Test UI:
  ```sh
  npm run test:e2e:ui
  # or
  npx playwright test --ui
  ```

#### Available npm scripts

The following scripts are available in `package.json`:

- `test:e2e` – Run all Playwright E2E tests
- `test:e2e:single` – Run a single E2E test file (pass the file as an argument)
- `test:e2e:ui` – Open the Playwright Test UI


### Using Real Datasets in E2E Tests

- Place CIF or other input files in `data/input/`.
- Reference these files in your Playwright tests for realistic workflows.
- See `e2e/example-session.spec.ts` and `e2e/session-load.e2e.spec.ts` for usage patterns.


### E2E Test Best Practices

- Use `data-testid` or accessible selectors for robust element targeting.
- Clean up test state between tests to avoid cross-test interference.
- Document any new E2E tests and datasets added.
- Prefer realistic user flows: test file selection dialogs, downloads, and UI prompts as a user would experience them.

### Resources

- [Playwright documentation](https://playwright.dev/docs/intro)

---

## Test Types Overview

Ribocode uses three main types of tests to ensure code quality and robust user experience:

| Test Type         | Location/Pattern                | Tooling                | Purpose & Scope                                                                 |
|-------------------|---------------------------------|------------------------|--------------------------------------------------------------------------------|
| Unit Test         | `*.test.ts(x)` (next to code)   | Vitest, Testing Library| Test individual functions, hooks, or components in isolation.                   |
| Integration Test  | `*.integration.test.ts(x)`      | Vitest, Testing Library| Test workflows involving multiple components or hooks together in jsdom.        |
| End-to-End (E2E)  | `e2e/*.spec.ts`                 | Playwright             | Test real user workflows in a real browser, including file downloads, datasets. |

### Unit Tests
- Located next to the code they test (e.g., `src/components/Foo.test.tsx`).
- Use Vitest and @testing-library/react for fast, isolated checks.
- Example: Testing a single button renders and fires an event.

### Integration Tests
- Used for multi-component or workflow tests (e.g., `src/App.integration.test.tsx`).
- Still run in jsdom, but cover more of the app's logic and UI.
- Example: Testing session save/load logic across several components.


### End-to-End (E2E) Tests
- Located in the `e2e/` directory (e.g., `e2e/example-session.spec.ts`, `e2e/session-load.e2e.spec.ts`).
- Use Playwright to automate real browsers.
- Test real user flows: loading datasets, saving sessions, verifying downloads, file selection modals, and session restoration.
- Can assert on file downloads, network requests, and full UI behavior.

### Best Practices
- Use clear, descriptive test names and group related tests with `describe` blocks.
- Use `data-testid` or accessible selectors for robust element targeting.
- Clean up test state between tests to avoid cross-test interference.
- Document any new tests and datasets added.


See the sections above for how to run each type of test and for more detailed examples, including Playwright E2E workflows and npm scripts.

---

## Contributing

If you contribute changes, please submit a Pull Request that includes documentation updates and, if appropriate, includes tests.

**Please add your name to the CONTRIBUTORS file in the repository when you make a contribution.**
Also, add your details to the list of authors in the header of any source files you modify.

For contribution ideas, bug reports, or feature requests, please visit the [GitHub Issues page](https://github.com/ribocode-slola/ribocode1/issues).
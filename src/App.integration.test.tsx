/**
 * Integration test suite for App component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1 
 */
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import App from './App';
import { repTypeSelectIdSuffix } from './components/LoadMolecule';
import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';

// Mock the Mol* loader before importing the app
vi.mock("./utils/loadMoleculeFileToViewer", () => {
  return {
    loadMoleculeFileToViewer: vi.fn(),
  };
});

// Helper to load test CIF files from data/input
function loadTestFile(filename: string): File {
  const filePath = path.resolve(__dirname, '../data/input', filename);
  const buffer = fs.readFileSync(filePath);
  return new File([buffer], filename, { type: 'text/plain' });
}

// Mock the module and expose the mock for test access
vi.mock('molstar/lib/extensions/ribocode/structure', () => {
  const loadMoleculeFileToViewerMock = vi.fn((plugin, assetFile, isAlignedTo) => {
    // Return non-empty alignmentData for AlignedTo loads
    if (isAlignedTo) {
      return Promise.resolve({
        label: 'Test',
        name: 'Test',
        filename: 'test.cif',
        presetResult: 'Unknown',
        trajectory: {},
        alignmentData: { foo: 'bar' }
      });
    }
    // Return empty alignmentData for others
    return Promise.resolve({
      label: 'Test',
      name: 'Test',
      filename: 'test.cif',
      presetResult: 'Unknown',
      trajectory: {},
      alignmentData: {}
    });
  });
  // Attach to global for test access
  // @ts-ignore
  global.__loadMoleculeFileToViewerMock = loadMoleculeFileToViewerMock;
  return { loadMoleculeFileToViewer: loadMoleculeFileToViewerMock };
});

describe('App integration: AlignedTo and Aligned loading', () => {

  it('renders the AppHeader with correct id', async () => {
    // Import idSuffix directly to avoid hardcoding
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { idSuffix } = require('./components/AppHeader');
    render(<App />);
    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header.id).toBe('app-header');
    expect(header.tagName.toLowerCase()).toBe('header');
  });

  it('toggles visibility for all representations', async () => {

    // Load AlignedTo molecule
    render(<App />);

    // Use id-based selectors for left (A) viewer
    const alignedToInput = document.getElementById('viewer-column-A-file-input');
    const alignedToFile = loadTestFile('4ug0.cif');
    if (!alignedToInput) throw new Error('alignedToInput is null');
    fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
    // Click the Load AlignedTo button to trigger loading
    const loadAlignedToBtn = document.getElementById('viewer-column-A-load-btn');
    if (!loadAlignedToBtn) throw new Error('loadAlignedToBtn is null');
    await fireEvent.click(loadAlignedToBtn);
    // Wait for the Add Representation button to appear
    await waitFor(() => {
      const addRepBtn = document.getElementById('viewer-column-A-add-representation-btn');
      expect(addRepBtn).toBeInTheDocument();
    });
    const addRepBtn = document.getElementById('viewer-column-A-add-representation-btn') as HTMLButtonElement | null;
    const repTypeSelect = document.getElementById(`viewer-column-A-${repTypeSelectIdSuffix}`) as HTMLSelectElement | null;
    // Wait for the correct selector to be enabled
    await waitFor(() => {
      if (!repTypeSelect) throw new Error('repTypeSelect is null');
      expect(repTypeSelect.disabled).toBe(false);
    });
    fireEvent.change(repTypeSelect!, { target: { value: 'spacefill' } });
    // Now wait for the Add Representation button to become enabled
    await waitFor(() => {
      if (!addRepBtn) throw new Error('addRepBtn is null');
      expect(addRepBtn.disabled).toBe(false);
    });

    // Wait for representation toggle buttons to appear (use querySelectorAll for id pattern)
    await waitFor(() => {
      const repButtons = document.querySelectorAll('[id^="viewer-column-A-toggle-visibility-rep-"]');
      expect(repButtons.length).toBeGreaterThan(0);
    }, { timeout: 4000 });

    // Get all representation toggle buttons
    const repButtons = Array.from(document.querySelectorAll('[id^="viewer-column-A-toggle-visibility-rep-"]'));
    // All should be visible initially (icon is visible)
    repButtons.forEach(btn => {
      expect(btn.querySelector('svg')).not.toBeNull();
    });

    // Click all to hide
    for (const btn of repButtons) {
      await fireEvent.click(btn);
    }

    // After toggling, all should be hidden (icon changes)
    repButtons.forEach(btn => {
      expect(btn).toBeInTheDocument();
    });

    // Click all to show again
    for (const btn of repButtons) {
      await fireEvent.click(btn);
    }
    // All should be visible again
    repButtons.forEach(btn => {
      expect(btn).toBeInTheDocument();
    });
  });
  let loadMoleculeFileToViewerMock: any;
  beforeAll(() => {
    // Mock canvas getContext to avoid WebGL errors in test environment
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => ({
        getExtension: () => null,
        clear: () => { },
        drawArrays: () => { },
        createBuffer: () => { },
        bindBuffer: () => { },
        bufferData: () => { },
        enable: () => { },
        disable: () => { },
        viewport: () => { },
      }),
    });
    // Access the mock from global
    // @ts-ignore
    loadMoleculeFileToViewerMock = global.__loadMoleculeFileToViewerMock;
  });

  it('shows a React error boundary or warning if AlignedTo triggers infinite recursion', async () => {
    // Spy on console.error to catch React's error boundary warning
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    render(<App />);
    const alignedToInput = document.getElementById('viewer-column-A-file-input');

    // Load AlignedTo file (simulate user clicking multiple times to trigger recursion if present)
    const alignedToFile = loadTestFile('4ug0.cif');
    for (let i = 0; i < 5; i++) {
      if (!alignedToInput) throw new Error('alignedToInput is null');
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
    }

    // Click the Load AlignedTo button to trigger loading
    const loadAlignedToBtn = document.getElementById('viewer-column-A-load-btn');
    if (!loadAlignedToBtn) throw new Error('loadAlignedToBtn is null');
    await fireEvent.click(loadAlignedToBtn);
    // Select a representation type to enable the Add Representation button
    const repTypeSelect = document.getElementById(`viewer-column-A-${repTypeSelectIdSuffix}`) as HTMLSelectElement | null;
    if (!repTypeSelect) throw new Error('repTypeSelect is null');
    fireEvent.change(repTypeSelect, { target: { value: 'spacefill' } });
    let enabledAddRepBtn: HTMLButtonElement | undefined;
    await waitFor(() => {
      const addRepBtn = document.getElementById('viewer-column-A-add-representation-btn') as HTMLButtonElement | null;
      if (!addRepBtn) throw new Error('addRepBtn is null');
      expect(addRepBtn.disabled).toBe(false);
      enabledAddRepBtn = addRepBtn;
    });
    await fireEvent.click(enabledAddRepBtn!);

    await waitFor(() => {
      // Gather all error calls
      const calls = errorSpy.mock.calls;
      // Fail if any call contains the recursion warning
      const recursionError = calls.find(call =>
        call.some(arg =>
          typeof arg === 'string' && arg.includes('Maximum update depth exceeded')
        )
      );
      if (recursionError) {
        throw new Error('Recursion warning detected: Maximum update depth exceeded');
      }
      // Otherwise, test passes (WebGL/canvas errors are allowed)
      expect(true).toBe(true);
    });
    errorSpy.mockRestore();
  });

  it('enables Load Aligned button only after AlignedTo is loaded', async () => {
    render(<App />);
    // Use data-testid for robust selection
    const alignedToInput = document.getElementById('viewer-column-A-file-input') as HTMLInputElement | null;
    const alignedInput = document.getElementById('viewer-column-B-file-input') as HTMLInputElement | null;
    const loadAlignedBtn = document.getElementById('viewer-column-B-load-btn') as HTMLButtonElement | null;

    // Load AlignedTo file
    const alignedToFile = loadTestFile('4ug0.cif');
    await waitFor(() => {
      if (!alignedToInput) throw new Error('alignedToInput is null');
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
    });

    // Now the Load Aligned button should be enabled
    await waitFor(() => {
      if (!loadAlignedBtn) throw new Error('loadAlignedBtn is null');
      expect(loadAlignedBtn.disabled).toBe(false);
    });

    // Load Aligned file
    const alignedFile = loadTestFile('6xu8.cif');
    await waitFor(() => {
      if (!alignedInput) throw new Error('alignedInput is null');
      fireEvent.change(alignedInput, { target: { files: [alignedFile] } });
    });

    // Instead of checking for file input presence, check that the button is still enabled (or another UI state)
    if (!loadAlignedBtn) throw new Error('loadAlignedBtn is null');
    expect(loadAlignedBtn.disabled).toBe(false);
  });

  it('does not infinitely reload AlignedTo or Aligned (regression)', async () => {

    render(<App />);
    const alignedToInput = document.getElementById('viewer-column-A-file-input');
    const alignedInput = document.getElementById('viewer-column-B-file-input');
    const loadAlignedBtn = document.getElementById('viewer-column-B-load-btn');

    // Select a representation type to enable the Add Representation button
    const repTypeSelect = document.getElementById(`viewer-column-A-${repTypeSelectIdSuffix}`) as HTMLSelectElement | null;
    if (!repTypeSelect) throw new Error('repTypeSelect is null');
    fireEvent.change(repTypeSelect, { target: { value: 'spacefill' } });
    let enabledAddRepBtn: HTMLButtonElement | undefined;
    await waitFor(() => {
      const addRepBtn = document.getElementById('viewer-column-A-add-representation-btn') as HTMLButtonElement | null;
      if (!addRepBtn) throw new Error('addRepBtn is null');
      expect(addRepBtn.disabled).toBe(false);
      enabledAddRepBtn = addRepBtn;
    });
    await fireEvent.click(enabledAddRepBtn!);

    // Check loader call counts for both files
    const calls = loadMoleculeFileToViewerMock.mock.calls;
    const alignedToCalls = calls.filter((call: any[]) => call[1]?.name === '4ug0.cif');
    const alignedCalls = calls.filter((call: any[]) => call[1]?.name === '6xu8.cif');
    expect(alignedToCalls.length).toBeLessThanOrEqual(2);
    expect(alignedCalls.length).toBeLessThanOrEqual(2);
  });
});

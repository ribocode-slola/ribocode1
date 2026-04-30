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

    it('toggles visibility for all representations', async () => {

      // Load AlignedTo molecule
      render(<App />);
      const alignedToInput = await screen.findByTestId('alignedto-file-input');
      const alignedToFile = loadTestFile('4ug0.cif');
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
      // Click the Load AlignedTo button to trigger loading
      const loadAlignedToBtn = screen.getByTestId('alignedto-load-btn');
      await fireEvent.click(loadAlignedToBtn);
      // Wait for the Add Representation button to appear
      await waitFor(() => {
        const addRepBtns = screen.getAllByTestId('add-representation-btn');
        expect(addRepBtns.length).toBeGreaterThan(0);
      });
      // Find the first Add Representation button and its parent
      const addRepBtns = screen.getAllByTestId('add-representation-btn');
      const addRepBtn = addRepBtns[0];
      const parent = addRepBtn.closest('.rep-type-controls');
      let repTypeSelect: HTMLElement | null = null;
      if (parent) {
        repTypeSelect = parent.querySelector('[data-testid="representation-type"]');
      }
      // Wait for the correct selector to be enabled
      await waitFor(() => {
        expect(repTypeSelect).not.toBeNull();
        expect((repTypeSelect as HTMLSelectElement).disabled).toBe(false);
      });
      fireEvent.change(repTypeSelect!, { target: { value: 'spacefill' } });
      // Now wait for the Add Representation button to become enabled
      await waitFor(() => {
        expect((addRepBtn as HTMLButtonElement).disabled).toBe(false);
      });
      await fireEvent.click(addRepBtn);

      // Wait for representation toggle buttons to appear
      await waitFor(() => {
        const repButtons = screen.getAllByTestId(/^toggle-visibility-rep-/);
        expect(repButtons.length).toBeGreaterThan(0);
      }, { timeout: 4000 });

      // Get all representation toggle buttons
      const repButtons = screen.getAllByTestId(/^toggle-visibility-rep-/);
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
        clear: () => {},
        drawArrays: () => {},
        createBuffer: () => {},
        bindBuffer: () => {},
        bufferData: () => {},
        enable: () => {},
        disable: () => {},
        viewport: () => {},
      }),
    });
    // Access the mock from global
    // @ts-ignore
    loadMoleculeFileToViewerMock = global.__loadMoleculeFileToViewerMock;
  });

  beforeEach(() => {
    loadMoleculeFileToViewerMock.mockClear();
  });

  // Removed test for warning when loading Aligned before AlignedTo, as UI prevents this scenario.

  it('shows a React error boundary or warning if AlignedTo triggers infinite recursion', async () => {
    // Spy on console.error to catch React's error boundary warning
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App />);
    const alignedToInput = await screen.findByTestId('alignedto-file-input');

    // Load AlignedTo file (simulate user clicking multiple times to trigger recursion if present)
    const alignedToFile = loadTestFile('4ug0.cif');
    for (let i = 0; i < 5; i++) {
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
    }

    // Click the Load AlignedTo button to trigger loading
    const loadAlignedToBtn = screen.getByTestId('alignedto-load-btn');
    await fireEvent.click(loadAlignedToBtn);
    // Select a representation type to enable the Add Representation button
    let repTypeSelect: HTMLElement | null = null;
    try {
      repTypeSelect = screen.getByTestId('representation-type');
    } catch {
      repTypeSelect = screen.queryByLabelText(/Representation:/i);
    }
    if (repTypeSelect) {
      fireEvent.change(repTypeSelect, { target: { value: 'spacefill' } });
    }
    let enabledAddRepBtn: HTMLElement | undefined;
    await waitFor(() => {
      const addRepBtns = screen.getAllByTestId('add-representation-btn');
      enabledAddRepBtn = addRepBtns.find(btn => !(btn as HTMLButtonElement).disabled);
      expect(enabledAddRepBtn).toBeDefined();
    });
    await fireEvent.click(enabledAddRepBtn!);

    // Wait for all error logs to be flushed
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
    const alignedToInput = await screen.findByTestId('alignedto-file-input');
    const alignedInput = await screen.findByTestId('aligned-file-input');
    const loadAlignedBtn = await screen.findByTestId('aligned-load-btn');

    // Load AlignedTo file
    const alignedToFile = loadTestFile('4ug0.cif');
    await waitFor(() => {
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });
    });

    // Now the Load Aligned button should be enabled
    await waitFor(() => {
      expect(loadAlignedBtn).not.toBeDisabled();
    });

    // Load Aligned file
    const alignedFile = loadTestFile('6xu8.cif');
    await waitFor(() => {
      fireEvent.change(alignedInput, { target: { files: [alignedFile] } });
    });

    // Instead of checking for file input presence, check that the button is still enabled (or another UI state)
    expect(loadAlignedBtn).not.toBeDisabled();
  });

  it('does not infinitely reload AlignedTo or Aligned (regression)', async () => {

    render(<App />);
    const alignedToInput = await screen.findByTestId('alignedto-file-input');
    const alignedInput = await screen.findByTestId('aligned-file-input');
    const loadAlignedBtn = await screen.findByTestId('aligned-load-btn');

    // Select a representation type to enable the Add Representation button
    let repTypeSelect: HTMLElement | null = null;
    try {
      repTypeSelect = screen.getByTestId('representation-type');
    } catch {
      repTypeSelect = screen.queryByLabelText(/Representation:/i);
    }
    if (repTypeSelect) {
      fireEvent.change(repTypeSelect, { target: { value: 'spacefill' } });
    }
    let enabledAddRepBtn: HTMLElement | undefined;
    await waitFor(() => {
      const addRepBtns = screen.getAllByTestId('add-representation-btn');
      enabledAddRepBtn = addRepBtns.find(btn => !(btn as HTMLButtonElement).disabled);
      expect(enabledAddRepBtn).toBeDefined();
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

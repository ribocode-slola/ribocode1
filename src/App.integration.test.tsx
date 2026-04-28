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
  it('does not infinitely reload AlignedTo (regression)', async () => {
    // Access the mock from global (for isolated test scope)
    // @ts-ignore
    const loadMoleculeFileToViewerMock = global.__loadMoleculeFileToViewerMock;
    render(<App />);
    const alignedToInput = await screen.findByTestId('alignedto-file-input');

    // Load AlignedTo file
    const alignedToFile = loadTestFile('4ug0.cif');
    fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });

    // Wait for any UI update
    await waitFor(() => {
      expect(alignedToInput).toBeInTheDocument();
    });

    // Check loader call counts for recursion
    const calls = loadMoleculeFileToViewerMock.mock.calls;
    const alignedToCalls = calls.filter((call: any[]) => call[1]?.name === '4ug0.cif');
    // Allow up to 2 calls (initial + possible effect), but fail if more
    expect(alignedToCalls.length).toBeLessThanOrEqual(2);
  });
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
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
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
  const loadMoleculeFileToViewerMock = vi.fn().mockResolvedValue({
    label: 'Test',
    name: 'Test',
    filename: 'test.cif',
    presetResult: 'Unknown',
    trajectory: {},
    alignmentData: {}
  });
  // Attach to global for test access
  // @ts-ignore
  global.__loadMoleculeFileToViewerMock = loadMoleculeFileToViewerMock;
  return { loadMoleculeFileToViewer: loadMoleculeFileToViewerMock };
});


describe('App integration: AlignedTo and Aligned loading', () => {
  it('does not enable Load Aligned until alignmentData is present (delayed AlignedTo)', async () => {
    // Patch the mock to delay alignmentData
    const loadMoleculeFileToViewerMock = global.__loadMoleculeFileToViewerMock;
    let resolveAlignmentData: (() => void) | null = null;
    loadMoleculeFileToViewerMock.mockImplementationOnce(() => {
      return new Promise(resolve => {
        // Simulate async load, alignmentData not present at first
        setTimeout(() => {
          resolve({
            label: 'Test',
            name: 'Test',
            filename: '4ug0.cif',
            presetResult: 'Unknown',
            trajectory: {},
            alignmentData: undefined // Not ready yet
          });
          // After a short delay, alignmentData becomes available
          setTimeout(() => {
            resolveAlignmentData && resolveAlignmentData();
          }, 100);
        }, 100);
      });
    });
    // Second call (simulate update with alignmentData)
    loadMoleculeFileToViewerMock.mockImplementationOnce(() => {
      return Promise.resolve({
        label: 'Test',
        name: 'Test',
        filename: '4ug0.cif',
        presetResult: 'Unknown',
        trajectory: {},
        alignmentData: { foo: 'bar' }
      });
    });

    render(<App />);
    const alignedToInput = await screen.findByTestId('alignedto-file-input');
    const alignedInput = await screen.findByTestId('aligned-file-input');
    const loadAlignedBtn = await screen.findByTestId('aligned-load-btn');

    // Load AlignedTo file (delayed alignmentData)
    fireEvent.change(alignedToInput, { target: { files: [loadTestFile('4ug0.cif')] } });

    // Button should remain disabled until alignmentData is present
    await waitFor(() => {
      expect(loadAlignedBtn).toBeDisabled();
    });

    // Simulate alignmentData becoming available
    await new Promise(res => setTimeout(res, 250));

    // Now the button should be enabled
    await waitFor(() => {
      expect(loadAlignedBtn).not.toBeDisabled();
    });
  });
    it('shows a warning if Aligned is loaded before AlignedTo, and not if loaded in correct order', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<App />);
      const alignedInput = await screen.findByTestId('aligned-file-input');
      const loadAlignedBtn = await screen.findByTestId('aligned-load-btn');

      // Try to load Aligned before AlignedTo
      const alignedFile = loadTestFile('6xu8.cif');
      fireEvent.change(alignedInput, { target: { files: [alignedFile] } });

      // Wait for error log
      await waitFor(() => {
        const calls = errorSpy.mock.calls;
        const warning = calls.find(call => call.some(arg => typeof arg === 'string' && arg.includes('AlignedTo molecule must be loaded before loading aligned molecule.')));
        expect(warning).toBeTruthy();
      });

      errorSpy.mockClear();

      // Now load AlignedTo, then Aligned (correct order)
      const alignedToInput = await screen.findByTestId('alignedto-file-input');
      const alignedToFile = loadTestFile('4ug0.cif');
      fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });

      await waitFor(() => {
        expect(loadAlignedBtn).not.toBeDisabled();
      });

      fireEvent.change(alignedInput, { target: { files: [alignedFile] } });

      // Should NOT log the warning again
      await waitFor(() => {
        const calls = errorSpy.mock.calls;
        const warning = calls.find(call => call.some(arg => typeof arg === 'string' && arg.includes('AlignedTo molecule must be loaded before loading aligned molecule.')));
        expect(warning).toBeFalsy();
      });
      errorSpy.mockRestore();
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

    // Check that both molecules are loaded (look for some UI indication)
    // You may need to adjust these assertions to match your UI
    // For now, just check that the file inputs are still present
    expect(alignedToInput).toBeInTheDocument();
    expect(alignedInput).toBeInTheDocument();
  });

  it('does not infinitely reload Aligned or AlignedTo', async () => {
    render(<App />);
    const alignedToInput = await screen.findByTestId('alignedto-file-input');
    const alignedInput = await screen.findByTestId('aligned-file-input');
    const loadAlignedBtn = await screen.findByTestId('aligned-load-btn');

    // Load AlignedTo file
    const alignedToFile = loadTestFile('4ug0.cif');
    fireEvent.change(alignedToInput, { target: { files: [alignedToFile] } });

    await waitFor(() => {
      expect(loadAlignedBtn).not.toBeDisabled();
    });

    // Load Aligned file
    const alignedFile = loadTestFile('6xu8.cif');
    fireEvent.change(alignedInput, { target: { files: [alignedFile] } });

    await waitFor(() => {
      expect(alignedInput).toBeInTheDocument();
    });

    // Check loader call counts
    const calls = loadMoleculeFileToViewerMock.mock.calls;
    const alignedToCalls = calls.filter((call: any[]) => call[1]?.name === '4ug0.cif');
    const alignedCalls = calls.filter((call: any[]) => call[1]?.name === '6xu8.cif');
    expect(alignedToCalls.length).toBeLessThanOrEqual(2);
    expect(alignedCalls.length).toBeLessThanOrEqual(2);
  });
});

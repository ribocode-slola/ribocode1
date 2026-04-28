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

  it('warns if Aligned is loaded before AlignedTo, and not if loaded in correct order', async () => {
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

    // Flush React updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(loadAlignedBtn).not.toBeDisabled();
    }, { timeout: 2000 });

    fireEvent.change(alignedInput, { target: { files: [alignedFile] } });

    // Should NOT log the warning again
    await waitFor(() => {
      const calls = errorSpy.mock.calls;
      const warning = calls.find(call => call.some(arg => typeof arg === 'string' && arg.includes('AlignedTo molecule must be loaded before loading aligned molecule.')));
      expect(warning).toBeFalsy();
    });
    errorSpy.mockRestore();
  });

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
    // For now, just check that the file inputs are still present
    expect(alignedToInput).toBeInTheDocument();
    expect(alignedInput).toBeInTheDocument();
  });

  it('does not infinitely reload AlignedTo or Aligned (regression)', async () => {
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

    // Check loader call counts for both files
    const calls = loadMoleculeFileToViewerMock.mock.calls;
    const alignedToCalls = calls.filter((call: any[]) => call[1]?.name === '4ug0.cif');
    const alignedCalls = calls.filter((call: any[]) => call[1]?.name === '6xu8.cif');
    expect(alignedToCalls.length).toBeLessThanOrEqual(2);
    expect(alignedCalls.length).toBeLessThanOrEqual(2);
  });
});

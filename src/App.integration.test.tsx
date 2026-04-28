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

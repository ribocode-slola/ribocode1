/**
 * Test for useSessionLoadModal integration, to verify that the hook correctly prompts for required files based on the session JSON structure.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useSessionLoadModal } from './useSessionLoadModal';

describe('useSessionLoadModal integration', () => {
  it('prompts for required files for both alignedTo/aligned and moleculeAlignedTo/moleculeAligned keys', async () => {
    const onSessionLoaded = vi.fn();

    // Test alignedTo/aligned keys, with both viewers referencing the same files
    const sessionData1 = {
      viewerA: { alignedTo: { filename: 'alignedToA.cif' } },
      viewerB: { alignedTo: { filename: 'alignedToA.cif' }, aligned: { filename: 'alignedB.cif' } }
    };
    const file1 = new File([JSON.stringify(sessionData1)], 'session1.json', { type: 'application/json' });

    // Test 2: moleculeAlignedTo/moleculeAligned keys, both viewers referencing the same files
    const sessionData2 = {
      viewerA: { moleculeAlignedTo: { filename: 'molAlignedToA.cif' } },
      viewerB: { moleculeAlignedTo: { filename: 'molAlignedToA.cif' }, moleculeAligned: { filename: 'molAlignedB.cif' } }
    };
    const file2 = new File([JSON.stringify(sessionData2)], 'session2.json', { type: 'application/json' });

    function TestComponent({ file }: { file: File }) {
      const { handleLoadSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);
      return (
        <>
          <input type="file" data-testid="session-input" onChange={handleLoadSession} />
          {SessionLoadModal}
        </>
      );
    }

    // Test alignedTo/aligned
    const { unmount } = render(<TestComponent file={file1} />);
    let input = screen.getByTestId('session-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file1] });
    fireEvent.change(input);
    await waitFor(() => {
      expect(screen.getByText('Load Session: Select Required Files')).toBeInTheDocument();
      expect(screen.getByText('alignedToA.cif')).toBeInTheDocument();
      expect(screen.getByText('alignedB.cif')).toBeInTheDocument();
      // Should only prompt for each file once
      expect(screen.queryAllByText('alignedToA.cif').length).toBe(1);
      expect(screen.queryAllByText('alignedB.cif').length).toBe(1);
    });

    // Cleanup modal and unmount
    fireEvent.click(screen.getByText('Cancel'));
    unmount();

    // Test moleculeAlignedTo/moleculeAligned
    const { unmount: unmount2 } = render(<TestComponent file={file2} />);
    input = screen.getByTestId('session-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file2] });
    fireEvent.change(input);
    await waitFor(() => {
      expect(screen.getByText('Load Session: Select Required Files')).toBeInTheDocument();
      expect(screen.getByText('molAlignedToA.cif')).toBeInTheDocument();
      expect(screen.getByText('molAlignedB.cif')).toBeInTheDocument();
      expect(screen.queryAllByText('molAlignedToA.cif').length).toBe(1);
      expect(screen.queryAllByText('molAlignedB.cif').length).toBe(1);
    });
    fireEvent.click(screen.getByText('Cancel'));
    unmount2();
  });

  it('loads embedded files immediately when Load All is used', async () => {
    const onSessionLoaded = vi.fn();

    const embeddedA = new File(['alpha'], 'molAlignedToA.cif', { type: 'chemical/x-cif' });
    const embeddedB = new File(['beta'], 'molAlignedB.cif', { type: 'chemical/x-cif' });
    const sessionData = {
      schemaVersion: 2,
      viewerA: { moleculeAlignedTo: { filename: 'molAlignedToA.cif' } },
      viewerB: { moleculeAligned: { filename: 'molAlignedB.cif' } },
      embeddedFiles: {
        'molAlignedToA.cif': { mime: embeddedA.type, data: btoa('alpha') },
        'molAlignedB.cif': { mime: embeddedB.type, data: btoa('beta') },
      },
    };
    const sessionFile = new File([JSON.stringify(sessionData)], 'session-all.json', { type: 'application/json' });

    function TestComponent() {
      const { handleLoadAllSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);
      return (
        <>
          <input type="file" data-testid="session-input" onChange={handleLoadAllSession} />
          {SessionLoadModal}
        </>
      );
    }

    render(<TestComponent />);
    const input = screen.getByTestId('session-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [sessionFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(onSessionLoaded).toHaveBeenCalledTimes(1);
    });

    const [, files] = onSessionLoaded.mock.calls[0];
    expect(files['molAlignedToA.cif']).toBeInstanceOf(File);
    expect(files['molAlignedB.cif']).toBeInstanceOf(File);
    expect(screen.queryByText('Load Session: Select Required Files')).not.toBeInTheDocument();
  });
});

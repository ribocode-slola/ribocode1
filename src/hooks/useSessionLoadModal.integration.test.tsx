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
  it('prompts for required files based on session JSON', async () => {
    const onSessionLoaded = vi.fn();
    // Create a session JSON blob with required filenames
    // Only viewerA.alignedTo and viewerB.aligned are picked up by the modal logic
    const sessionData = {
      viewerA: { alignedTo: { filename: 'alignedToA.cif' } },
      viewerB: { aligned: { filename: 'alignedB.cif' } }
    };
    const file = new File([JSON.stringify(sessionData)], 'session.json', { type: 'application/json' });

    function TestComponent() {
      const { handleLoadSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);
      return (
        <>
          <input type="file" data-testid="session-input" onChange={handleLoadSession} />
          {SessionLoadModal}
        </>
      );
    }

    render(<TestComponent />);
    // Simulate loading a session file
    const input = screen.getByTestId('session-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    // Modal should appear and prompt for required files
    await waitFor(() => {
      expect(screen.getByText('Load Session: Select Required Files')).toBeInTheDocument();
      expect(screen.getByText('alignedToA.cif')).toBeInTheDocument();
      expect(screen.getByText('alignedB.cif')).toBeInTheDocument();
    });
  });
});

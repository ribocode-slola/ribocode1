/**
 * Unit tests for the useSessionLoadModal hook, which manages the state and behavior of a modal for loading session files in the Ribocode app. Tests cover opening the modal, handling file input, and validating required file names.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useSessionLoadModal } from './useSessionLoadModal';

describe('useSessionLoadModal', () => {
  it('should open modal and handle file input', async () => {
    const onSessionLoaded = vi.fn();
    // Mock a session file with required file info
    const sessionData = {
      viewerA: { alignedTo: { filename: 'required.txt' } },
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

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Load Session: Select Required Files')).toBeInTheDocument();
      expect(screen.getByText('required.txt')).toBeInTheDocument();
    });
  });

  it('should alert if file name does not match', async () => {
    const onSessionLoaded = vi.fn();
    window.alert = vi.fn();
    const sessionData = {
      viewerA: { alignedTo: { filename: 'required.txt' } },
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

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('required.txt')).toBeInTheDocument();
    });

    // Simulate selecting a wrong file
    const wrongFile = new File(['foo'], 'wrong.txt');
    // Find the file input inside the modal
    const modal = screen.getByText('Load Session: Select Required Files').closest('div');
    const fileInput = modal?.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    Object.defineProperty(fileInput!, 'files', { value: [wrongFile] });
    fireEvent.change(fileInput!);
    expect(window.alert).toHaveBeenCalled();
  });
});

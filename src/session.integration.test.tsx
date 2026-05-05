/**
 * Integration tests for session-related flows: session load confirmation, file input trigger, and modal appearance.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-05-05
 */
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock hooks and dependencies as needed
vi.mock('./hooks/useSessionSave', () => ({
  useSessionSave: (getSessionState: any) => vi.fn(),
}));
vi.mock('./hooks/useSessionLoadModal', () => {
  return {
    useSessionLoadModal: (onSessionLoaded: any) => ({
      handleLoadSession: vi.fn(),
      SessionLoadModal: <div data-testid="session-modal">Session Modal</div>,
    }),
  };
});

describe('Session integration: load confirmation and modal', () => {
  it('shows a confirmation dialog before loading a session', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => false); // User cancels
    render(<App />);
    const sessionBtn = screen.getByRole('button', { name: /session/i });
    fireEvent.click(sessionBtn);
    const loadItem = screen.getByText('Load');
    fireEvent.click(loadItem);
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/will unload all current data/i));
    confirmSpy.mockImplementation(() => true);
    fireEvent.click(sessionBtn);
    fireEvent.click(loadItem);
    await waitFor(() => expect(screen.getByTestId('session-modal')).toBeInTheDocument());
    confirmSpy.mockRestore();
  });

  it('triggers file input click when Load is clicked and confirmed', async () => {
    render(<App />);
    const sessionBtn = screen.getByRole('button', { name: /session/i });
    fireEvent.click(sessionBtn);
    const loadItem = screen.getByText('Load');
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const fileInput = document.getElementById('session-menu-file-input');
    const clickSpy = vi.spyOn(fileInput!, 'click');
    fireEvent.click(loadItem);
    expect(clickSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

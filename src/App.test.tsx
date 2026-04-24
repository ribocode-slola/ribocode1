/**
 * Basic test suite for App component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1 
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

describe('App session dropdown menu', () => {
  it('renders the Session dropdown and triggers Save/Load/Restart', async () => {
    render(<App />);
    // Dropdown button
    const sessionBtn = screen.getByText(/Session/i);
    expect(sessionBtn).toBeInTheDocument();
    // Open dropdown
    fireEvent.click(sessionBtn);
    // Save
    const saveItem = screen.getByText('Save');
    expect(saveItem).toBeInTheDocument();
    fireEvent.click(saveItem);
    // Load
    fireEvent.click(sessionBtn); // reopen
    const loadItem = screen.getByText('Load');
    expect(loadItem).toBeInTheDocument();
    fireEvent.click(loadItem);
    // Modal should appear (mocked)
    await waitFor(() => expect(screen.getByTestId('session-modal')).toBeInTheDocument());
    // Restart
    fireEvent.click(sessionBtn); // reopen
    const restartItem = screen.getByText('Restart');
    expect(restartItem).toBeInTheDocument();
  });
});

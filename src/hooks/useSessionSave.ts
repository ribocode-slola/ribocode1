/**
 * Custom hook to generate and save the current session state as a JSON file.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useCallback } from 'react';

/**
 * Hook to generate and save the current session state as a JSON file.
 * @param getSessionState - Function that returns the current session state object.
 * @returns handleSaveSession - Function to trigger session save/download.
 */
export function useSessionSave(getSessionState: () => any) {
  const handleSaveSession = useCallback(() => {
    try {
      const session = getSessionState();
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ribocode-session.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      alert('Failed to save session: ' + (err instanceof Error ? err.message : err));
    }
  }, [getSessionState]);

  return handleSaveSession;
}

import { useCallback } from 'react';
import { fileToEmbeddedSessionFile, type EmbeddedSessionFiles } from '../utils/session';

/**
 * Hook to generate and save the current session state as a JSON file with embedded file data.
 */
export function useSessionSaveAll(
  getSessionState: () => any,
  getEmbeddedFiles: () => Record<string, File | null | undefined>
) {
  const handleSaveSessionAll = useCallback(async () => {
    try {
      const session = getSessionState();
      const embeddedFiles: EmbeddedSessionFiles = {};
      const fileEntries = Object.entries(getEmbeddedFiles());
      for (const [filename, file] of fileEntries) {
        if (!file) continue;
        embeddedFiles[filename] = await fileToEmbeddedSessionFile(file);
      }
      const payload = {
        schemaVersion: 2,
        ...session,
        embeddedFiles,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ribocode-session-all.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      alert('Failed to save session: ' + (err instanceof Error ? err.message : err));
    }
  }, [getSessionState, getEmbeddedFiles]);

  return handleSaveSessionAll;
}

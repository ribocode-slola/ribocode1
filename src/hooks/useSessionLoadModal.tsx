/**
 * Custom hook to manage session loading with a modal for required file selection.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useState, useCallback } from 'react';

export interface RequiredSessionFile {
  key: string;
  label: string;
  filename: string;
  file?: File | null;
}

export interface SessionLoadModalState {
  open: boolean;
  sessionData: any | null;
  requiredFiles: RequiredSessionFile[];
  step: number;
}

export function useSessionLoadModal(onSessionLoaded: (session: any, files: Record<string, File>) => void) {
  const [modalState, setModalState] = useState<SessionLoadModalState>({
    open: false,
    sessionData: null,
    requiredFiles: [],
    step: 0,
  });

  // Handler for file input change
  const handleSessionFileChange = useCallback((idx: number, file: File | null) => {
    setModalState(prev => {
      const requiredFiles = [...prev.requiredFiles];
      if (file && file.name === requiredFiles[idx].filename) {
        requiredFiles[idx] = { ...requiredFiles[idx], file };
      } else {
        alert(`Selected file name (${file?.name}) does not match required file (${requiredFiles[idx].filename}). Please try again.`);
        return prev;
      }
      return { ...prev, requiredFiles };
    });
  }, []);

  // Handler for proceeding with session load
  const handleSessionLoadProceed = useCallback(async () => {
    if (!modalState.requiredFiles.every(f => f.file)) {
      alert('Please select all required files.');
      return;
    }
    // Map files to expected variables
    const files: Record<string, File> = {};
    for (const f of modalState.requiredFiles) {
      if (f.file) files[f.key] = f.file;
    }
    setModalState({ open: false, sessionData: null, requiredFiles: [], step: 0 });
    onSessionLoaded(modalState.sessionData, files);
  }, [modalState, onSessionLoaded]);

  // Handler for loading session file (JSON)
  const handleLoadSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      let session;
      try {
        session = JSON.parse(e.target?.result as string);
      } catch (err) {
        alert('Failed to parse session: ' + err);
        return;
      }
      // Determine required files from session
      const requiredFiles: RequiredSessionFile[] = [];
      if (session.viewerA && session.viewerA.alignedTo && session.viewerA.alignedTo.filename) {
        requiredFiles.push({ key: 'alignedToA', label: 'AlignedTo (Viewer A)', filename: session.viewerA.alignedTo.filename });
      }
      if (session.viewerB && session.viewerB.aligned && session.viewerB.aligned.filename) {
        requiredFiles.push({ key: 'alignedB', label: 'Aligned (Viewer B)', filename: session.viewerB.aligned.filename });
      } else if (session.viewerA && session.viewerA.aligned && session.viewerA.aligned.filename) {
        requiredFiles.push({ key: 'alignedA', label: 'Aligned (Viewer A)', filename: session.viewerA.aligned.filename });
      }
      setModalState({ open: true, sessionData: session, requiredFiles, step: 0 });
    };
    reader.readAsText(file);
  }, []);

  // Modal UI component
  const SessionLoadModal = modalState.open ? (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
        <h2>Load Session: Select Required Files</h2>
        <ol>
          {modalState.requiredFiles.map((f, idx) => (
            <li key={f.key} style={{ marginBottom: 16 }}>
              <div><b>{f.label}</b>: <span style={{ color: '#555' }}>{f.filename}</span></div>
              <input type="file" style={{ marginTop: 8 }}
                onChange={e => handleSessionFileChange(idx, e.target.files?.[0] || null)}
                accept={undefined}
              />
              {f.file && <span style={{ color: 'green', marginLeft: 8 }}>✓ Selected</span>}
            </li>
          ))}
        </ol>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setModalState({ open: false, sessionData: null, requiredFiles: [], step: 0 })}>Cancel</button>
          <button onClick={handleSessionLoadProceed} disabled={!modalState.requiredFiles.every(f => f.file)}>Load Session</button>
        </div>
      </div>
    </div>
  ) : null;

  return { handleLoadSession, SessionLoadModal };
}

/**
 * Custom hook to manage session loading with a modal for required file selection.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React, { useState, useCallback } from 'react';
import { embeddedSessionFilesToRecord } from '../utils/session';

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
  const handleSessionFileChange = useCallback((idx: number, file: File | null, fileList?: FileList | null) => {
    setModalState(prev => {
      const requiredFiles = [...prev.requiredFiles];
      if (!file) return prev;
      // Find all required file indices that match this filename
      const matchingIndices = requiredFiles
        .map((rf, i) => rf.filename === file.name ? i : -1)
        .filter(i => i !== -1);
      if (matchingIndices.length === 0) {
        alert(`Selected file name (${file.name}) does not match any required file. Please try again.`);
        return prev;
      }
      // Assign the selected file to all matching requirements
      for (const i of matchingIndices) {
        requiredFiles[i] = { ...requiredFiles[i], file };
      }
      // Try to auto-assign the other required file if in the same directory
      if (fileList && fileList.length > 1) {
        for (let j = 0; j < requiredFiles.length; ++j) {
          if (!requiredFiles[j].file) {
            const match = Array.from(fileList).find(f => f.name === requiredFiles[j].filename);
            if (match) {
              requiredFiles[j] = { ...requiredFiles[j], file: match };
            }
          }
        }
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

  const openSession = useCallback((session: any, loadAll: boolean) => {
    const requiredFiles = collectRequiredFiles(session);
    if (loadAll) {
      const embeddedFiles = embeddedSessionFilesToRecord(session?.embeddedFiles);
      if (Object.keys(embeddedFiles).length > 0) {
        onSessionLoaded(session, embeddedFiles);
        return;
      }
    }
    if (requiredFiles.length === 0) {
      onSessionLoaded(session, {});
      return;
    }
    setModalState({ open: true, sessionData: session, requiredFiles, step: 0 });
  }, [onSessionLoaded]);

  const collectRequiredFiles = useCallback((session: any): RequiredSessionFile[] => {
    const fileMap = new Map<string, RequiredSessionFile>();
    const addFile = (filename: string | undefined, label: string) => {
      if (filename && !fileMap.has(filename)) {
        fileMap.set(filename, { key: filename, label, filename });
      }
    };
    addFile(session.viewerA?.alignedTo?.filename, 'AlignedTo');
    addFile(session.viewerA?.aligned?.filename, 'Aligned');
    addFile(session.viewerA?.moleculeAlignedTo?.filename, 'AlignedTo');
    addFile(session.viewerA?.moleculeAligned?.filename, 'Aligned');
    addFile(session.viewerB?.alignedTo?.filename, 'AlignedTo');
    addFile(session.viewerB?.aligned?.filename, 'Aligned');
    addFile(session.viewerB?.moleculeAlignedTo?.filename, 'AlignedTo');
    addFile(session.viewerB?.moleculeAligned?.filename, 'Aligned');
    return Array.from(fileMap.values());
  }, []);

  // Handler for loading session file (JSON)
  const handleLoadSession = useCallback((event: React.ChangeEvent<HTMLInputElement>, loadAll = false) => {
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
      openSession(session, loadAll);
    };
    reader.readAsText(file);
  }, [openSession]);

  const handleLoadAllSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleLoadSession(event, true);
  }, [handleLoadSession]);

  // Modal UI component
  const SessionLoadModal = modalState.open ? (
    <div
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      data-testid="session-load-modal-root"
    >
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }} data-testid="session-load-modal-content">
        <h2>Load Session: Select Required Files</h2>
        <ol>
          {modalState.requiredFiles.map((f, idx) => (
            <li key={f.key} style={{ marginBottom: 16 }}>
              <div><b>{f.label}</b>: <span style={{ color: '#555' }}>{f.filename}</span></div>
              <input
                type="file"
                style={{ marginTop: 8 }}
                onChange={e => handleSessionFileChange(idx, e.target.files?.[0] || null, e.target.files)}
                accept={undefined}
                data-testid={`session-load-modal-file-input-${idx}`}
              />
              {f.file && <span style={{ color: 'green', marginLeft: 8 }}>✓ Selected</span>}
            </li>
          ))}
        </ol>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => setModalState({ open: false, sessionData: null, requiredFiles: [], step: 0 })}
            data-testid="session-load-modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleSessionLoadProceed}
            disabled={!modalState.requiredFiles.every(f => f.file)}
            data-testid="session-load-modal-load-btn"
          >
            Load Session
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { handleLoadSession, handleLoadAllSession, SessionLoadModal };
}

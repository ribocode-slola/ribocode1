/**
 * React context for managing viewer state in Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ViewerStateContextType {
  activeViewer: string;
  setActiveViewer: (viewer: string) => void;
  viewerAReady: boolean;
  setViewerAReady: (ready: boolean) => void;
  viewerBReady: boolean;
  setViewerBReady: (ready: boolean) => void;
}

const ViewerStateContext = createContext<ViewerStateContextType | undefined>(undefined);

export const ViewerStateProvider = ({ children }: { children: ReactNode }) => {
  const [activeViewer, setActiveViewer] = useState<string>('A');
  const [viewerAReady, setViewerAReady] = useState<boolean>(false);
  const [viewerBReady, setViewerBReady] = useState<boolean>(false);

  return (
    <ViewerStateContext.Provider value={{
      activeViewer,
      setActiveViewer,
      viewerAReady,
      setViewerAReady,
      viewerBReady,
      setViewerBReady,
    }}>
      {children}
    </ViewerStateContext.Provider>
  );
};

export const useViewerStateContext = () => {
  const context = useContext(ViewerStateContext);
  if (!context) throw new Error('useViewerStateContext must be used within a ViewerStateProvider');
  return context;
};

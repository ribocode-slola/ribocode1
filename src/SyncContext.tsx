import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

// SyncContextType interface definition.
interface SyncContextType {
    viewerA: PluginContext | null;
    setViewerA: React.Dispatch<React.SetStateAction<PluginContext | null>>;
    viewerB: PluginContext | null;
    setViewerB: React.Dispatch<React.SetStateAction<PluginContext | null>>;
    syncEnabled: boolean;
    setSyncEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    activeViewer: 'A' | 'B' | null;
    setActiveViewer: React.Dispatch<React.SetStateAction<'A' | 'B' | null>>;
}

// Create SyncContext with default undefined value.
const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Props for SyncProvider component.
interface SyncProviderProps {
    children: ReactNode;
}

// SyncProvider component to manage synchronization state between two viewers.
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);
    const [syncEnabled, setSyncEnabled] = useState<boolean>(false);
    const [activeViewer, setActiveViewer] = useState<'A' | 'B' | null>(null);
    // Effect to log changes to activeViewer for debugging.
    useEffect(() => {
        console.log('[SyncContext] activeViewer changed:', activeViewer);
    }, [activeViewer]);
    // Return a SyncContext provider with state values and setters.
    return (
        <SyncContext.Provider value={{
             viewerA, setViewerA, 
             viewerB, setViewerB, 
             syncEnabled, setSyncEnabled,
             activeViewer, setActiveViewer }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};
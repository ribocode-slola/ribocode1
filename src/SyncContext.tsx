import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

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

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
    children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);
    const [syncEnabled, setSyncEnabled] = useState<boolean>(false);
    const [activeViewer, setActiveViewer] = useState<'A' | 'B' | null>(null);

    useEffect(() => {
        console.log('[SyncContext] activeViewer changed:', activeViewer);
    }, [activeViewer]);

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
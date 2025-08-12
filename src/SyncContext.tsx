import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

interface SyncContextType {
    viewerA: PluginContext | null;
    setViewerA: React.Dispatch<React.SetStateAction<PluginContext | null>>;
    viewerB: PluginContext | null;
    setViewerB: React.Dispatch<React.SetStateAction<PluginContext | null>>;
    syncEnabled: boolean;
    setSyncEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
    children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);
    const [syncEnabled, setSyncEnabled] = useState<boolean>(false);

    return (
        <SyncContext.Provider value={{ viewerA, setViewerA, viewerB, setViewerB, syncEnabled, setSyncEnabled }}>
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

/**
A minimal test example that incremented a number.
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SyncContextType {
    a: number;
    setA: React.Dispatch<React.SetStateAction<number>>;
    b: number;
    setB: React.Dispatch<React.SetStateAction<number>>;
    syncEnabled: boolean;
    setSyncEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
    children: ReactNode; // Define the children prop
}

export const SyncProvider: React.FC<SyncProviderProps>  = ({ children }) => {
    const [a, setA] = useState<number>(0);
    const [b, setB] = useState<number>(0);
    const [syncEnabled, setSyncEnabled] = useState<boolean>(false);

    return (
        <SyncContext.Provider value={{ a, setA, b, setB, syncEnabled, setSyncEnabled }}>
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
*/

// This nearly worked, but I could not get the camera state to sync, so started again.
// import React, { createContext, Dispatch, useContext, useState, useCallback, useMemo, SetStateAction } from 'react';

// /**
//  *  Represents the state of a camera, including its position, target, up vector, and field of view (fov).
//  */
// export type CameraState = {
//     position: { x: number; y: number; z: number };
//     target: { x: number; y: number; z: number };
//     up: { x: number; y: number; z: number };
//     fov: number;
// };

// /**
//  * SyncContextType defines the structure of the context used for synchronizing camera states
//  * between different components.
//  * It includes the current camera state,
//  * a function to set the camera state,
//  * a flag to enable or disable synchronization,
//  * a function to set the synchronization flag,
//  * a callback for when the camera state changes,
//  * a function to apply a camera state,
//  * and a function to update the camera state.
//  */
// export type SyncContextType = {
//     syncCameraState: CameraState | null;
//     setSyncCameraState: Dispatch<SetStateAction<CameraState | null>>;
//     syncEnabled: boolean;
//     setSyncEnabled: Dispatch<SetStateAction<boolean>>;
//     onCameraChange: (cameraState: CameraState) => void;
//     applyCameraState: (callback: (cameraState: CameraState) => void) => void;
//     updateSyncState: (state: CameraState) => void;
//     cameraState: CameraState | null;
//     setCameraState: Dispatch<SetStateAction<CameraState | null>>; 
//     updateCameraState: (state: CameraState) => void;
// };

// const noop = () => {};

// /**
//  * Default context values for SyncContext.
//  * These values are used when no provider is found in the component tree.
//  */
// export const defaultContext: SyncContextType = {
//     cameraState: null,
//     setCameraState: noop,
//     syncCameraState: null,
//     setSyncCameraState: noop,
//     syncEnabled: false,
//     setSyncEnabled: noop,
//     onCameraChange: noop,
//     applyCameraState: noop,
//     updateCameraState: noop,
//     updateSyncState: noop,
// };

// /**
//  * SyncContext is a React context that provides synchronization functionality
//  * for camera states across different components.
//  */
// const SyncContext = createContext<SyncContextType>(defaultContext);


// /**
//  * SyncProviderProps defines the properties for the SyncProvider component.
//  * It includes children, which are the components that will consume the context.
//  */
// interface SyncProviderProps {
//     children: React.ReactNode;
// }

// /**
//  * SyncProvider is a React component that provides the SyncContext to its children.
//  * It manages the synchronization state and provides functions to update and apply camera states.
//  */
// export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
//     const [cameraState, setCameraState] = useState<CameraState | null>(null);
//     const [syncEnabled, setSyncEnabled] = useState<boolean>(false);
//     const [cameraStateCallback, setCameraStateCallback] = useState<((cameraState: CameraState) => void) | null>(null);
//     const isValidCameraState = (state: CameraState | null): boolean => {
//         return !!state && Object.keys(state).length > 0;
//     };
//     const onCameraChange = useCallback((cameraState: CameraState) => {
//         if (isValidCameraState(cameraState)) {
//             console.log('Camera state changed:', cameraState); // Debugging
//             setCameraState(cameraState); // Broadcast the camera state
//         } else {
//             console.warn('Invalid camera state:', cameraState);
//         }
//     }, []);

//     const applyCameraState = useCallback((callback: (cameraState: CameraState) => void) => {
//         setCameraStateCallback(() => callback);
//     }, []);

//     const updateCameraState = useCallback((state: CameraState) => {
//         if (cameraStateCallback && state && Object.keys(state).length > 0) {
//             console.log('Updating camera state from sync:', state); // Debugging
//             try {
//                 cameraStateCallback(state);
//             } catch (error) {
//                 console.error('Error updating camera state:', error);
//             }
//         } else {
//             console.warn('Invalid state passed to updateSyncState:', state);
//         }
//     }, [cameraStateCallback]);

//     const contextValue = useMemo(() => ({
//         syncCameraState: cameraState,
//         setSyncCameraState: setCameraState,
//         syncEnabled,
//         setSyncEnabled,
//         onCameraChange,
//         applyCameraState,
//         updateSyncState: updateCameraState,
//         cameraState,
//         setCameraState,
//         updateCameraState
//     }), [
//         cameraState,
//         syncEnabled,
//         onCameraChange,
//         applyCameraState,
//         updateCameraState
//     ]);
    
//     return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>;
// };

// /**
//  * useSync is a custom hook that provides access to the SyncContext.
//  * It allows components to interact with the synchronization functionality.
//  * @returns The current context value from SyncContext.
//  */
// export const useSync = () => {
//     return useContext(SyncContext);
// };
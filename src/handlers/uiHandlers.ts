/**
 * UI and event handler functions for the Ribocode app.
 *
 * This file centralizes React event handlers and UI logic that are not pure structure utilities.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 */
import { useCallback } from 'react';
import { MoleculeMode } from '../types/molecule';

// Handler for file input changes (molecule loading)
export function useHandleFileChange(viewerARef: any, viewerBRef: any) {
    return useCallback(
        async (
            e: React.ChangeEvent<HTMLInputElement>,
            mode: MoleculeMode
        ) => {
            const pluginA = viewerARef.current;
            const pluginB = viewerBRef.current;
            if (!pluginA || !pluginB) {
                console.error('One or both viewers are not initialized.');
                return;
            }
            try {
                const file = e.target.files?.[0];
                if (!file) return;
                // ...molecule loading logic here...
            } catch (err) {
                console.error('Error loading molecule:', err);
            }
        },
        [viewerARef, viewerBRef]
    );
}

// Handler for toggling molecule visibility
export async function handleToggle(viewer: any, moleculeKey: string, setVisible: (v: boolean) => void, isVisible: boolean) {
    const molecule = viewer[moleculeKey];
    const model = molecule?.presetResult && (molecule.presetResult as any).model;
    if (model) {
        await toggleVisibility(viewer, model);
        setVisible(!isVisible);
    }
}

// Dummy toggleVisibility for illustration (replace with actual import/logic)
async function toggleVisibility(viewer: any, model: any) {
    // ...actual visibility logic...
}

/**
 * SyncButton component for toggling synchronization between two Mol* viewers.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React, { useEffect, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import type { ViewerKey } from '../../types/ribocode';
import GenericSelectButton from './select/Select';

/**
 * Suffix for the SyncButton id, used for consistent id construction in code and tests.
 */
export const idSuffix = 'sync-select';

/**
 * Props for SyncButton component.
 * @param viewerA The first Mol* PluginUIContext instance.
 * @param viewerB The second Mol* PluginUIContext instance.
 * @param activeViewer Indicates which viewer is the source for synchronization ('A' or 'B').
 * @param disabled Whether the sync button is disabled.
 * @param syncEnabled Whether synchronization is currently enabled.
 * @param setSyncEnabled Function to toggle synchronization state.
 */
interface SyncButtonProps {
    viewerA: PluginUIContext | null;
    viewerB: PluginUIContext | null;
    activeViewer: ViewerKey;
    disabled: boolean;
    syncEnabled: boolean;
    setSyncEnabled: (enabled: boolean) => void;
    id?: string;
}

/**
 * A button component to toggle synchronization between two Mol* viewers.
 * @param viewerA The first Mol* PluginUIContext instance.
 * @param viewerB The second Mol* PluginUIContext instance.
 * @param activeViewer Indicates which viewer is the source for synchronization ('A' or 'B').
 * @param disabled Whether the sync button is disabled.
 * @param syncEnabled Whether synchronization is currently enabled.
 * @param setSyncEnabled Function to toggle synchronization state.
 * @returns The SyncButton component.
 */
const SyncButton: React.FC<SyncButtonProps> = ({
    viewerA,
    viewerB,
    activeViewer,
    disabled,
    syncEnabled,
    setSyncEnabled,
    id
}) => {
    const isApplyingSync = useRef(false);

    useEffect(() => {
        if (!syncEnabled || !viewerA || !viewerB) return;
        const syncCameraState = (sourceViewer: PluginUIContext, targetViewer: PluginUIContext) => {
            if (isApplyingSync.current) return;

            const sourceCamera = sourceViewer?.canvas3d?.camera;
            const targetCamera = targetViewer?.canvas3d?.camera;
            if (!sourceCamera || !targetCamera) return;

            const state = sourceCamera.getSnapshot();
            isApplyingSync.current = true;
            try {
                targetCamera.setState({
                    ...targetCamera.state,
                    position: Vec3.clone(state.position),
                    target: Vec3.clone(state.target),
                    up: Vec3.clone(state.up),
                    radius: state.radius,
                });
                targetViewer.canvas3d?.requestDraw?.();
            } finally {
                isApplyingSync.current = false;
            }
        };

        const subA = viewerA?.canvas3d?.camera?.stateChanged.subscribe(() => syncCameraState(viewerA, viewerB));
        const subB = viewerB?.canvas3d?.camera?.stateChanged.subscribe(() => syncCameraState(viewerB, viewerA));

        return () => {
            subA?.unsubscribe?.();
            subB?.unsubscribe?.();
        };
    }, [syncEnabled, viewerA, viewerB, activeViewer]);

    // Return the sync select button.
    return (
        <GenericSelectButton
            label="Select Sync"
            options={['On', 'Off']}
            selected={syncEnabled ? 'On' : 'Off'}
            onSelect={option => setSyncEnabled(option === 'On')}
            disabled={disabled}
            id={id}
        />
    );
};

export default SyncButton;
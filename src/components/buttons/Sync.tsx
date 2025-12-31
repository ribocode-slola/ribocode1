/**
 * SyncButton component for toggling synchronization between two Mol* viewers.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import { ViewerKey } from '../RibocodeViewer';
import { A } from '../../App';
import GenericSelectButton from './select/Select';

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
    setSyncEnabled
}) => {
    useEffect(() => {
        if (!syncEnabled || !viewerA || !viewerB) return;
        // Determine source and target viewers based on activeViewer.
        const sourceViewer = activeViewer === A ? viewerA : viewerB;
        const targetViewer = activeViewer === A ? viewerB : viewerA;
        if (!sourceViewer?.canvas3d?.camera || !targetViewer?.canvas3d?.camera) return;
        // Get source and target cameras.
        const sourceCamera = sourceViewer.canvas3d.camera;
        const targetCamera = targetViewer.canvas3d.camera;
        // Subscribe to source camera state changes.
        const subscription = sourceCamera.stateChanged.subscribe(() => {
            const state = sourceCamera.getSnapshot();
            console.log('Target radius before setState:', targetCamera.getSnapshot().radius);
            targetCamera.setState({
                ...targetCamera.state,
                position: Vec3.clone(state.position),
                target: Vec3.clone(state.target),
                up: Vec3.clone(state.up),
                radius: state.radius,
            });
            // Force target viewer to redraw.
            if (targetViewer.canvas3d) {
                targetViewer.canvas3d.requestDraw();
            }
            console.log('Source radius:', state.radius);
            console.log('Target radius after setState:', targetCamera.getSnapshot().radius);
        });
        // Cleanup subscription on effect cleanup.
        return () => subscription.unsubscribe();
    }, [syncEnabled, viewerA, viewerB, activeViewer]);
    // Return the sync select button.
    return (
        <GenericSelectButton
            label="Select Sync"
            options={['On', 'Off']}
            selected={syncEnabled ? 'On' : 'Off'}
            onSelect={option => setSyncEnabled(option === 'On')}
            disabled={disabled}
        />
    );
};

export default SyncButton;
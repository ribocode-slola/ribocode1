import React, { useEffect } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { useSync } from './SyncContext';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';

const SyncButton: React.FC<{
    viewerA: PluginUIContext | null;
    viewerB: PluginUIContext | null;
    activeViewer: 'A' | 'B';
    disabled: boolean
}> = ({ viewerA, viewerB, activeViewer, disabled }) => {
    const { syncEnabled, setSyncEnabled } = useSync();

    useEffect(() => {
        if (!syncEnabled || !viewerA || !viewerB) return;

        const sourceViewer = activeViewer === 'A' ? viewerA : viewerB;
        const targetViewer = activeViewer === 'A' ? viewerB : viewerA;

        if (!sourceViewer?.canvas3d?.camera || !targetViewer?.canvas3d?.camera) return;

        const sourceCamera = sourceViewer.canvas3d.camera;
        const targetCamera = targetViewer.canvas3d.camera;

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

        return () => subscription.unsubscribe();
    }, [syncEnabled, viewerA, viewerB, activeViewer]);

    const handleSyncToggle = () => setSyncEnabled(!syncEnabled);

    return (
        <button
            onClick={handleSyncToggle}
            disabled={disabled}
        >
            {syncEnabled ? 'Action to unsync' : 'Action to sync'}
        </button>
    );
};

export default SyncButton;
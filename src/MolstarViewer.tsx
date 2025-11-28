import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import './MolstarContainer.css';
import { Structure } from 'molstar/lib/mol-model/structure';

interface MolstarViewerProps {
    moleculeId: string;
    moleculeUrl: string;
    plugin: PluginUIContext | null;
    viewerKey: string;
    onSelectionChange: (selection: any) => void;
    externalSelection: any;
}

const MolstarViewer: React.FC<MolstarViewerProps> = ({ 
    moleculeId, moleculeUrl, viewerKey, onSelectionChange, externalSelection }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const pluginRef = useRef<any>(null);
    const molecule = useRef<Structure | null>(null);
    const center = useRef<ReturnType<typeof Vec3.create>>(Vec3.create(0, 0, 0));
    const [viewer, setLocalViewer] = useState<InstanceType<typeof PluginUI> | null>(null);
    
    // Camera subscription cleanup
    useEffect(() => {
        if (!viewer || viewer.disposed) return;
        const camera = pluginRef.current?.canvas3d?.camera;
        let sub: any;
        if (camera) {
            const reportCameraPosition = () => { /* ... */ };
            sub = camera.stateChanged.subscribe(reportCameraPosition);
            reportCameraPosition();
        }
        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [viewer, viewerKey]);

    // Selection change subscription
    useEffect(() => {
        if (
            !viewer ||
            (viewer as any).disposed || // If disposed is private, use public checks
            !viewer.managers?.interactivity?.selection
        ) {
            console.log(`[MolstarViewer ${viewerKey}] Viewer not ready for selection subscription.`);
            return;
        }
    
        const selectionManager = viewer.managers.interactivity.selection;
        if (!selectionManager?.events?.changed) {
            console.warn(`[MolstarViewer ${viewerKey}] Selection manager events not available`, selectionManager);
            return;
        }
    
        let sub: { unsubscribe: () => void } | undefined;
        try {
            sub = selectionManager.events.changed.subscribe(() => {
                const selection = selectionManager.getSelection();
                console.log(`[MolstarViewer ${viewerKey}] Selection changed`, selection);
                onSelectionChange(selection);
            });
        } catch (err) {
            console.error(`[MolstarViewer ${viewerKey}] Error subscribing to selection changed`, err);
        }
    
        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [viewer, onSelectionChange, viewerKey]);

    // External selection synchronization
    useEffect(() => {
        if (!viewer || viewer.disposed || !externalSelection) {
            console.log(`[MolstarViewer ${viewerKey}] Viewer not ready for external selection.`);
            return;
        }
        const currentSelection = viewer.managers.interactivity.selection.getSelection();
        console.log(`[MolstarViewer ${viewerKey}] Comparing selections`, { currentSelection, externalSelection });
        if (JSON.stringify(currentSelection) !== JSON.stringify(externalSelection)) {
            console.log(`[MolstarViewer ${viewerKey}] Setting new selection`, externalSelection);
            viewer.managers.interactivity.selection.setSelection(externalSelection);
            // Force update if Molstar doesn't emit change event
            if (viewer.managers.interactivity.selection.events.changed) {
                viewer.managers.interactivity.selection.events.changed.next();
            }
        }
    }, [viewer, externalSelection, viewerKey]);
    
    // Molecule loading and camera setup
    useEffect(() => {
        if (!viewer || viewer.disposed) {
            console.log(`[MolstarViewer ${viewerKey}] Viewer not ready for molecule load.`);
            return;
        }
        console.log(`[MolstarViewer ${viewerKey}] Viewer-dependent effect. viewer:`, viewer);

        let cameraSubscription: any;

        const loadMolecule = async () => {
            const url = moleculeUrl;
            //const lowerCaseMoleculeId = moleculeId.toLowerCase();
            //const url = `file:///C:/Users/geoagdt/Downloads/${lowerCaseMoleculeId}.cif`;
            const data = await viewer.builders.data.download(
                { url: url },
                { state: { isGhost: true } }
            );
            if (!data) return;

            const trajectory = await viewer.builders.structure.parseTrajectory(data, 'mmcif');
            const model = await viewer.builders.structure.createModel(trajectory);
            const structure = await viewer.builders.structure.createStructure(model);

            await viewer.builders.structure.hierarchy.applyPreset(trajectory, 'default');

            if (!structure || !structure.data) return;
            molecule.current = structure.data;

            // Center calculation
            const boundingSphere = structure.data?.boundary.sphere;
            if (boundingSphere) {
                center.current = Vec3.clone(boundingSphere.center);
            }

            // Camera state logging
            const camera = pluginRef.current.canvas3d?.camera;
            if (camera) {
                const reportCameraPosition = () => {
                    const { position, target, up, fov } = camera.state;
                    console.log('Camera Position:', position);
                    console.log('Camera Target:', target);
                    console.log('Camera Orientation (Up Vector):', up);
                    console.log('Camera Field Of View:', fov);
                };
                cameraSubscription = camera.stateChanged.subscribe(reportCameraPosition);
                reportCameraPosition();
            }
        };
        loadMolecule();

        return () => {
            if (cameraSubscription) cameraSubscription.unsubscribe();
        };
    }, [viewer, moleculeId, moleculeUrl, viewerKey]);

    return (
        <div className="molstar-viewer">
            {/* Plugin container */}
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

export default MolstarViewer;
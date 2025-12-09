import React, { forwardRef, useState, useEffect, useRef } from 'react';
//import { Viewer } from 'molstar/lib/apps/viewer/app';
import ReactDOM from 'react-dom/client';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
//import { loadMoleculeToViewer } from './utils/data';
import { Structure } from 'molstar/lib/mol-model/structure';
import './MolstarContainer.css';

interface RibocodeViewerProps {
    //moleculeId?: string;
    //moleculeUrl?: string;
    plugin: PluginUIContext | null;
    viewerKey: string;
    onSelectionChange: (selection: any) => void;
    externalSelection: any;
    onReady?: (viewer: PluginUIContext | null) => void;
}

const RibocodeViewer: React.FC<RibocodeViewerProps> = ({ 
    //moleculeId, moleculeUrl,
    plugin, viewerKey, onSelectionChange,
    externalSelection, onReady }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const pluginRef = useRef<any>(null);
    const molecule = useRef<Structure | null>(null);
    const center = useRef<ReturnType<typeof Vec3.create>>(Vec3.create(0, 0, 0));
    //const [viewer, setLocalViewer] = useState<InstanceType<typeof PluginUIContext> | null>(null);
    const [viewerReady, setViewerReady] = useState(false);
    const viewerRef = useRef<PluginUIContext | null>(null);

    // Viewer setup effect: initializes viewer when plugin is available
    useEffect(() => {
        if (plugin && containerRef.current) {
            viewerRef.current = plugin;
            setViewerReady(true);
            console.log(`[RibocodeViewer ${viewerKey}] Viewer initialized.`);
            if (onReady) onReady(viewerRef.current); // <-- Notify parent
        }
        return () => {
            viewerRef.current = null;
            setViewerReady(false);
            if (onReady) onReady(null); // <-- Notify parent on cleanup
        };
    }, [plugin]);

    // Viewer initialization effect
    useEffect(() => {
        //console.log(`[MolstarViewer ${viewerKey}] Viewer initialization effect. viewer:`, viewer);
        console.log(`[RibocodeViewer ${viewerKey}] Viewer initialization effect. viewer:`, viewerRef.current);
        //if (viewer && !(viewer as any).disposed) {
        if (viewerRef.current && !(viewerRef.current as any).disposed) {
            setViewerReady(true);
            console.log(`[RibocodeViewer ${viewerKey}] Viewer ready.`);
        }
    //}, [viewer]);
    }, [viewerReady]);

    // // Molecule loading effect: loads molecule when plugin and molecule info are available
    // useEffect(() => {
    //     if (!plugin || (plugin as any).disposed || !moleculeId || !moleculeUrl) {
    //         console.log(`[RibocodeViewer ${viewerKey}] Viewer not ready for molecule load.`);
    //         return;
    //     }
    //     const load = async () => {
    //         try {
    //             const structure = await loadMoleculeToViewer(plugin, { id: moleculeId, url: moleculeUrl });
    //             // handle structure, e.g. set state or call callback
    //         } catch (err) {
    //             console.error(`[RibocodeViewer ${viewerKey}] Molecule load failed:`, err);
    //         }
    //     };
    //     load();
    // }, [viewerReady, moleculeId, moleculeUrl, viewerKey]);

    // // Molecule loading and camera setup
    // useEffect(() => {
    //     //if (!viewerReady || !viewer || (viewer as any).disposed || !moleculeId || !moleculeUrl) {
    //     //if (!viewerReady || !viewerRef.current || (viewerRef.current as any).disposed || !moleculeId || !moleculeUrl) {
    //     if (!viewerReady || !viewerRef.current || (viewerRef.current as any).disposed) {
    //                 console.log(`[RibocodeViewer ${viewerKey}] Viewer not ready for molecule load.`);
    //         return;
    //     }

    //     //console.log(`[RibocodeViewer ${viewerKey}] Viewer-dependent effect. viewer:`, viewer);
    //     console.log(`[RibocodeViewer ${viewerKey}] Viewer-dependent effect. viewer:`, viewerRef.current);

    //     let cameraSubscription: any;

    //     const loadMolecule = async () => {
    //         try {
    //             const url = moleculeUrl;
    //             const id = moleculeId.toLowerCase();
    //             //const structure = await loadMoleculeToViewer(viewer, {id, url});
    //             const plugin = viewerRef.current?.plugin;
    //             if (!plugin) {
    //                 console.log(`[RibocodeViewer ${viewerKey}] Plugin not available.`);
    //                 return;
    //             }
    //             const structure = await loadMoleculeToViewer(plugin, {id, url});
                
    //             if (!structure || !structure.data) {
    //                 console.log(`[RibocodeViewer ${viewerKey}] Structure not loaded.`);
    //                 return;
    //             }
    //             molecule.current = structure.data;

    //             // Center calculation
    //             const boundingSphere = structure.data?.boundary.sphere;
    //             if (boundingSphere) {
    //                 center.current = Vec3.clone(boundingSphere.center);
    //             }

    //             // Camera state logging
    //             const canvas3d = plugin.canvas3d;
    //             if (canvas3d && canvas3d.camera) {
    //                 const camera = canvas3d.camera;
    //                 const reportCameraPosition = () => {
    //                     const { position, target, up, fov } = camera.state;
    //                     console.log('Camera Position:', position);
    //                     console.log('Camera Target:', target);
    //                     console.log('Camera Orientation (Up Vector):', up);
    //                     console.log('Camera Field Of View:', fov);
    //                 };
    //                 cameraSubscription = camera.stateChanged.subscribe(reportCameraPosition);
    //                 reportCameraPosition();
    //             }
    //         } catch (error) {
    //             console.error(`[RibocodeViewer ${viewerKey}] Error loading molecule:`, error);
    //         }
    //     };
    //     loadMolecule();
        
    //     return () => {
    //         if (cameraSubscription) cameraSubscription.unsubscribe();
    //     };
    // //}, [viewerReady, viewer, moleculeId, moleculeUrl, viewerKey]);
    // }, [viewerReady, moleculeId, moleculeUrl, viewerKey]);

    return (
        <div className="ribocode-viewer">
            {/* Plugin container */}
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

export default RibocodeViewer;
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
//import * as PluginUIModule from 'molstar/lib/commonjs/mol-plugin-ui';
//const createPluginUI = PluginUIModule.createPluginUI;
//import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import * as PluginUI from 'molstar/lib/mol-plugin-ui';
const createPluginUI = PluginUI.createPluginUI;
//import * as Vec3Module from 'molstar/lib/commonjs/mol-math/linear-algebra/3d/vec3';
//const Vec3 = Vec3Module.Vec3;
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import './MolstarContainer.css';
//import { Structure, StructureElement } from 'molstar/lib/mol-model/structure';
import { Structure } from 'molstar/lib/mol-model/structure';
// Use Structure everywhere, including for types
//import * as Mat4Module from 'molstar/lib/commonjs/mol-math/linear-algebra/3d/mat4';
//const Mat4 = Mat4Module.Mat4; // Use this instead of barrel import
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
import { Entities } from 'molstar/lib/mol-model/structure/model/properties/common';
import { CIF } from 'molstar/lib/mol-io/reader/cif';
import { Asset } from 'molstar/lib/mol-util/assets';
import * as fs from 'fs';
import * as path from 'path';


interface MolstarViewerProps {
    moleculeId: string;
    setViewer: React.Dispatch<React.SetStateAction<PluginContext | null>>;
    viewerKey: string;
    onSelectionChange: (selection: any) => void;
    externalSelection: any;
    onViewerInit?: (viewer: InstanceType<typeof PluginUI>) => void;
}

const MolstarViewer: React.FC<MolstarViewerProps> = ({ 
    moleculeId, setViewer, viewerKey, onSelectionChange, externalSelection, onViewerInit }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const pluginRef = useRef<any>(null);
    const molecule = useRef<Structure | null>(null);
    const center = useRef<ReturnType<typeof Vec3.create>>(Vec3.create(0, 0, 0));
    const [viewer, setLocalViewer] = useState<InstanceType<typeof PluginUI> | null>(null);
    
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
    
    // Plugin lifecycle: initialization and cleanup
    useEffect(() => {
        const container = containerRef.current;
        console.log(`[MolstarViewer ${viewerKey}] Plugin init effect. containerRef.current:`, container);
        if (!container) return;

        // Cleanup previous plugin/root
        if (pluginRef.current) {
            console.log(`[MolstarViewer ${viewerKey}] Disposing plugin...`);
            pluginRef.current.dispose();
            pluginRef.current = null;
        }
        if (rootRef.current) {
            console.log(`[MolstarViewer ${viewerKey}] Unmounting React root...`);
            rootRef.current.unmount();
            rootRef.current = null;
        }
        
        // Async plugin initialization
        const initializePlugin = async () => {
            try {
                console.log(`[MolstarViewer ${viewerKey}] Before createPluginUI`);
                const plugin = await createPluginUI({
                    target: container,
                    render: (component: React.ReactNode, container: HTMLElement) => {
                        if (!rootRef.current) {
                            rootRef.current = ReactDOM.createRoot(container);
                        }
                        rootRef.current.render(component);
                    },
                });
                console.log(`[MolstarViewer ${viewerKey}] After createPluginUI, plugin:`, plugin);
            
                // WebGL context loss handling
                const gl = plugin.canvas3d?.webgl?.gl;
                if (gl) {
                    gl.canvas.addEventListener('webglcontextlost', (event: WebGLContextEvent) => {
                        event.preventDefault();
                        console.error('WebGL context lost.');
                    });

                    gl.canvas.addEventListener('webglcontextrestored', () => {
                        (async () => {
                            if (pluginRef.current) {
                                pluginRef.current.dispose();
                                pluginRef.current = null;
                            }
                            await initializePlugin();
                        })();
                    });
                }

                pluginRef.current = plugin;
                setLocalViewer(plugin);
                setViewer(plugin);
                console.log(`[MolstarViewer ${viewerKey}] setViewer called with:`, plugin);
                if (onViewerInit) onViewerInit(plugin);
            } catch (err) {
                console.error(`[MolstarViewer ${viewerKey}] Plugin creation failed:`, err);
            }
        };

        // Fire-and-forget async call
        initializePlugin();

        // Cleanup on unmount
        return () => {
            if (pluginRef.current) {
                console.log(`[MolstarViewer ${viewerKey}] Disposing plugin...`);
                pluginRef.current.dispose();
                pluginRef.current = null;
            }
            if (rootRef.current) {
                console.log(`[MolstarViewer ${viewerKey}] Unmounting React root...`);
                rootRef.current.unmount();
                rootRef.current = null;
            }
        };
    }, [viewerKey]);

    // Molecule loading and camera setup
    useEffect(() => {
        if (!viewer || viewer.disposed) {
            console.log(`[MolstarViewer ${viewerKey}] Viewer not ready for molecule load.`);
            return;
        }
        console.log(`[MolstarViewer ${viewerKey}] Viewer-dependent effect. viewer:`, viewer);

        const loadMolecule = async () => {
            const lowerCaseMoleculeId = moleculeId.toLowerCase();
            const url = `file:///C:/Users/geoagdt/Downloads/${lowerCaseMoleculeId}.cif`;
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
                camera.stateChanged.subscribe(reportCameraPosition);
                reportCameraPosition();
            }
        };
        loadMolecule();
    }, [viewer, moleculeId, viewerKey]);

    return (
        <div className="molstar-viewer">
            {/* Button placed outside the plugin container */}

            {/*<button onClick={saveTransformedCIF}>Save Transformed CIF</button>*/}

            {/* Plugin container */}
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

export default MolstarViewer;


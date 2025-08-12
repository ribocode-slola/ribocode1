import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
//import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import './MolstarContainer.css';
import { Structure, StructureElement } from 'molstar/lib/mol-model/structure';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
import { Entities } from 'molstar/lib/mol-model/structure/model/properties/common';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { CIF } from 'molstar/lib/mol-io/reader/cif';
import { Asset } from 'molstar/lib/mol-util/assets';
import * as fs from 'fs';
import * as path from 'path';


interface MolstarViewerProps {
    moleculeId: string;
    setViewer: (viewer: any) => void; // Adjust type as needed
}

//const MolstarViewer: React.FC<MolstarViewerProps> = ({ moleculeId, isViewerA, setViewer, reportCameraState }) => {
const MolstarViewer: React.FC<MolstarViewerProps> = ({ moleculeId, setViewer }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const pluginRef = useRef<any>(null);
    const molecule = useRef<Structure | null>(null);
    const center = useRef<Vec3>(Vec3.create(0, 0, 0)); // Center of the molecule
    //const cameraPosition = useRef<Vec3>(Vec3.create(0, 0, 0)); // Camera position

    // const saveTransformedCIF = () => {
    //     if (!pluginRef.current || !molecule.current) {
    //         console.error('Plugin or molecule data is not available.');
    //         return;
    //     }

    //     const camera = pluginRef.current.canvas3d?.camera;
    //     if (!camera) {
    //         console.error('Camera is not available.');
    //         return;
    //     }
    
    //     // Get camera state
    //     const { position, target, up } = camera.state;
    
    //     // Calculate transformation matrix
    //     const transformationMatrix = Mat4.lookAt(Mat4.zero(), position, target, up);
    
    //     const transformedCoordinates: Vec3[] = [];
    //     const structure = molecule.current;

    //     const model = structure.model;
    //     if (!model) {
    //         console.error('Model data is not available in the structure.');
    //         return;
    //     }
    //     const entities: Entities = model.entities;

    //     // Iterate over the entities
    //     for (const entity of entities) {
    //         console.log('Entity:', entity);
    //     }




    //     for (entity : let i = 0; i < elementCount; i++) {
    //         elementLocations.getElement(structure, i); // Access each element
    //         if (element && element.kind === 'atom') {
    //             const coord = element.atom?.conformation.position(element.atom.index); // Get atomic position
    //             if (coord) {
    //                 const transformedCoord = Vec3.transformMat4(Vec3.zero(), coord, transformationMatrix); // Apply transformation
    //                 transformedCoordinates.push(transformedCoord); // Store transformed coordinates
    //             }
    //         } else if (element && element.kind === 'substructure') {
    //             console.warn('Substructure encountered, skipping:', element);
    //         }
    //     }

    //     console.log('Transformed Coordinates:', transformedCoordinates);

    
    
    //     // Generate CIF content
    //     const cifContent = generateCIF(transformedCoordinates);
    
    //     // Save CIF file
    //     const blob = new Blob([cifContent], { type: 'text/plain' });
    //     const link = document.createElement('a');
    //     link.href = URL.createObjectURL(blob);
    //     link.download = `${moleculeId}_transformed.cif`;
    //     link.click();
    // };

    // const generateCIF = (coordinates: Vec3[]) => {
    //     let cifData = `data_transformed\n`;
    //     coordinates.forEach((coord, index) => {
    //         cifData += `ATOM ${index + 1} ${coord[0]} ${coord[1]} ${coord[2]}\n`;
    //     });
    //     return cifData;
    // };
    
    useEffect(() => {
        const initializePlugin = async () => {
            if (pluginRef.current) {
                console.warn('Plugin is already initialized.');
                return; // Prevent multiple initializations
            }

            try {
                const container = containerRef.current;
                if (!container) {
                    console.error('Container is not available.');
                    return;
                }

                // Initialize the Mol* plugin
                const plugin = await createPluginUI({
                    target: container,
                    render: (component, container) => {
                        if (!rootRef.current) {
                            rootRef.current = ReactDOM.createRoot(container);
                        }
                        rootRef.current.render(component);
                    },
                });

                pluginRef.current = plugin; // Store the plugin instance in the ref

                // Set the plugin instance in the parent component
                setViewer(plugin);

                // Handle WebGL context loss
                const gl = plugin.canvas3d?.webgl?.gl;
                if (gl) {
                    gl.canvas.addEventListener('webglcontextlost', (event) => {
                        event.preventDefault();
                        console.error('WebGL context lost.');
                    });

                    gl.canvas.addEventListener('webglcontextrestored', () => {
                        console.log('WebGL context restored. Cleaning up and reinitializing plugin...');
                        (async () => {
                            if (pluginRef.current) {
                                pluginRef.current.dispose();
                                pluginRef.current = null;
                            }
                            await initializePlugin(); // Reinitialize the plugin on context restore
                        })();
                    });
                }

                // // Load and visualize molecule downloaded from rcsb.
                // const url = `https://files.rcsb.org/download/${moleculeId}.cif`;
                // const data = await plugin.builders.data.download(
                //     { url: url },
                //     { state: { isGhost: true } }
                // );

                // // Load and visualize molecule from file.
                // // convert moleculeId to lower case
                const lowerCaseMoleculeId = moleculeId.toLowerCase();
                // const filePath = `file:///C:/Users/geoagdt/Downloads/${lowerCaseMoleculeId}.cif`;
                const url = `file:///C:/Users/geoagdt/Downloads/${lowerCaseMoleculeId}.cif`;
                const data = await plugin.builders.data.download(
                    { url: url },
                    { state: { isGhost: true } }
                );
                // const response = await fetch(filePath);
                // const fileContent = await response.text();
                // const data = await plugin.builders.data.fromText(
                //     fileContent, { state: { isGhost: true } });
                
                if (!data) {
                    console.error('Failed to load data for molecule:', moleculeId);
                    return;
                }
                // Load from a local file
                // const data = await plugin.builders.data.download({ url: 'path/to/your/local/file.cif' }, { state: { isGhost: true } });
                console.log('Data loaded successfully:', data);

                const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
                const model = await plugin.builders.structure.createModel(trajectory);
                const structure = await plugin.builders.structure.createStructure(model);

                await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

                if (!structure || !structure.data) {
                    console.error('Failed to create structure or retrieve structure data.');
                    return;
                }

                const structureData = structure.data;

                console.log('Structure data:', structureData);

                // Assign the loaded molecule to the ref
                molecule.current = structureData

                console.log('Molecule data:', molecule.current); // Log molecule data for debugging


                await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

                // Calculate the center of the molecule using the structure's bounding sphere
                const boundingSphere = structureData?.boundary.sphere;

                if (boundingSphere) {
                    center.current = Vec3.clone(boundingSphere.center);
                    console.log('Molecule center:', center.current);
                } else {
                    console.error('Failed to calculate the molecule center.');
                }

                console.log('Molecule center:', center.current);

                // Access the camera manager
                const camera = pluginRef.current.canvas3d?.camera;

                if (camera) {
                    // Function to log camera position
                    const reportCameraPosition = () => {
                        const { position, target, up, fov } = camera.state;
                        console.log('Camera Position:', position);
                        console.log('Camera Target:', target);
                        console.log('Camera Orientation (Up Vector):', up);
                        console.log('Camera Field Of View:', fov);
                    };

                    // Listen for camera state changes
                    const unsubscribe = camera.stateChanged.subscribe(() => {
                        reportCameraPosition();
                    });

                    // Report initial camera position
                    reportCameraPosition();

                    // Cleanup on unmount
                    return () => {
                        unsubscribe(); // Remove the event listener
                        if (pluginRef.current) {
                            pluginRef.current.dispose();
                            pluginRef.current = null;
                        }
                    };
                }

            } catch (error) {
                console.error('An error occurred while initializing the plugin:', error);
            }
        };

        initializePlugin();

        return () => {
            // Cleanup resources on unmount
            if (pluginRef.current) {
                console.log('Disposing plugin...');
                try {
                    // Ensure proper cleanup
                    pluginRef.current.dispose();
                } catch (error) {
                    console.error('Error during plugin disposal:', error);
                }
                pluginRef.current = null;
            }
            if (rootRef.current) {
                console.log('Unmounting React root...');
                setTimeout(() => {
                    rootRef.current?.unmount();
                    rootRef.current = null;
                }, 0);
            }
        };
    }, [moleculeId, setViewer]); // Re-run only if `moleculeId` changes

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


import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';

// Defines a React component MolstarContainer that integrates the Mol* library for molecular visualization.
const MolstarContainer = ({ moleculeUrl }: { moleculeUrl: string }) => {
    // viewerRef: A reference to the <div> element where the Mol* plugin will render the visualization.
    const viewerRef = useRef<HTMLDivElement | null>(null);
    // pluginRef: A reference to the Mol* plugin instance.
    const pluginRef = useRef<any>(null);
    // rootRef: A reference to the ReactDOM root instance for rendering React components inside the Mol* plugin.
    const rootRef = useRef<ReactDOM.Root | null>(null); // Store the ReactDOM root instance

    useEffect(() => {
        const initializePlugin = async () => {
            if (viewerRef.current) {
                try {
                    // Dispose of any existing plugin instance
                    pluginRef.current?.dispose();

                    // Create the plugin instance asynchronously
                    // Initialize the Mol* plugin with a custom render function.
                    const plugin = await createPluginUI({
                        target: viewerRef.current,
                        render: (component, container) => {
                            if (!container) return;

                            // Store the root instance in a WeakMap or similar structure
                            if (!rootRef.current) {
                                console.log('Creating new React root');
                                rootRef.current = ReactDOM.createRoot(container); // Create root only once
                            } else {
                                console.log('Reusing existing React root');
                            }
                            rootRef.current.render(component); // Reuse the root for rendering
                        }
                    });
                    //const plugin = await createPluginUI({
                    //    target: viewerRef.current,
                    //    render: (component, container) => {
                    //        ReactDOM.render(component, container); // Use ReactDOM to render the component
                    //    },
                    //});
                    pluginRef.current = plugin;

                    // Load the molecule from the provided URL
                    await plugin.dataTransaction(async () => {
                        try {
                            const data = await plugin.builders.data.download({ url: moleculeUrl }, { state: { isGhost: true } });
                            console.log('Downloaded data:', data);
                            // Parse the downloaded data as a trajectory
                            const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif'); // Use 'mmcif' for CIF files
                            await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
                        } catch (error) {
                            console.error('Error loading molecule data:', error);
                            console.error('Molecule URL:', moleculeUrl);
                        }
                    });
                } catch (error) {
                    console.error('Error loading molecule:', error);
                }
            }
        };

        initializePlugin();

        // Cleanup on unmount
        return () => {
            pluginRef.current?.dispose(); // Dispose of the plugin
            rootRef.current?.unmount(); // Unmount the React root
            rootRef.current = null; // Reset the root reference
        };
    }, [moleculeUrl]);

    return (
        <div
            ref={viewerRef}
            style={{
                width: '100%',
                height: '100%',
                border: '1px solid #ccc',
                margin: '10px',
            }}
        />
    );
};

export default MolstarContainer;
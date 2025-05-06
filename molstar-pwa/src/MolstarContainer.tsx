import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';

interface MolstarContainerProps {
    moleculeUrl: string; // URL of the molecule file (e.g., PDB or CIF)
}

const MolstarContainer: React.FC<MolstarContainerProps> = ({ moleculeUrl }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const pluginRef = useRef<PluginContext | null>(null);

    useEffect(() => {
        const initializePlugin = async () => {
            if (viewerRef.current) {
                // Dispose of any existing plugin instance
                pluginRef.current?.dispose();
    
                // Create the plugin instance asynchronously
                const plugin = await createPluginUI({
                    target: viewerRef.current,
                    render: (component, container) => {
                        if (container) {
                            const root = ReactDOM.createRoot(container); // Use ReactDOM.createRoot
                            root.render(component); // Render the component
                        }
                    },
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
                    const data = await plugin.builders.data.download({ url: moleculeUrl }, { state: { isGhost: true } });
                    const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif'); // Use 'mmcif' for CIF files
                    await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
                });
            }
        };
    
        initializePlugin();
    
        // Cleanup on unmount
        return () => {
            pluginRef.current?.dispose();
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
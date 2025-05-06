import React, { useEffect, useRef } from 'react';
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
                // Create the plugin instance asynchronously
                const plugin = await createPluginUI({
                    target: viewerRef.current, // Pass the target element
                    render: (component, container) => {
                        // Implement rendering logic if needed
                    },
                });
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
                height: '400px', // Ensure the viewer has a fixed height
                border: '1px solid #ccc',
                margin: '10px',
            }}
        />
    );
};

export default MolstarContainer;

/*import React, { useEffect, useRef } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
//import { Plugin } from 'molstar/lib/mol-plugin/main';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';

interface MolstarContainerProps {
    moleculeUrl: string; // URL of the molecule file (e.g., PDB or CIF)
}

const MolstarContainer: React.FC<MolstarContainerProps> = ({ moleculeUrl }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const pluginRef = useRef<Plugin | null>(null);

    useEffect(() => {
        if (viewerRef.current) {
            const plugin = new Plugin(viewerRef.current, DefaultPluginSpec());
            pluginRef.current = plugin;

            // Load the molecule from the provided URL
            plugin.dataTransaction(async () => {
                const data = await plugin.builders.data.download({ url: moleculeUrl }, { state: { isGhost: true } });
                await plugin.builders.structure.parseTrajectory(data, 'pdb'); // Use 'pdb' for PDB files
            });
        }

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
                height: '400px', // Ensure the viewer has a fixed height
                border: '1px solid #ccc',
                margin: '10px',
            }}
        />
    );
};

export default MolstarContainer;

/*import React, { useEffect, useRef } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';

interface MolstarContainerProps {
    moleculeUrl: string; // URL of the molecule file (e.g., PDB or CIF)
}

const MolstarContainer: React.FC<MolstarContainerProps> = ({ moleculeUrl }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const pluginRef = useRef<PluginContext | null>(null);

    useEffect(() => {
        if (viewerRef.current) {
            const plugin = new PluginContext(DefaultPluginSpec());
            pluginRef.current = plugin;
            plugin.init();
    
            // Correct way to load a molecule from a URL
            plugin.dataTransaction(async () => {
                const data = await plugin.builders.data.download({ url: moleculeUrl }, { state: { isGhost: true } });
                await plugin.builders.structure.parseTrajectory(data, 'mmcif'); // Adjust format if needed (e.g., 'pdb', 'cif', etc.)
            });
        }

        return () => {
            pluginRef.current?.dispose();
        };
    }, [moleculeUrl]);

    return <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />;
};

export default MolstarContainer;
*/
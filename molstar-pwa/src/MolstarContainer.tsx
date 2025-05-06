import React, { useEffect, useRef } from 'react';
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
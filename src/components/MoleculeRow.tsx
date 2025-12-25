/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import RepresentationVisibilityToggle from './RepresentationVisibilityToggle';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { allowedRepresentationTypes } from '../types/Representation';

/**
 * Props for the MoleculeRow component.
 * @param label The label for the molecule.
 * @param plugin The Mol* PluginUIContext instance.
 * @param structureRef The structure reference for the molecule.
 * @param isVisible Whether the molecule is currently visible.
 * @param onToggleVisibility Function to toggle the molecule's visibility.
 * @param zoomLabel The label for the zoom button.
 * @param onZoom Function to zoom to the molecule.
 * @param zoomDisabled Whether the zoom button is disabled.
 * @param forceUpdate A function to force the parent component to re-render.
 * @param representationRefs Array of representation refs associated with the molecule. 
 */
interface MoleculeRowProps {
    label: string;
    plugin: PluginUIContext | null;
    //structureRef: string;
    isVisible: boolean;
    onToggleVisibility: () => void;
    zoomLabel: string;
    onZoom: () => void;
    zoomDisabled: boolean;
    isLoaded: boolean;
    forceUpdate: () => void;
    representationRefs?: string[];
}

/**
 * A reusable row for molecule controls and info, including visibility and zoom.
 * @param label The label for the molecule.
 * @param plugin The Mol* PluginUIContext instance.
 * @param structureRef The structure reference for the molecule.
 * @param isVisible Whether the molecule is currently visible.
 * @param onToggleVisibility Function to toggle the molecule's visibility.
 * @param zoomLabel The label for the zoom button.
 * @param onZoom Function to zoom to the molecule.
 * @param zoomDisabled Whether the zoom button is disabled.
 * @param forceUpdate A function to force the parent component to re-render.
 * @param representationRefs Array of representation refs associated with the molecule.
 * @returns The MoleculeRow component.
 */
const MoleculeRow: React.FC<MoleculeRowProps> = ({
    label,
    plugin,
    //structureRef,
    isVisible,
    onToggleVisibility,
    zoomLabel,
    onZoom,
    zoomDisabled,
    isLoaded,
    forceUpdate,
    representationRefs = [],
}) => {
    // Debug: log representationRefs prop on each render
    console.log('[MoleculeRow] representationRefs prop:', label, representationRefs);
    // Helper to get visibility state and type for a representation
    const getRepType = (ref: string): string | null => {
        if (!plugin) return null;
        const cell = plugin.state?.data?.cells?.get(ref);
        const typeName = cell?.params?.values?.type?.name;
        if (typeName && allowedRepresentationTypes.includes(typeName)) {
            return typeName;
        }
        return null;
    };

    const isRepVisible = (ref: string) => {
        if (!plugin) return false;
        const cell = plugin.state?.data?.cells?.get(ref);
        // If isHidden is undefined or false, treat as visible
        return cell?.state?.isHidden !== true;
    };

    // Toggle visibility for a representation
    const handleToggleRepVisibility = async (ref: string, retryCount = 0) => {
        if (!plugin) return;
        const cell = plugin.state?.data?.cells?.get(ref);
        if (!cell) {
            if (retryCount < 3) {
                setTimeout(() => handleToggleRepVisibility(ref, retryCount + 1), 100);
            } else {
                console.warn('Representation cell not found for ref after retries:', ref);
            }
            return;
        }
        await PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
        plugin.canvas3d?.requestDraw?.();
        forceUpdate();
    };

    return (
        <div className="molecule-row">
            <button
                onClick={onToggleVisibility}
                disabled={!plugin || !isLoaded}
            >
                {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                <span style={{ marginLeft: 8 }}>{label}</span>
            </button>
            {/* Per-representation visibility toggles */}
            {representationRefs.length > 0 && (
                <span style={{ marginLeft: 8 }}>
                    {representationRefs.map(ref => {
                        const cell = plugin?.state?.data?.cells?.get(ref);
                        const typeName = getRepType(ref);
                        const isVisible = isRepVisible(ref);
                        console.log('[MoleculeRow] map:', { label, ref, typeName, isVisible, cell });
                        if (!typeName) return null;
                        return (
                            <button
                                key={ref}
                                onClick={() => handleToggleRepVisibility(ref)}
                                style={{ marginLeft: 4 }}
                                disabled={!isLoaded}
                            >
                                {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                <span style={{ marginLeft: 4, fontSize: '0.9em' }}>{typeName}</span>
                            </button>
                        );
                    })}
                </span>
            )}
            <button
                onClick={onZoom}
                disabled={zoomDisabled}
                style={{ marginLeft: 8 }}
            >
                Zoom to: {zoomLabel}
            </button>
        </div>
    );
};

export default MoleculeRow;

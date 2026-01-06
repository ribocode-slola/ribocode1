/**
 * MoleculeRow component for displaying molecule controls and information.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useState } from 'react';
// import '../../src/css/controls.css'; // Now loaded globally via index.css
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { allowedRepresentationTypes } from './buttons/select/Representation';

/**
 * Props for the MoleculeUI component.
 * @param label The label for the molecule.
 * @param plugin The Mol* PluginUIContext instance.
 * @param structureRef The structure reference for the molecule.
 * @param isVisible Whether the molecule is currently visible.
 * @param onToggleVisibility Function to toggle the molecule's visibility.
 * @param chainZoomLabel The label for the chain zoom button.
 * @param onChainZoom Function to zoom to the chain.
 * @param chainZoomDisabled Whether the chain zoom button is disabled.
 * @param residueZoomLabel The label for the residue zoom button.
 * @param onResidueZoom Function to zoom to the residue.
 * @param residueZoomDisabled Whether the residue zoom button is disabled.
 * @param isLoaded Whether the molecule data is loaded.
 * @param forceUpdate A function to force the parent component to re-render.
 * @param representationRefs Array of representation refs associated with the molecule.
 * @param onDeleteRepresentation Optional callback to delete a representation.
 * @param onToggleRepVisibility Optional callback to toggle representation visibility.
 * @return The MoleculeUI component.
 */
interface MoleculeUIProps {
    label: string;
    plugin: PluginUIContext | null;
    isVisible: boolean;
    onToggleVisibility: () => void;
    chainZoomLabel: string;
    onChainZoom: () => void;
    chainZoomDisabled: boolean;
    residueZoomLabel: string;
    onResidueZoom: () => void;
    residueZoomDisabled: boolean;
    isLoaded: boolean;
    forceUpdate: () => void;
    representationRefs?: string[];
    onDeleteRepresentation?: (ref: string) => void;
    onToggleRepVisibility?: (ref: string) => void;
    extraControls?: React.ReactNode;
    onRemove?: () => void;
}

/**
 * Molecule controls and info, including visibility and zoom.
 * @param label The label for the molecule.
 * @param plugin The Mol* PluginUIContext instance.
 * @param isVisible Whether the molecule is currently visible.
 * @param onToggleVisibility Function to toggle the molecule's visibility.
 * @param chainZoomLabel The label for the chain zoom button.
 * @param onChainZoom Function to zoom to the chain.
 * @param chainZoomDisabled Whether the chain zoom button is disabled.
 * @param residueZoomLabel The label for the residue zoom button.
 * @param onResidueZoom Function to zoom to the residue.
 * @param residueZoomDisabled Whether the residue zoom button is disabled.
 * @param isLoaded Whether the molecule data is loaded.
 * @param forceUpdate A function to force the parent component to re-render.
 * @param representationRefs Array of representation refs associated with the molecule.
 * @param onDeleteRepresentation Optional callback to delete a representation.
 * @param onToggleRepVisibility Optional callback to toggle representation visibility.
 * @returns The MoleculeRow component.
 */
const MoleculeUI: React.FC<MoleculeUIProps> = ({
    label,
    plugin,
    isVisible,
    onToggleVisibility,
    chainZoomLabel,
    onChainZoom,
    chainZoomDisabled,
    residueZoomLabel,
    onResidueZoom,
    residueZoomDisabled,
    isLoaded,
    forceUpdate,
    representationRefs = [],
    onDeleteRepresentation,
    onToggleRepVisibility,
    onRemove,
}) => {
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
    // Check if a representation is visible.
    const isRepVisible = (ref: string) => {
        if (!plugin) return false;
        const cell = plugin.state?.data?.cells?.get(ref);
        // If isHidden is undefined or false, treat as visible
        return cell?.state?.isHidden !== true;
    };
    // Toggle visibility for a representation.
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
    // Per-representation menu state
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    // Render the component.
    return (
        <div className="molecule-row">
            <button
                onClick={onToggleVisibility}
                disabled={!plugin || !isLoaded}
                className="msp-btn msp-form-control"
                aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
            >
                {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                <span className="molstar-label">{label}</span>
            </button>
            {/* Per-representation controls */}
            {representationRefs.length > 0 && (
                <span className="rep-controls">
                    {representationRefs.map(ref => {
                        const cell = plugin?.state?.data?.cells?.get(ref);
                        const typeName = getRepType(ref);
                        const isVisible = isRepVisible(ref);
                        if (!typeName) return null;
                        // Use _ribocodeId if available, else fallback to ref
                        const repId = cell?.params?.values?._ribocodeId || ref;
                        return (
                            <span key={ref} className="rep-btn-group">
                                <button
                                    onClick={() => onToggleRepVisibility ? onToggleRepVisibility(repId) : handleToggleRepVisibility(ref)}
                                    className="msp-btn msp-form-control"
                                    disabled={!isLoaded}
                                    aria-label={`Toggle visibility for ${typeName} representation`}
                                >
                                    {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                    <span className="molstar-label">{typeName}</span>
                                </button>
                                {/* Delete button */}
                                <button
                                    onClick={() => onDeleteRepresentation && onDeleteRepresentation(repId)}
                                    className="msp-btn msp-btn-danger msp-form-control"
                                    disabled={!isLoaded}
                                    aria-label={`Delete ${typeName} representation`}
                                >
                                    &#x2716;
                                </button>
                            </span>
                        );
                    })}
                </span>
            )}
            {/* Chain Zoom Button */}
            <button
                onClick={onChainZoom}
                disabled={chainZoomDisabled}
                className="msp-btn msp-form-control"
            >
                Zoom to Chain: {chainZoomLabel}
            </button>
            {/* Residue Zoom Button */}
            <button
                onClick={onResidueZoom}
                disabled={residueZoomDisabled}
                className="msp-btn msp-form-control"
            >
                Zoom to Residue: {residueZoomLabel}
            </button>
            {/* Remove button for realigned molecules */}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="msp-btn msp-btn-danger msp-form-control"
                    aria-label={`Remove ${label}`}
                    style={{ fontSize: '1.5em', lineHeight: 1 }}
                >
                    &#x2716;
                </button>
            )}
        </div>
    );
};

export default MoleculeUI;
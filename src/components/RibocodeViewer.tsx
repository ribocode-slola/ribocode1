/**
 * RibocodeViewer component for displaying and managing molecular viewers.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useState, useEffect, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import '../css/MolstarContainer.css';
import { Molecule } from 'molstar/lib/extensions/ribocode/structure';
import { ModelRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';

// Type representing viewer keys.
export type ViewerKey = "A" | "B";

/**
 * State type for RibocodeViewer component.
 * @param moleculeAlignedTo The molecule to which another molecule is aligned.
 * @param setMoleculeAlignedTo Function to set the molecule to which another molecule is aligned.
 * @param moleculeAligned The molecule that is aligned to another molecule.
 * @param setMoleculeAligned Function to set the molecule that is aligned to another molecule.
 * @param isMoleculeAlignedToLoaded Whether the molecule to which another molecule is aligned is loaded.
 * @param setIsMoleculeAlignedToLoaded Function to set the loaded state of the molecule to which another molecule is aligned.
 * @param isMoleculeAlignedLoaded Whether the aligned molecule is loaded.
 * @param setIsMoleculeAlignedLoaded Function to set the loaded state of the aligned molecule.
 * @param isMoleculeAlignedToVisible Whether the molecule to which another molecule is aligned is visible.
 * @param setIsMoleculeAlignedToVisible Function to set the visibility of the molecule to which another molecule is aligned.
 * @param isMoleculeAlignedVisible Whether the aligned molecule is visible.
 * @param setIsMoleculeAlignedVisible Function to set the visibility of the aligned molecule.
 * @param ref Ref object for the Mol* PluginUIContext instance.
 * @param fileInputRef Ref object for the file input element.
 * @param handleFileInputButtonClick Function to handle file input button clicks.
 * @param setViewerRef Function to set the viewer reference.
 * @param viewerKey The key identifying the viewer ('A' or 'B').
 */
export type ViewerState = {
    moleculeAlignedTo: Molecule | undefined;
    setMoleculeAlignedTo: React.Dispatch<React.SetStateAction<Molecule | undefined>>;
    moleculeAligned: Molecule | undefined;
    setMoleculeAligned: React.Dispatch<React.SetStateAction<Molecule | undefined>>;
    isMoleculeAlignedToLoaded: boolean;
    setIsMoleculeAlignedToLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    isMoleculeAlignedLoaded: boolean;
    setIsMoleculeAlignedLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    isMoleculeAlignedToVisible: boolean;
    setIsMoleculeAlignedToVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isMoleculeAlignedVisible: boolean;
    setIsMoleculeAlignedVisible: React.Dispatch<React.SetStateAction<boolean>>;    
    ref: React.RefObject<PluginUIContext | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileInputButtonClick: () => void;
    setViewerRef: (viewer: PluginUIContext) => void;
    viewerKey: ViewerKey;
};

/**
 * Props for RibocodeViewer component.
 * @param plugin The Mol* PluginUIContext instance.
 * @param viewerKey The key identifying the viewer ('A' or 'B').
 * @param onReady Optional callback function invoked when the viewer is ready.
 */
interface RibocodeViewerProps {
    plugin: PluginUIContext | null;
    viewerKey: ViewerKey;
    onReady?: (viewer: PluginUIContext | null) => void;
}

/**
 * RibocodeViewer component encapsulates a Mol* viewer instance.
 * @param plugin The Mol* PluginUIContext instance.
 * @param viewerKey The key identifying the viewer ('A' or 'B').
 * @param onReady Optional callback function invoked when the viewer is ready.
 * @returns The RibocodeViewer component.
 */
 const RibocodeViewer: React.FC<RibocodeViewerProps> = ({
    plugin, viewerKey, onReady }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
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
        console.log(`[RibocodeViewer ${viewerKey}] Viewer initialization effect. viewer:`, viewerRef.current);
        if (viewerRef.current && !(viewerRef.current as any).disposed) {
            setViewerReady(true);
            console.log(`[RibocodeViewer ${viewerKey}] Viewer ready.`);
        }
    }, [viewerReady]);
    // Render the component.
    return (
        <div className="ribocode-viewer">
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

/**
 * Toggles the visibility of all models in the viewer.
 * @param viewer The viewer state.
 */
export async function toggleViewerVisibility(viewer: ViewerState) {
    const vrc = viewer.ref.current;
    if (!vrc) return;
    const models = vrc.managers.structure.hierarchy.current?.models ?? [];
    for (const model of models) {
        toggleVisibility(viewer, model);
    }
}

/**
 * Toggles the visibility of a specific model in the viewer.
 * @param viewer The viewer state.
 * @param model The model reference to toggle visibility for.
 */
export async function toggleVisibility(viewer: ViewerState, model: ModelRef ) {
    const vrc = viewer.ref.current;
    if (!vrc) return;
    const state = vrc.state.data;
    const ref = model.cell.transform.ref;
    await PluginCommands.State.ToggleVisibility.apply(
        vrc,
        [vrc, { state, ref }]
    );
}

export default RibocodeViewer;
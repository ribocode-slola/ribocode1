import React, { useState, useEffect, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import './MolstarContainer.css';
import { Molecule, PresetResult } from 'molstar/lib/extensions/ribocode/structure';
import { ModelRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';

export type ViewerKey = "A" | "B";

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

interface RibocodeViewerProps {
    plugin: PluginUIContext | null;
    viewerKey: ViewerKey;
    onReady?: (viewer: PluginUIContext | null) => void;
}

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

    return (
        <div className="ribocode-viewer">
            <div ref={containerRef} className="molstar-container"></div>
        </div>
    );
};

//export async function toggleViewerVisibility(viewerRef: React.RefObject<PluginUIContext | null>) {
export async function toggleViewerVisibility(viewer: ViewerState) {
    const vrc = viewer.ref.current;
    if (!vrc) return;
    const models = vrc.managers.structure.hierarchy.current?.models ?? [];
    for (const model of models) {
        toggleVisibility(viewer, model);
    }
}

//export async function toggleVisibility(viewerRef: React.RefObject<PluginUIContext | null>, model: ModelRef ) {
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
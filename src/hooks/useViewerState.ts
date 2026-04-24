/**
 * Custom hook to manage viewer state for RibocodeViewer components.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useState, useRef, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { ViewerState } from '../components/RibocodeViewer';
import type { ViewerKey } from '../types/ribocode';
import { Molecule } from 'molstar/lib/extensions/ribocode/structure';

/**
 * Custom hook to manage viewer state.
 * @param viewerKey The key identifying the viewer ('A' or 'B').
 * @returns The viewer state object.
 */
export function useViewerState(viewerKey: ViewerKey): ViewerState {
    const [moleculeAlignedTo, setMoleculeAlignedTo] = useState<Molecule>();
    const [moleculeAligned, setMoleculeAligned] = useState<Molecule>();
    const [isMoleculeAlignedToLoaded, setIsMoleculeAlignedToLoaded] = useState(false);
    const [isMoleculeAlignedLoaded, setIsMoleculeAlignedLoaded] = useState(false);
    const [isMoleculeAlignedToVisible, setIsMoleculeAlignedToVisible] = useState(false);
    const [isMoleculeAlignedVisible, setIsMoleculeAlignedVisible] = useState(false);
    const ref = useRef<PluginUIContext | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const handleFileInputButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    const setViewerRef = useCallback((viewer: PluginUIContext) => {
        ref.current = viewer;
    }, []);
    return {
        moleculeAlignedTo,
        setMoleculeAlignedTo,
        moleculeAligned,
        setMoleculeAligned,
        isMoleculeAlignedToLoaded,
        setIsMoleculeAlignedToLoaded,
        isMoleculeAlignedLoaded,
        setIsMoleculeAlignedLoaded,
        isMoleculeAlignedToVisible,
        setIsMoleculeAlignedToVisible,
        isMoleculeAlignedVisible,
        setIsMoleculeAlignedVisible,
        ref,
        fileInputRef,
        handleFileInputButtonClick,
        setViewerRef,
        viewerKey
    };
}

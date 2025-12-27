/**
 * Custom React hook for managing Mol* viewer state and representations.
 * Encapsulates all logic for structure and representation tracking, robustly updating
 * UI state in sync with Mol*'s internal state. Designed for use in dual-viewer
 * ribosome alignment/visualization apps.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { s_AlignedTo, s_Aligned} from '../App';
import { AllowedRepresentationType } from '../types/Representation';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { StructureComponentRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import { getChainIdsFromStructure } from '../utils/Chain';

/**
 * State and helper functions for managing a Mol* viewer instance.
 * @param pluginRef Reference to the Mol* PluginUIContext instance.
 * @param structureRefs Mapping of structure keys to their references.
 * @param setStructureRef Function to set a structure reference by key.
 * @param representationRefs Mapping of structure keys to arrays of representation references.
 * @param setRepresentationRefs Function to set representation references by structure key.
 * @param lastAddedRepresentationRef Mapping of structure keys to the last added representation reference.
 * @param setLastAddedRepresentationRef Function to set the last added representation reference by structure key.
 * @return An object containing the Mol* viewer state and helper functions.
 */
export interface MolstarViewerState {
    pluginRef: React.RefObject<PluginUIContext | null>;
    structureRefs: Record<string, string | null>;
    setStructureRef: (key: string, ref: string | null) => void;
    representationRefs: Record<string, string[]>;
    setRepresentationRefs: (key: string, refs: string[]) => void;
    lastAddedRepresentationRef: Record<string, string | null>;
    setLastAddedRepresentationRef: (key: string, ref: string | null) => void;
    refreshRepresentationRefs: (key: string, structureRef: string) => void;
    addRepresentation: (
        key: string,
        structureRef: string,
        type: AllowedRepresentationType,
        colorTheme: { name: string; params?: Record<string, unknown> }
    ) => Promise<void>;
    getChainIds: (structureRef: string) => string[];
}

/**
 * Custom hook to manage Mol* viewer state and helper functions.
 * @returns An object containing the Mol* viewer state and helper functions.
 */
export function useMolstarViewer(pluginRef: React.RefObject<PluginUIContext | null>): MolstarViewerState {

    // --- HOOKS: All hooks must be at the top level ---

    // Maps structure keys to their current structure reference (Mol* state ref).
    const [structureRefs, setStructureRefs] = useState<Record<string, string | null>>({});
    const setStructureRef = useCallback((key: string, ref: string | null) => {
        setStructureRefs(prev => ({ ...prev, [key]: ref }));
    }, []);

    // Keys representing the two main structure slots in the app (alignedTo and aligned).
    // Extend this array if more tracked structures are needed.
    const INITIAL_KEYS = [s_AlignedTo, s_Aligned] as const;

    // Maps structure keys to all representation refs for that structure.
    const [representationRefs, setRepresentationRefsState] = useState<Record<string, string[]>>(
        INITIAL_KEYS.reduce<Record<string, string[]>>((acc, k) => {
            acc[k] = [];
            return acc;
        }, {})
    );
    const setRepresentationRefs = useCallback((key: string, refs: string[]): void => {
        setRepresentationRefsState(prev => ({ ...prev, [key]: refs }));
    }, []);

    // Tracks the last-added representation ref for each structure key.
    const [lastAddedRepresentationRef, setLastAddedRepresentationRefState] = useState<Record<string, string | null>>(
        INITIAL_KEYS.reduce<Record<string, string | null>>((acc, k) => {
            acc[k] = null;
            return acc;
        }, {})
    );
    const setLastAddedRepresentationRef = useCallback((key: string, ref: string | null): void => {
        setLastAddedRepresentationRefState(prev => ({ ...prev, [key]: ref }));
    }, []);

    /**
     * Debounce utility (not a hook).
     * Returns a debounced version of the given function.
     */
    function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    // Debounced refresh for s_AlignedTo to avoid excessive state updates
    const debouncedRefreshAlignedTo = useRef<((key: string, structureRef: string) => void) | null>(null);

    // --- END HOOKS ---
    
    /**
     * Color theme definition for representations.
     */
    interface ColorTheme {
        name: string;
        params?: Record<string, unknown>;
    }

    /**
     * Adds a new representation to the specified structure/component in Mol*,
     * then updates the local state to reflect all current representations.
     * Uses a short delay after .commit() to ensure Mol* state is updated before reading.
     * @param key The structure key.
     * @param structureRef The structure reference.
     * @param type The representation type.
     * @param colorTheme The color theme for the representation.
     */
    const addRepresentation = useCallback(
        async (
            key: string,
            structureRef: string,
            type: AllowedRepresentationType,
            colorTheme: ColorTheme
        ): Promise<void> => {
            if (!pluginRef.current) return;
            const plugin = pluginRef.current;
            const psd = plugin.state.data;
            // Find the structure and first polymer component
            const structs = plugin.managers.structure.hierarchy.current.structures;
            const struct = structs.find((s: { cell: { transform: { ref: string } } }) => s.cell.transform.ref === structureRef);
            if (!struct) return;
            let polymerComponentRef: string | null = null;
            let foundPolymerComp;
            if (Array.isArray(struct.components) && struct.components.length > 0) {
                foundPolymerComp = struct.components.find((comp: StructureComponentRef) => typeof comp.key === 'string' && comp.key.includes('polymer'));
                if (foundPolymerComp) polymerComponentRef = foundPolymerComp.cell.transform.ref;
            }
            if (!polymerComponentRef) return;
            await psd.build()
                .to(polymerComponentRef)
                .apply(
                    StateTransforms.Representation.StructureRepresentation3D,
                    {
                        type: { name: type, params: {} },
                        colorTheme: { name: colorTheme.name, params: colorTheme.params ?? {} }
                    }
                )
                .commit();
            // Delay before refreshing representationRefs to allow Mol* state to update
            setTimeout(() => {
                if (!pluginRef.current) return;
                const plugin = pluginRef.current;
                const pluginStructs = plugin.managers.structure.hierarchy.current.structures;
                const struct = pluginStructs.find((s: { cell: { transform: { ref: string } } }) => s.cell.transform.ref === structureRef);
                let allRefs: string[] = [];
                if (struct && Array.isArray(struct.components) && struct.components.length > 0) {
                    for (const comp of struct.components) {
                        for (const rep of comp.representations) {
                            if (rep.cell?.transform?.ref) allRefs.push(rep.cell.transform.ref);
                        }
                    }
                }
                // Only update if different
                const currentRefs = representationRefs[key] || [];
                const isDifferent = allRefs.length !== currentRefs.length || allRefs.some((r, i) => r !== currentRefs[i]);
                if (isDifferent) {
                    setRepresentationRefs(key, allRefs);
                    // Set lastAddedRepresentationRef to the last rep
                    setLastAddedRepresentationRef(key, allRefs.length > 0 ? allRefs[allRefs.length - 1] : null);
                }
            }, 500);
        },
        [pluginRef, representationRefs, setRepresentationRefs]
    );
    
    // --- waitForPluginReady removed (unused) ---

    /**
     * Traverses the Mol* state tree for a given structureRef, collecting all
     * representation refs. Updates local state only if the set of refs has changed.
     * Used to keep UI toggles in sync with Mol*'s actual state.
     */
    const _refreshRepresentationRefs = (key: string, structureRef: string): void => {
        if (!pluginRef.current || !pluginRef.current.managers) return;
        const plugin = pluginRef.current;
        const state = plugin.state.data;
        const structureCell = state.cells.get(structureRef);
        if (!structureCell) {
            setRepresentationRefs(key, []);
            return;
        }
        const reps: string[] = [];
        const rootChildren = state.tree.children.get(structureRef)?.toArray?.() || [];
        function traverse(ref: string, depth = 0): void {
            const children = state.tree.children.get(ref)?.toArray?.() || [];
            for (const childRef of children) {
                const childCell = state.cells.get(childRef);
                if (
                    childCell?.obj?.type?.name === 'Representation3D' ||
                    childCell?.obj?.type?.name === 'Structure 3D'
                ) {
                    reps.push(childCell.transform.ref);
                }
                traverse(childRef, depth + 1);
            }
        }
        traverse(structureRef);
        // Defensive: Only update if reps is non-empty or there are no root children
        if (reps.length > 0 || rootChildren.length === 0) {
            setRepresentationRefs(key, reps);
        } else {
            // If reps is empty but structureCell has children, skip update (likely race)
            console.warn('[refreshRepresentationRefs] Skipped update for', key, 'due to empty reps but non-empty children:', rootChildren);
            return;
        }
    };

    // Set up the debounced function once, safely
    useEffect(() => {
        debouncedRefreshAlignedTo.current = debounce(_refreshRepresentationRefs, 100);
    }, []);

    /**
     * Main refresh function (hook-safe). Uses debounced refresh for s_AlignedTo,
     * direct refresh for other keys.
     */
    const refreshRepresentationRefs = useCallback((key: string, structureRef: string): void => {
        if (key === s_AlignedTo) {
            debouncedRefreshAlignedTo.current?.(key, structureRef);
        } else {
            _refreshRepresentationRefs(key, structureRef);
        }
    }, []);

    /**
     * Whenever a structureRef changes, refresh the list of representation refs.
     * Ensures UI toggles appear/disappear in sync with Mol*'s state.
     * Only runs when structureRefs or pluginRef changes.
     */
    useEffect(() => {
        Object.entries(structureRefs).forEach(([key, ref]) => {
            if (ref) {
                refreshRepresentationRefs(key, ref);
            }
        });
        // Only run when structureRefs or pluginRef changes
    }, [structureRefs, pluginRef, refreshRepresentationRefs]);

    /**
     * Extracts chain IDs from a structure ref.
     * @param structureRef The structure reference string.
     * @returns Array of chain IDs, or empty array if not found.
     */
    function getChainIds(structureRef: string): string[] {
        if (!pluginRef.current) return [];
        const plugin = pluginRef.current;
        const structureObj = plugin.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
        if (!structureObj) return [];
        return getChainIdsFromStructure(structureObj);
    }

    // Add more state and logic as needed (e.g., color theme registration)

    // Expose all state and helper functions needed by consuming components.
    return {
        pluginRef,
        structureRefs,
        setStructureRef,
        representationRefs,
        setRepresentationRefs,
        lastAddedRepresentationRef,
        setLastAddedRepresentationRef,
        refreshRepresentationRefs,
        addRepresentation,
        getChainIds
    };
}

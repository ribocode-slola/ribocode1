/**
 * Ribocode App component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SelectionProvider } from './context/SelectionContext';
import { ViewerStateProvider } from './context/ViewerStateContext';
import { SyncProvider } from './context/SyncContext';
import { useFogControl } from './hooks/useFogControl';
import { useHandleFileChange, handleToggle } from './handlers/uiHandlers';
import { useSessionSave } from './hooks/useSessionSave';
import { useSessionLoadModal } from './hooks/useSessionLoadModal';
import { useUpdateChainInfo } from './hooks/useUpdateChainInfo';
import { useUpdateResidueInfo } from './hooks/useUpdateResidueInfo';
import { useUpdateColors } from './hooks/useUpdateColors';
import ViewerColumn from './components/ViewerColumn';
import TwoColumnsContainer from './components/TwoColumnsContainer';
import AppHeader from './components/AppHeader';
import { AlignedTo, Aligned, ReAligned } from './types/molecule';
import { parseColorFileContent, registerThemeIfNeeded } from './utils/colors';
import { useFileInput } from './hooks/useFileInput';
import { useCameraControl } from './hooks/useCameraControl';
import { useChainState } from './hooks/useChainState';
import { getAtomDataFromStructureUnits } from './utils/data';
import { parseDictionaryFileContent } from './utils/dictionary';
import { useResidueState } from './hooks/useResidueState';
import { useSubunitState } from './hooks/useSubunitState';
import RepresentationSelectButton, { allowedRepresentationTypes, AllowedRepresentationType } from './components/buttons/select/Representation';
import GeneralControls from './components/GeneralControls';
import { ViewerKey, ViewerState } from './components/RibocodeViewer';
import { useMolstarViewer } from './hooks/useMolstarViewer';
import { useViewerState } from './hooks/useViewerState';
import { useMoleculeLoader } from './hooks/useMoleculeLoader';
import { alignDatasetUsingChains } from 'molstar/lib/extensions/ribocode/utils/geometry';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { focusLociOnChain } from './utils/structureUtils';
import { focusLociOnResidue } from './utils/structureUtils';
import { AlignmentData } from 'molstar/lib/extensions/ribocode/types';

// Viewer keys.
export const A: ViewerKey = 'A';
export const B: ViewerKey = 'B';

/**
 * Alignment target atom types.
 */
//const selectedAtomTypes: { [key: string]: boolean } = { 'P': true };
const selectedAtomTypes: { [key: string]: boolean } = { 'P': true, 'C': true };

/**
 * The main App component.
 * @returns The main App component.
 */
const App: React.FC = () => {

    // Store File for aligned molecule reloads.
    const [alignedFile, setAlignedFile] = useState<any | null>(null);

    // Create plugin refs and pass to useMolstarViewers
    const pluginRefA: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const pluginRefB: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const molstarA: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefA);
    const molstarB: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefB);

    // Initialize viewer states.
    const viewerA: ViewerState = useViewerState(A);
    const viewerB: ViewerState = useViewerState(B);
    const setViewerAWrapper = useCallback((viewer: PluginUIContext) => {
        viewerA.ref.current = viewer;
    }, [viewerA]);
    const setViewerBWrapper = useCallback((viewer: PluginUIContext) => {
        viewerB.ref.current = viewer;
    }, [viewerB]);
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);

    // Viewer state management
    // -----------------------
    const [activeViewer, setActiveViewer] = useState<ViewerKey>(A);
    // useViewerState is now imported from hooks/useViewerState

    // useFileInput is now imported from hooks/useFileInput

    // File inputs for dictionary and colors.
    const dictionaryFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const alignmentFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const [isMoleculeAlignedToColoursLoaded, setIsMoleculeAlignedToColoursLoaded] = useState(false);
    const [isMoleculeAlignedColoursLoaded, setIsMoleculeAlignedColoursLoaded] = useState(false);
    const colorsAlignedToFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsAlignedFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    // Chain color map state.
    const [chainColorMaps] = useState<Map<string, Map<string, Color>>>(new Map());
    // Realigned molecule structure/representation refs
    const [realignedStructRefsA, setRealignedStructRefsA] = useState<{ [id: string]: string }>({});
    const [realignedStructRefsB, setRealignedStructRefsB] = useState<{ [id: string]: string }>({});
    const [realignedRepRefsA, setRealignedRepRefsA] = useState<{ [id: string]: string[] }>({});
    const [realignedRepRefsB, setRealignedRepRefsB] = useState<{ [id: string]: string[] }>({});
    // Subunit state (custom hook)
    const {
        subunitToChainIds: subunitToChainIdsAlignedTo,
        setSubunitToChainIds: setSubunitToChainIdsAlignedTo,
        selectedSubunit: selectedSubunitAlignedTo,
        setSelectedSubunit: setSelectedSubunitAlignedTo,
    } = useSubunitState();
    const {
        subunitToChainIds: subunitToChainIdsAligned,
        setSubunitToChainIds: setSubunitToChainIdsAligned,
        selectedSubunit: selectedSubunitAligned,
        setSelectedSubunit: setSelectedSubunitAligned,
    } = useSubunitState();
    // Chain state (custom hook)
    const {
        chainInfo: chainInfoAlignedTo,
        setChainInfo: setChainInfoAlignedTo,
        selectedChainId: selectedChainIdAlignedTo,
        setSelectedChainId: setSelectedChainIdAlignedTo,
    } = useChainState();
    const {
        chainInfo: chainInfoAligned,
        setChainInfo: setChainInfoAligned,
        selectedChainId: selectedChainIdAligned,
        setSelectedChainId: setSelectedChainIdAligned,
    } = useChainState();
    // Residue state (custom hook)
    const {
        residueInfo: residueInfoAlignedTo,
        setResidueInfo: setResidueInfoAlignedTo,
        selectedResidueId: selectedResidueIdAlignedTo,
        setSelectedResidueId: setSelectedResidueIdAlignedTo,
    } = useResidueState();
    const {
        residueInfo: residueInfoAligned,
        setResidueInfo: setResidueInfoAligned,
        selectedResidueId: selectedResidueIdAligned,
        setSelectedResidueId: setSelectedResidueIdAligned,
    } = useResidueState();


    // Track realigned molecules with from/to chain IDs to prevent duplicates
    const [realignedMoleculesA, setRealignedMoleculesA] = useState<Array<{ id: string, file: File, label: string, from: string, to: string }>>([]);
    const [realignedMoleculesB, setRealignedMoleculesB] = useState<Array<{ id: string, file: File, label: string, from: string, to: string }>>([]);

    // Molecule loading logic extracted to useMoleculeLoader
    const { loadMoleculeIntoViewers } = useMoleculeLoader({
        viewerA,
        viewerB,
        molstarA,
        molstarB,
        setAlignedFile,
        selectedChainIdAlignedTo,
        selectedChainIdAligned,
        setRealignedMoleculesA,
        setRealignedMoleculesB,
        setRealignedStructRefsA,
        setRealignedStructRefsB,
        setRealignedRepRefsA,
        setRealignedRepRefsB,
    });

    // Use centralized handler for file changes
    const handleFileChange = useHandleFileChange(viewerA.ref, viewerB.ref);

    // Fog control state and updater (custom hook)
    const {
        fogAEnabled, setFogAEnabled,
        fogANear, setFogANear,
        fogAFar, setFogAFar,
        fogBEnabled, setFogBEnabled,
        fogBNear, setFogBNear,
        fogBFar, setFogBFar,
        updateFog,
    } = useFogControl();
    // Camera and zoom state (custom hook)
    const {
        zoomExtraRadius, setZoomExtraRadius,
        zoomMinRadius, setZoomMinRadius,
        cameraANear, setCameraANear,
        cameraAFar, setCameraAFar,
        cameraBNear, setCameraBNear,
        cameraBFar, setCameraBFar,
    } = useCameraControl();

    /**
     * Handle toggling visibility of a molecule.
     * @param viewer The viewer state.
     * @param moleculeKey The key of the molecule to toggle.
     * @param setVisible The setter function for visibility state.
     * @param isVisible The current visibility state.
     */
    // handleToggle is now imported from handlers/uiHandlers

    // Toggle visibility for moleculeAlignedTo in viewer A.
    const toggleViewerAAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'molecule' + AlignedTo,
                viewerA.setIsMoleculeAlignedToVisible,
                viewerA.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer A.
    const toggleViewerAAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'molecule' + Aligned,
                viewerA.setIsMoleculeAlignedVisible,
                viewerA.isMoleculeAlignedVisible
            ),
    };

    // Toggle visibility for moleculeAlignedTo in viewer B.
    const toggleViewerBAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'molecule' + AlignedTo,
                viewerB.setIsMoleculeAlignedToVisible,
                viewerB.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer B.
    const toggleViewerBAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'molecule' + Aligned,
                viewerB.setIsMoleculeAlignedVisible,
                viewerB.isMoleculeAlignedVisible
            ),
    };

    // Dummy state to force re-render after toggling representation visibility
    const [, setForceUpdate] = useState(0);
    const forceUpdate = () => setForceUpdate(f => f + 1);
    // Get structure refs for both viewers.
    const structureRefAAlignedTo: string | null = molstarA.structureRefs[AlignedTo];
    const structureRefAAligned: string | null = molstarA.structureRefs[Aligned];
    const structureRefBAlignedTo: string | null = molstarB.structureRefs[AlignedTo];
    const structureRefBAligned: string | null = molstarB.structureRefs[Aligned];
    // Theme names for custom chain color themes.
    const themeNameAlignedTo = AlignedTo + '-custom-chain-colors';
    const themeNameAligned = Aligned + '-custom-chain-colors';


    // Representation type state.
    const [representationTypeAlignedTo, setRepresentationTypeAlignedTo] = useState<AllowedRepresentationType>('spacefill');
    const [representationTypeAligned, setRepresentationTypeAligned] = useState<AllowedRepresentationType>('spacefill');

    /**
     * Reusable effect for updating colors and registering themes.
     * @param colorFileData The color file data to process.
     * @param setIsColorsLoaded Function to set the colors loaded state.
     * @param themeName The name of the theme to register.
     * @param deps Additional dependencies for the effect.
     */



    // Use the custom hook for both color sets (AlignedTo)
    useUpdateColors(
        viewerA.ref.current,
        colorsAlignedToFile.data,
        setIsMoleculeAlignedToColoursLoaded,
        themeNameAlignedTo,
        chainColorMaps,
        [viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo, representationTypeAlignedTo, structureRefAAlignedTo, structureRefBAlignedTo]
    );

    // Use the custom hook for both color sets (Aligned)
    useUpdateColors(
        viewerA.ref.current,
        colorsAlignedFile.data,
        setIsMoleculeAlignedColoursLoaded,
        themeNameAligned,
        chainColorMaps,
        [viewerA.moleculeAligned, viewerB.moleculeAligned, representationTypeAligned, structureRefAAligned, structureRefBAligned]
    );

    /**
 * Generalized effect for updating chain info and subunit-to-chain mapping.
 * @param pluginRef The plugin ref (viewerA.ref or viewerB.ref).
 * @param structureRef The structure ref to get chain IDs from.
 * @param molstar The molstar viewer hook instance.
 * @param setChainInfo Function to set the chain IDs state.
 * @param setSubunitToChainIds Function to set the subunit-to-chain mapping.
 * @param label Label for logging purposes.
 */


    // Custom hooks for updating chain info and subunit-to-chain mapping for both viewers.
    useUpdateChainInfo(viewerA.ref, structureRefAAlignedTo, molstarA, setChainInfoAlignedTo, setSubunitToChainIdsAlignedTo, AlignedTo);
    useUpdateChainInfo(viewerB.ref, structureRefBAligned, molstarB, setChainInfoAligned, setSubunitToChainIdsAligned, Aligned);

    // Generalized effect for residue ID selection and info update.
    useUpdateResidueInfo(viewerA.ref, structureRefAAlignedTo, molstarA, selectedChainIdAlignedTo, setResidueInfoAlignedTo, selectedResidueIdAlignedTo, setSelectedResidueIdAlignedTo, AlignedTo);
    useUpdateResidueInfo(viewerB.ref, structureRefBAligned, molstarB, selectedChainIdAligned, setResidueInfoAligned, selectedResidueIdAligned, setSelectedResidueIdAligned, Aligned);

    // --- Shared chain/residue loci and focus utilities ---

    /**
     * Focus the camera on a residue loci, with optional sync to another plugin.
     */

    /**
     * Creates a handler to zoom to a selection based on a structure property.
     * Uses shared chain/residue loci/focus utilities.
     */
    function createZoomHandler(
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        property: 'entity-test' | 'chain-test' | 'residue-test' | 'atom-test' | 'group-by',
        chainId: string,
        sync: boolean = false,
        syncPluginRef?: React.RefObject<PluginUIContext | null>,
        residueId?: string,
        insCode?: string
    ) {
        return {
            handleButtonClick: async () => {
                const plugin = pluginRef.current;
                if (!plugin || !structureRef) return;
                if (property === 'chain-test') {
                    focusLociOnChain(
                        plugin,
                        structureRef,
                        chainId,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
                    );
                } else if (property === 'residue-test') {
                    focusLociOnResidue(
                        plugin,
                        structureRef,
                        chainId,
                        residueId ?? '',
                        insCode,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined,
                        zoomExtraRadius,
                        zoomMinRadius
                    );
                } else {
                    // fallback: use chain loci for other property types for now
                    focusLociOnChain(
                        plugin,
                        structureRef,
                        chainId,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
                    );
                }
            }
        };
    }

    // Helper to create zoom handlers for chain or residue
    function makeZoomHandler({
        pluginRef,
        structureRef,
        property,
        chainId,
        sync,
        syncPluginRef,
        residueId,
        insCode
    }: {
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        property: 'entity-test' | 'chain-test' | 'residue-test' | 'atom-test' | 'group-by',
        chainId: string,
        sync: boolean,
        syncPluginRef?: React.RefObject<PluginUIContext | null>,
        residueId?: string,
        insCode?: string
    }) {
        return createZoomHandler(
            pluginRef,
            structureRef,
            property,
            chainId,
            sync,
            syncPluginRef,
            residueId,
            insCode
        );
    }

    // Chain zoom handlers
    const chainZoomAAlignedTo = makeZoomHandler({
        pluginRef: viewerA.ref,
        structureRef: structureRefAAlignedTo,
        property: 'chain-test',
        chainId: selectedChainIdAlignedTo,
        sync: syncEnabled,
        syncPluginRef: viewerB.ref
    });
    const chainZoomAAligned = makeZoomHandler({
        pluginRef: viewerA.ref,
        structureRef: structureRefAAligned,
        property: 'chain-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerB.ref
    });
    const chainZoomBAlignedTo = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAlignedTo,
        property: 'chain-test',
        chainId: selectedChainIdAlignedTo,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref
    });
    const chainZoomBAligned = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAligned,
        property: 'chain-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref
    });

    // Residue zoom handlers
    const residueZoomAAlignedTo = makeZoomHandler({
        pluginRef: viewerA.ref,
        structureRef: structureRefAAlignedTo,
        property: 'residue-test',
        chainId: selectedChainIdAlignedTo,
        sync: syncEnabled,
        syncPluginRef: viewerB.ref,
        residueId: selectedResidueIdAlignedTo,
        insCode: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    });
    const residueZoomAAligned = makeZoomHandler({
        pluginRef: viewerA.ref,
        structureRef: structureRefAAligned,
        property: 'residue-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerB.ref,
        residueId: selectedResidueIdAligned,
        insCode: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
    });
    const residueZoomBAlignedTo = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAlignedTo,
        property: 'residue-test',
        chainId: selectedChainIdAlignedTo,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref,
        residueId: selectedResidueIdAlignedTo,
        insCode: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    });
    const residueZoomBAligned = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAligned,
        property: 'residue-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref,
        residueId: selectedResidueIdAligned,
        insCode: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
    });

    // Unified robust delete handler for any representation
    const deleteRepresentation = async (ref: string, key: string, molstar: any, doForceUpdate = true) => {
        // Try to find repId for this ref
        let repId = Object.entries(molstar.repIdMap[key]).find(([id, r]) => r === ref)?.[0];
        let repRef = repId ? molstar.repIdMap[key][repId] : ref;
        // Fallback to array index if not found in repIdMap
        if (!repRef) {
            const idx = molstar.representationRefs[key].indexOf(ref);
            if (idx >= 0) repRef = molstar.representationRefs[key][idx];
        }
        if (!repRef) return;
        const plugin = molstar.pluginRef.current;
        if (!plugin) return;
        await import('molstar/lib/mol-plugin/commands').then(async ({ PluginCommands }) => {
            await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
            // Remove parent component if empty
            const state = plugin.state.data;
            const repCell = state.cells.get(repRef);
            const parentRef = repCell?.transform.parent;
            if (parentRef) {
                const isComponent = state.cells.get(parentRef)?.obj?.type?.name === 'Structure Component';
                const children = state.tree.children.get(parentRef)?.toArray?.() || [];
                let rep3dCount = 0;
                for (const childRef of children) {
                    const c = state.cells.get(childRef);
                    if (c?.obj?.type?.name === 'Representation3D') rep3dCount++;
                }
                if (isComponent && rep3dCount === 0) {
                    await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: parentRef }]);
                }
            }
            // Remove from repIdMap if present
            if (repId && molstar.repIdMap[key][repId]) {
                const newMap = { ...molstar.repIdMap[key] };
                delete newMap[repId];
                molstar.setRepIdMap(key, newMap);
            }
            plugin.canvas3d?.requestDraw?.();
            if (molstar.structureRefs[AlignedTo]) {
                molstar.refreshRepresentationRefs(AlignedTo, molstar.structureRefs[AlignedTo]!);
            }
            if (molstar.structureRefs[Aligned]) {
                molstar.refreshRepresentationRefs(Aligned, molstar.structureRefs[Aligned]!);
            }
            if (doForceUpdate) forceUpdate();
        });
    };

    // Check if a re-alignment for the selected pair already exists
    const realignmentExists = realignedMoleculesA.some(mol => mol.from === selectedChainIdAlignedTo && mol.to === selectedChainIdAligned);

    // Realign handler using selected chains
    const handleRealignToChains = () => {
        if (realignmentExists) return;
        const pluginA = viewerA.ref.current;
        if (!pluginA) {
            console.warn('Viewer A not initialized.');
            return;
        }
        // Step 1: Extract atom data for selected chains in both structures
        if (!structureRefAAlignedTo || !selectedChainIdAlignedTo) {
            console.warn('Viewer A, structure, or chain not selected.');
            return;
        }
        // Get objects
        const structureAlignedTo = pluginA.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRefAAlignedTo
        )?.cell.obj?.data;
        console.log('structureAlignedTo:', structureAlignedTo);
        if (!viewerA.moleculeAlignedTo) {
            console.warn('Viewer A moleculeAlignedTo not available.');
            return;
        }
        const structureAligned = pluginA.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRefAAligned
        )?.cell.obj?.data;
        console.log('structureAligned:', structureAligned);
        if (!structureAlignedTo || !structureAligned) {
            console.warn('Could not find structure objects for selected refs.');
            return;
        }
        // Get model from first unit in structure object
        const modelAlignedTo = structureAlignedTo?.units?.[0]?.model;
        const modelAligned = structureAligned?.units?.[0]?.model;
        if (!modelAlignedTo || !modelAligned) {
            console.warn('Could not find models in structures.');
            return;
        }
        // Extract atom data for each structure using structure.units, filtered by selected chain
        const atomDataAlignedTo = getAtomDataFromStructureUnits(structureAlignedTo, selectedChainIdAlignedTo);
        const atomDataAligned = getAtomDataFromStructureUnits(structureAligned, selectedChainIdAligned);
        try {
            const result = alignDatasetUsingChains(
                selectedAtomTypes,
                selectedChainIdAligned,
                atomDataAligned.symbolTypes,
                atomDataAligned.chainIds,
                atomDataAligned.xs,
                atomDataAligned.ys,
                atomDataAligned.zs,
                selectedChainIdAlignedTo,
                atomDataAlignedTo.symbolTypes,
                atomDataAlignedTo.chainIds,
                atomDataAlignedTo.xs,
                atomDataAlignedTo.ys,
                atomDataAlignedTo.zs
            );
            console.log('Alignment result:', result);
            const alignmentData: AlignmentData = {
                centroidReference: result.centroidReference,
                centroid: result.centroid,
                rotMat: result.rotmat
            };
            // getStructureRepresentations is now in utils/structure and can be used for session save/restore if needed
            // Load aligned structure in Viewers A and B.
            (async () => {
                const file = new File([alignedFile], alignedFile.name);
                const pluginA = viewerA.ref.current;
                if (!pluginA) {
                    console.warn('Viewer A not initialized.');
                    return;
                }
                await loadMoleculeIntoViewers(file, ReAligned, alignmentData);
                pluginA.canvas3d?.requestDraw?.();
                const pluginB = viewerB.ref.current;
                if (!pluginB) {
                    console.warn('Viewer B not initialized.');
                    return;
                }
                pluginB.canvas3d?.requestDraw?.();
            })();
            console.log('Realignment applied to Viewer A and B models.');
        } catch (err) {
            console.error('Alignment error:', err);
        }
    };

    // --- Debug: Log subunit selection and filtered chain IDs ---
    useEffect(() => {
        const chains = subunitToChainIdsAlignedTo.get(selectedSubunitAlignedTo);
        console.log('[Subunit Select Debug][AlignedTo] selectedSubunit:', selectedSubunitAlignedTo, 'chain IDs:', chains ? Array.from(chains) : []);
    }, [selectedSubunitAlignedTo, subunitToChainIdsAlignedTo]);

    useEffect(() => {
        const chains = subunitToChainIdsAligned.get(selectedSubunitAligned);
        console.log('[Subunit Select Debug][Aligned] selectedSubunit:', selectedSubunitAligned, 'chain IDs:', chains ? Array.from(chains) : []);
    }, [selectedSubunitAligned, subunitToChainIdsAligned]);

    // Menu bar handlers

    // Session save: use custom hook
    const handleSaveSession = useSessionSave(() => ({
        viewerA: {
            moleculeAlignedTo: viewerA.moleculeAlignedTo,
            moleculeAligned: viewerA.moleculeAligned,
        },
        viewerB: {
            moleculeAlignedTo: viewerB.moleculeAlignedTo,
            moleculeAligned: viewerB.moleculeAligned,
        },
        // Add more state as needed
    }));

    // Session load: use custom hook
    // Define a type for the loader return value
    interface LoadedMolecule {
        alignmentData?: any;
        // Add other properties as needed
    }

    const onSessionLoaded = useCallback(async (session: any, files: Record<string, File>) => {
        // Loads molecules and restores state from session. Expand as needed.
        let loadedAny = false;
        try {
            if (files.alignedToA) {
                // Explicitly type the result for clarity and type safety
                const alignedToMolecule = await loadMoleculeIntoViewers(files.alignedToA, AlignedTo) as LoadedMolecule | undefined;
                loadedAny = true;
                if (files.alignedB || files.alignedA) {
                    const alignedFile = files.alignedB || files.alignedA;
                    // Defensive runtime check for alignmentData
                    if (!alignedToMolecule || typeof alignedToMolecule !== 'object' || !('alignmentData' in alignedToMolecule) || !alignedToMolecule.alignmentData) {
                        alert('AlignedTo alignment data not available after load. Cannot load Aligned file.');
                    } else {
                        await loadMoleculeIntoViewers(alignedFile, Aligned, alignedToMolecule.alignmentData);
                    }
                }
            } else if (files.alignedB || files.alignedA) {
                await loadMoleculeIntoViewers(files.alignedB || files.alignedA, Aligned);
                loadedAny = true;
            }
            // TODO: Restore visibility and representations as needed
            if (!loadedAny) {
                alert('Session loaded, but could not automatically reload datasets. Please reload the required files manually.');
            }
        } catch (e) {
            alert('Error loading session: ' + (e instanceof Error ? e.message : String(e)));
        }
    }, [loadMoleculeIntoViewers]);

    const { handleLoadSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);

    // Generic prop creator for LoadDataRow
    interface LoadDataRowPropsInput {
        viewer: any;
        otherViewer: any;
        molstar: any;
        otherMolstar: any;
        realignedStructRefs: any;
        otherRealignedStructRefs: any;
        isMoleculeAlignedLoaded: boolean;
        isMoleculeAlignedToLoaded: boolean;
        viewerReady: boolean;
        otherViewerReady: boolean;
        representationType: any;
        setRepresentationType: (val: any) => void;
        colorsFile: any;
        isMoleculeColoursLoaded: boolean;
        structureRef: any;
        otherStructureRef: any;
        selectedSubunit: any;
        setSelectedSubunit: (val: any) => void;
        subunitToChainIds: any;
        chainInfo: any;
        selectedChainId: any;
        setSelectedChainId: (val: any) => void;
        residueInfo: any;
        selectedResidueId: any;
        setSelectedResidueId: (val: any) => void;
        fogEnabled: boolean;
        setFogEnabled: (val: boolean) => void;
        fogNear: number;
        setFogNear: (val: number) => void;
        fogFar: number;
        setFogFar: (val: number) => void;
        cameraNear: number;
        setCameraNear: (val: number) => void;
        cameraFar: number;
        setCameraFar: (val: number) => void;
        updateFog: (...args: any[]) => void;
        handleFileChange: (...args: any[]) => void;
        Aligned: string;
        allowedRepresentationTypes: readonly string[];
        syncEnabled: boolean;
        realignedRepRefs: any;
        setRealignedRepRefs: (val: any) => void;
        setRealignedStructRefs: (val: any) => void;
        cameraBNear: number;
        cameraBFar: number;
    }

    /**
     * Returns the properties for the load data row of a viewer, which includes the aligned molecule.
     * This function is used to keep the JSX cleaner and to encapsulate the logic for enabling/disabling 
     * controls based on the state of the viewer.
     * @returns The properties for the load data row of the viewer, including handlers for file input,
     * representation selection, color addition, subunit and chain selection, and fog/camera controls.
     */
    function getLoadDataRowProps({
        viewer,
        otherViewer,
        molstar,
        otherMolstar,
        realignedStructRefs,
        otherRealignedStructRefs,
        isMoleculeAlignedLoaded,
        isMoleculeAlignedToLoaded,
        viewerReady,
        otherViewerReady,
        representationType,
        setRepresentationType,
        colorsFile,
        isMoleculeColoursLoaded,
        structureRef,
        otherStructureRef,
        selectedSubunit,
        setSelectedSubunit,
        subunitToChainIds,
        chainInfo,
        selectedChainId,
        setSelectedChainId,
        residueInfo,
        selectedResidueId,
        setSelectedResidueId,
        fogEnabled,
        setFogEnabled,
        fogNear,
        setFogNear,
        fogFar,
        setFogFar,
        cameraNear,
        setCameraNear,
        cameraFar,
        setCameraFar,
        updateFog,
        handleFileChange,
        Aligned,
        allowedRepresentationTypes,
        syncEnabled,
        realignedRepRefs,
        setRealignedRepRefs,
        setRealignedStructRefs,
        cameraBNear,
        cameraBFar
    }: LoadDataRowPropsInput) {
        return {
            viewerTitle: viewer.moleculeAligned ? Aligned + `: ${viewer.moleculeAligned.name || viewer.moleculeAligned.filename}` : "",
            isLoaded: isMoleculeAlignedLoaded,
            onFileInputClick: viewer.handleFileInputButtonClick,
            fileInputRef: viewer.fileInputRef,
            onFileChange: (e: any) => handleFileChange(e, Aligned),
            fileInputDisabled: !isMoleculeAlignedToLoaded || !viewerReady || !otherViewerReady,
            fileInputLabel: `Load ${Aligned}`,
            representationType,
            onRepresentationTypeChange: setRepresentationType,
            representationTypeDisabled: !isMoleculeAlignedLoaded,
            representationTypeSelector: (
                <RepresentationSelectButton
                    label="Select Representation"
                    options={[...allowedRepresentationTypes]}
                    selected={representationType}
                    onSelect={option => setRepresentationType(option as AllowedRepresentationType)}
                    disabled={!isMoleculeAlignedLoaded}
                />
            ),
            onAddColorsClick: colorsFile.handleButtonClick,
            addColorsDisabled: !isMoleculeAlignedLoaded,
            onAddRepresentationClick: () => {
                let colorTheme;
                if (isMoleculeColoursLoaded) {
                    colorTheme = { name: Aligned + '-custom-chain-colors', params: {} };
                } else {
                    colorTheme = { name: 'default', params: {} };
                }
                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                if (viewer.moleculeAligned && structureRef) {
                    molstar.addRepresentation(
                        Aligned,
                        structureRef,
                        representationType,
                        colorTheme,
                        repId
                    );
                }
                if (otherViewer.moleculeAligned && otherStructureRef) {
                    otherMolstar.addRepresentation(
                        Aligned,
                        otherStructureRef,
                        representationType,
                        colorTheme,
                        repId
                    );
                }
                Object.entries(realignedStructRefs).forEach(([id, structRef]) => {
                    if (structRef) {
                        molstar.addRepresentation(
                            id,
                            structRef,
                            representationType,
                            colorTheme,
                            repId
                        );
                    }
                });
                Object.entries(otherRealignedStructRefs).forEach(([id, structRef]) => {
                    if (structRef) {
                        otherMolstar.addRepresentation(
                            id,
                            structRef,
                            representationType,
                            colorTheme,
                            repId
                        );
                    }
                });
            },
            addRepresentationDisabled: !isMoleculeAlignedLoaded || !structureRef,
            colorsInputRef: colorsFile.inputRef,
            onColorsFileChange: colorsFile.handleFileChange,
            selectedSubunit,
            onSelectSubunit: setSelectedSubunit,
            subunitSelectDisabled: !isMoleculeAlignedLoaded,
            chainInfo,
            selectedChainId,
            onSelectChainId: setSelectedChainId,
            chainSelectDisabled: !isMoleculeAlignedToLoaded,
            residueInfo,
            selectedResidueId,
            onSelectResidueId: setSelectedResidueId,
            residueSelectDisabled: !isMoleculeAlignedLoaded,
            fogEnabled,
            fogNear,
            fogFar,
            onFogEnabledChange: (val: boolean) => {
                setFogEnabled(val);
                updateFog(viewer.ref.current, otherViewer.ref.current, val, fogNear, fogFar, cameraNear, cameraFar);
            },
            onFogNearChange: (val: number) => {
                setFogNear(val);
                updateFog(viewer.ref.current, otherViewer.ref.current, fogEnabled, val, fogFar, cameraNear, cameraFar);
            },
            onFogFarChange: (val: number) => {
                setFogFar(val);
                updateFog(viewer.ref.current, otherViewer.ref.current, fogEnabled, fogNear, val, cameraNear, cameraFar);
            },
            cameraNear,
            cameraFar,
            onCameraNearChange: (val: number) => {
                setCameraNear(val);
                updateFog(viewer.ref.current, otherViewer.ref.current, fogEnabled, fogNear, fogFar, val, cameraFar);
            },
            onCameraFarChange: (val: number) => {
                setCameraFar(val);
                updateFog(viewer.ref.current, otherViewer.ref.current, fogEnabled, fogNear, fogFar, cameraNear, val);
            },
            subunitToChainIds
        };
    }


    /**
     * Returns the props for the aligned molecule list component for a viewer (generalized).
     * @param params Object containing all necessary props for the viewer and its counterpart.
     * @returns Props for the aligned molecule list component for the viewer.
     */
    function getMoleculeUIAlignedToProps({
        molstar,
        otherMolstar,
        viewer,
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
        representationRefs,
        syncEnabled,
        deleteRepresentation,
        repIdMap,
        AlignedTo
    }: {
        molstar: any,
        otherMolstar: any,
        viewer: any,
        isVisible: boolean,
        onToggleVisibility: () => void,
        chainZoomLabel: string,
        onChainZoom: () => void,
        chainZoomDisabled: boolean,
        residueZoomLabel: string,
        onResidueZoom: () => void,
        residueZoomDisabled: boolean,
        isLoaded: boolean,
        forceUpdate: () => void,
        representationRefs: any[],
        syncEnabled: boolean,
        deleteRepresentation: any,
        repIdMap: any,
        AlignedTo: string
    }) {
        return {
            key: representationRefs?.join('-') || viewer.viewerKey + `-` + AlignedTo,
            label: viewer.moleculeAlignedTo?.label ?? AlignedTo,
            plugin: viewer.ref.current,
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
            representationRefs: representationRefs || [],
            onDeleteRepresentation: (ref: string) => {
                const repId = Object.entries(repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                if (syncEnabled && repId) {
                    Promise.all([
                        deleteRepresentation(molstar.repIdMap[AlignedTo][repId], AlignedTo, molstar, false),
                        deleteRepresentation(otherMolstar.repIdMap[AlignedTo][repId], AlignedTo, otherMolstar, false)
                    ]).then(forceUpdate);
                } else if (repId) {
                    deleteRepresentation(molstar.repIdMap[AlignedTo][repId], AlignedTo, molstar);
                } else {
                    if (syncEnabled) {
                        Promise.all([
                            deleteRepresentation(ref, AlignedTo, molstar, false),
                            deleteRepresentation(ref, AlignedTo, otherMolstar, false)
                        ]).then(forceUpdate);
                    } else {
                        deleteRepresentation(ref, AlignedTo, molstar);
                    }
                }
            },
            onToggleRepVisibility: (ref: string) => {
                [molstar, otherMolstar].forEach(molstarInstance => {
                    const plugin = molstarInstance.pluginRef.current;
                    if (!plugin) return;
                    const cell = plugin.state?.data?.cells?.get(ref);
                    if (cell) {
                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                            plugin.canvas3d?.requestDraw?.();
                            forceUpdate();
                        });
                    }
                });
            },
        };
    }

    /**
     * Returns the props for the aligned molecule list component for a viewer.
     * @param params Object containing all necessary props for the viewer and its counterpart.
     * @returns Props for the aligned molecule list component for the viewer.
     */
    function getMoleculeUIAlignedProps({
        molstar,
        otherMolstar,
        viewer,
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
        representationRefs,
        syncEnabled,
        deleteRepresentation,
        repIdMap,
        Aligned,
        chainInfoAligned,
        selectedChainIdAligned,
        residueInfoAligned,
        selectedResidueIdAligned
    }: {
        molstar: any,
        otherMolstar: any,
        viewer: any,
        isVisible: boolean,
        onToggleVisibility: () => void,
        chainZoomLabel: string,
        onChainZoom: () => void,
        chainZoomDisabled: boolean,
        residueZoomLabel: string,
        onResidueZoom: () => void,
        residueZoomDisabled: boolean,
        isLoaded: boolean,
        forceUpdate: () => void,
        representationRefs: any[],
        syncEnabled: boolean,
        deleteRepresentation: any,
        repIdMap: any,
        Aligned: string,
        chainInfoAligned: any,
        selectedChainIdAligned: any,
        residueInfoAligned: any,
        selectedResidueIdAligned: any
    }) {
        return {
            key: representationRefs?.join('-') || viewer.viewerKey + `-` + Aligned,
            label: viewer.moleculeAligned?.label ?? Aligned,
            plugin: viewer.ref.current,
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
            representationRefs: representationRefs || [],
            onDeleteRepresentation: (ref: string) => {
                const repId = Object.entries(repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                if (syncEnabled && repId) {
                    Promise.all([
                        deleteRepresentation(molstar.repIdMap[Aligned][repId], Aligned, molstar, false),
                        deleteRepresentation(otherMolstar.repIdMap[Aligned][repId], Aligned, otherMolstar, false)
                    ]).then(forceUpdate);
                } else if (repId) {
                    deleteRepresentation(molstar.repIdMap[Aligned][repId], Aligned, molstar);
                } else {
                    if (syncEnabled) {
                        Promise.all([
                            deleteRepresentation(ref, Aligned, molstar, false),
                            deleteRepresentation(ref, Aligned, otherMolstar, false)
                        ]).then(forceUpdate);
                    } else {
                        deleteRepresentation(ref, Aligned, molstar);
                    }
                }
            },
            onToggleRepVisibility: (ref: string) => {
                [molstar, otherMolstar].forEach(molstarInstance => {
                    const plugin = molstarInstance.pluginRef.current;
                    if (!plugin) return;
                    const cell = plugin.state?.data?.cells?.get(ref);
                    if (cell) {
                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                            plugin.canvas3d?.requestDraw?.();
                            forceUpdate();
                        });
                    }
                });
            },
        };
    }

    /**
     * Returns the props for the realigned molecule list component for a viewer.
     * @param params Object containing all necessary props for the viewer and its counterpart.
     * @returns Props for the realigned molecule list component for the viewer.
     */
    function getRealignedMoleculeListProps({
        molecules,
        molstar,
        chainInfo,
        residueInfo,
        selectedResidueId,
        realignedStructRefs,
        setRealignedMolecules,
        setRealignedRepRefs,
        setRealignedStructRefs,
        forceUpdate,
        viewerKey,
        otherMolstar,
        otherRealignedStructRefs,
        setOtherRealignedMolecules,
        setOtherRealignedRepRefs,
        setOtherRealignedStructRefs
    }: {
        molecules: any,
        molstar: any,
        chainInfo: any,
        residueInfo: any,
        selectedResidueId: any,
        realignedStructRefs: any,
        setRealignedMolecules: any,
        setRealignedRepRefs: any,
        setRealignedStructRefs: any,
        forceUpdate: () => void,
        viewerKey: string,
        otherMolstar: any,
        otherRealignedStructRefs: any,
        setOtherRealignedMolecules: any,
        setOtherRealignedRepRefs: any,
        setOtherRealignedStructRefs: any
    }) {
        return {
            molecules,
            molstar,
            chainInfo,
            residueInfo,
            selectedResidueId,
            realignedStructRefs,
            setRealignedMolecules,
            setRealignedRepRefs,
            setRealignedStructRefs,
            forceUpdate,
            viewerKey,
            otherMolstar,
            otherRealignedStructRefs,
            setOtherRealignedMolecules,
            setOtherRealignedRepRefs,
            setOtherRealignedStructRefs,
        };
    }

    /**
     * Returns the props for the Molstar container component for a viewer.
     *
     * @param viewer The viewer state object (viewerA or viewerB).
     * @param pluginRef The plugin ref for the viewer.
     * @param setViewerWrapper The setViewer wrapper for the viewer.
     * @param setViewerReady The setViewerReady setter for the viewer.
     * @returns Props for the Molstar container component for the viewer.
     */
    function getMolstarContainerProps({
        viewer,
        pluginRef,
        setViewerWrapper,
        setViewerReady
    }: {
        viewer: typeof viewerA,
        pluginRef: typeof pluginRefA,
        setViewerWrapper: (viewer: any) => void,
        setViewerReady: (ready: boolean) => void
    }) {
        return {
            ref: pluginRef,
            viewerKey: viewer.viewerKey,
            setViewer: setViewerWrapper,
            onMouseDown: () => setActiveViewer(viewer.viewerKey),
            onReady: () => setViewerReady(true),
        };
    }

    // Return the main app component.
    return (
        <ViewerStateProvider>
            <SelectionProvider>
                <SyncProvider>
                <div className="App">
                    <AppHeader />
                    <div className="menu-bar">
                        <button className="menu-btn" onClick={handleSaveSession}>Save Session</button>
                        <label className="menu-btn" style={{ cursor: 'pointer', marginBottom: 0 }}>
                            Load Session
                            <input type="file" style={{ display: 'none' }} onChange={handleLoadSession} accept="application/json" />
                        </label>
                    </div>
                    {SessionLoadModal}
                    <GeneralControls
                        zoomExtraRadius={zoomExtraRadius}
                        setZoomExtraRadius={setZoomExtraRadius}
                        zoomMinRadius={zoomMinRadius}
                        setZoomMinRadius={setZoomMinRadius}
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        syncEnabled={syncEnabled}
                        setSyncEnabled={setSyncEnabled}
                        selectedChainIdAlignedTo={selectedChainIdAlignedTo}
                        selectedChainIdAligned={selectedChainIdAligned}
                        realignmentExists={realignmentExists}
                        handleRealignToChains={handleRealignToChains}
                    />
                    <TwoColumnsContainer
                        left={
                            <ViewerColumn
                                viewerKey={A}
                                loadDataRowProps={getLoadDataRowProps({
                                    viewer: viewerA,
                                    otherViewer: viewerB,
                                    molstar: molstarA,
                                    otherMolstar: molstarB,
                                    realignedStructRefs: realignedStructRefsA,
                                    otherRealignedStructRefs: realignedStructRefsB,
                                    isMoleculeAlignedLoaded: viewerA.isMoleculeAlignedLoaded,
                                    isMoleculeAlignedToLoaded: viewerA.isMoleculeAlignedToLoaded,
                                    viewerReady: viewerAReady,
                                    otherViewerReady: viewerBReady,
                                    representationType: representationTypeAligned,
                                    setRepresentationType: setRepresentationTypeAligned,
                                    colorsFile: colorsAlignedFile,
                                    isMoleculeColoursLoaded: isMoleculeAlignedColoursLoaded,
                                    structureRef: structureRefAAligned,
                                    otherStructureRef: structureRefBAligned,
                                    selectedSubunit: selectedSubunitAligned,
                                    setSelectedSubunit: setSelectedSubunitAligned,
                                    subunitToChainIds: subunitToChainIdsAligned,
                                    chainInfo: chainInfoAligned,
                                    selectedChainId: selectedChainIdAligned,
                                    setSelectedChainId: setSelectedChainIdAligned,
                                    residueInfo: residueInfoAligned,
                                    selectedResidueId: selectedResidueIdAligned,
                                    setSelectedResidueId: setSelectedResidueIdAligned,
                                    fogEnabled: fogBEnabled,
                                    setFogEnabled: setFogBEnabled,
                                    fogNear: fogBNear,
                                    setFogNear: setFogBNear,
                                    fogFar: fogBFar,
                                    setFogFar: setFogBFar,
                                    cameraNear: cameraBNear,
                                    setCameraNear: setCameraBNear,
                                    cameraFar: cameraBFar,
                                    setCameraFar: setCameraBFar,
                                    updateFog,
                                    handleFileChange,
                                    Aligned,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsA,
                                    setRealignedRepRefs: setRealignedRepRefsA,
                                    setRealignedStructRefs: setRealignedStructRefsA,
                                    cameraBNear,
                                    cameraBFar,
                                })}
                                moleculeUIAlignedToProps={getMoleculeUIAlignedToProps({
                                    molstar: molstarA,
                                    otherMolstar: molstarB,
                                    viewer: viewerA,
                                    isVisible: viewerA.isMoleculeAlignedToVisible,
                                    onToggleVisibility: toggleViewerAAlignedTo.handleButtonClick,
                                    chainZoomLabel: selectedChainIdAlignedTo && chainInfoAlignedTo.chainLabels.has(selectedChainIdAlignedTo)
                                        ? chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo) ?? ''
                                        : '',
                                    onChainZoom: chainZoomAAlignedTo.handleButtonClick,
                                    chainZoomDisabled: !selectedChainIdAlignedTo,
                                    residueZoomLabel: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || '',
                                    onResidueZoom: residueZoomAAlignedTo.handleButtonClick,
                                    residueZoomDisabled: !selectedResidueIdAlignedTo,
                                    isLoaded: viewerA.isMoleculeAlignedToLoaded,
                                    forceUpdate,
                                    representationRefs: molstarA.representationRefs[AlignedTo] || [],
                                    syncEnabled,
                                    deleteRepresentation,
                                    repIdMap: molstarA.repIdMap,
                                    AlignedTo
                                })}
                                moleculeUIAlignedProps={getMoleculeUIAlignedProps({
                                    molstar: molstarA,
                                    otherMolstar: molstarB,
                                    viewer: viewerA,
                                    isVisible: viewerA.isMoleculeAlignedVisible,
                                    onToggleVisibility: toggleViewerAAligned.handleButtonClick,
                                    chainZoomLabel: selectedChainIdAligned && chainInfoAligned.chainLabels.has(selectedChainIdAligned)
                                        ? chainInfoAligned.chainLabels.get(selectedChainIdAligned) ?? ''
                                        : '',
                                    onChainZoom: chainZoomAAligned.handleButtonClick,
                                    chainZoomDisabled: !selectedChainIdAligned,
                                    residueZoomLabel: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || '',
                                    onResidueZoom: residueZoomAAligned.handleButtonClick,
                                    residueZoomDisabled: !selectedResidueIdAligned,
                                    isLoaded: viewerA.isMoleculeAlignedLoaded,
                                    forceUpdate,
                                    representationRefs: molstarA.representationRefs[Aligned] || [],
                                    syncEnabled,
                                    deleteRepresentation,
                                    repIdMap: molstarA.repIdMap,
                                    Aligned,
                                    chainInfoAligned,
                                    selectedChainIdAligned,
                                    residueInfoAligned,
                                    selectedResidueIdAligned
                                })}
                                realignedMoleculeListProps={getRealignedMoleculeListProps({
                                    molecules: realignedMoleculesA,
                                    molstar: molstarA,
                                    chainInfo: chainInfoAligned,
                                    residueInfo: residueInfoAligned,
                                    selectedResidueId: selectedResidueIdAligned,
                                    realignedStructRefs: realignedStructRefsA,
                                    setRealignedMolecules: setRealignedMoleculesA,
                                    setRealignedRepRefs: setRealignedRepRefsA,
                                    setRealignedStructRefs: setRealignedStructRefsA,
                                    forceUpdate,
                                    viewerKey: "A",
                                    otherMolstar: molstarB,
                                    otherRealignedStructRefs: realignedStructRefsB,
                                    setOtherRealignedMolecules: setRealignedMoleculesB,
                                    setOtherRealignedRepRefs: setRealignedRepRefsB,
                                    setOtherRealignedStructRefs: setRealignedStructRefsB,
                                })}
                                molstarContainerProps={getMolstarContainerProps({
                                    viewer: viewerA,
                                    pluginRef: pluginRefA,
                                    setViewerWrapper: setViewerAWrapper,
                                    setViewerReady: setViewerAReady
                                })}
                            />
                        }
                        right={
                            <ViewerColumn
                                viewerKey={B}
                                loadDataRowProps={getLoadDataRowProps({
                                    viewer: viewerB,
                                    otherViewer: viewerA,
                                    molstar: molstarB,
                                    otherMolstar: molstarA,
                                    realignedStructRefs: realignedStructRefsB,
                                    otherRealignedStructRefs: realignedStructRefsA,
                                    isMoleculeAlignedLoaded: viewerB.isMoleculeAlignedLoaded,
                                    isMoleculeAlignedToLoaded: viewerA.isMoleculeAlignedToLoaded,
                                    viewerReady: viewerBReady,
                                    otherViewerReady: viewerAReady,
                                    representationType: representationTypeAligned,
                                    setRepresentationType: setRepresentationTypeAligned,
                                    colorsFile: colorsAlignedFile,
                                    isMoleculeColoursLoaded: isMoleculeAlignedColoursLoaded,
                                    structureRef: structureRefBAligned,
                                    otherStructureRef: structureRefAAligned,
                                    selectedSubunit: selectedSubunitAligned,
                                    setSelectedSubunit: setSelectedSubunitAligned,
                                    subunitToChainIds: subunitToChainIdsAligned,
                                    chainInfo: chainInfoAligned,
                                    selectedChainId: selectedChainIdAligned,
                                    setSelectedChainId: setSelectedChainIdAligned,
                                    residueInfo: residueInfoAligned,
                                    selectedResidueId: selectedResidueIdAligned,
                                    setSelectedResidueId: setSelectedResidueIdAligned,
                                    fogEnabled: fogBEnabled,
                                    setFogEnabled: setFogBEnabled,
                                    fogNear: fogBNear,
                                    setFogNear: setFogBNear,
                                    fogFar: fogBFar,
                                    setFogFar: setFogBFar,
                                    cameraNear: cameraBNear,
                                    setCameraNear: setCameraBNear,
                                    cameraFar: cameraBFar,
                                    setCameraFar: setCameraBFar,
                                    updateFog,
                                    handleFileChange,
                                    Aligned,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsB,
                                    setRealignedRepRefs: setRealignedRepRefsB,
                                    setRealignedStructRefs: setRealignedStructRefsB,
                                    cameraBNear,
                                    cameraBFar,
                                })}
                                moleculeUIAlignedToProps={getMoleculeUIAlignedToProps({
                                    molstar: molstarB,
                                    otherMolstar: molstarA,
                                    viewer: viewerB,
                                    isVisible: viewerB.isMoleculeAlignedToVisible,
                                    onToggleVisibility: toggleViewerBAlignedTo.handleButtonClick,
                                    chainZoomLabel: selectedChainIdAlignedTo && chainInfoAlignedTo.chainLabels.has(selectedChainIdAlignedTo)
                                        ? chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo) ?? ''
                                        : '',
                                    onChainZoom: chainZoomBAlignedTo.handleButtonClick,
                                    chainZoomDisabled: !selectedChainIdAlignedTo,
                                    residueZoomLabel: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || '',
                                    onResidueZoom: residueZoomBAlignedTo.handleButtonClick,
                                    residueZoomDisabled: !selectedResidueIdAlignedTo,
                                    isLoaded: viewerB.isMoleculeAlignedToLoaded,
                                    forceUpdate,
                                    representationRefs: molstarB.representationRefs[AlignedTo] || [],
                                    syncEnabled,
                                    deleteRepresentation,
                                    repIdMap: molstarB.repIdMap,
                                    AlignedTo
                                })}
                                moleculeUIAlignedProps={getMoleculeUIAlignedProps({
                                    molstar: molstarB,
                                    otherMolstar: molstarA,
                                    viewer: viewerB,
                                    isVisible: viewerB.isMoleculeAlignedVisible,
                                    onToggleVisibility: toggleViewerBAligned.handleButtonClick,
                                    chainZoomLabel: selectedChainIdAligned && chainInfoAligned.chainLabels.has(selectedChainIdAligned)
                                        ? chainInfoAligned.chainLabels.get(selectedChainIdAligned) ?? ''
                                        : '',
                                    onChainZoom: chainZoomBAligned.handleButtonClick,
                                    chainZoomDisabled: !selectedChainIdAligned,
                                    residueZoomLabel: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || '',
                                    onResidueZoom: residueZoomBAligned.handleButtonClick,
                                    residueZoomDisabled: !selectedResidueIdAligned,
                                    isLoaded: viewerB.isMoleculeAlignedLoaded,
                                    forceUpdate,
                                    representationRefs: molstarB.representationRefs[Aligned] || [],
                                    syncEnabled,
                                    deleteRepresentation,
                                    repIdMap: molstarB.repIdMap,
                                    Aligned,
                                    chainInfoAligned,
                                    selectedChainIdAligned,
                                    residueInfoAligned,
                                    selectedResidueIdAligned
                                })}
                                realignedMoleculeListProps={getRealignedMoleculeListProps({
                                    molecules: realignedMoleculesB,
                                    molstar: molstarB,
                                    chainInfo: chainInfoAligned,
                                    residueInfo: residueInfoAligned,
                                    selectedResidueId: selectedResidueIdAligned,
                                    realignedStructRefs: realignedStructRefsB,
                                    setRealignedMolecules: setRealignedMoleculesB,
                                    setRealignedRepRefs: setRealignedRepRefsB,
                                    setRealignedStructRefs: setRealignedStructRefsB,
                                    forceUpdate,
                                    viewerKey: "B",
                                    otherMolstar: molstarA,
                                    otherRealignedStructRefs: realignedStructRefsA,
                                    setOtherRealignedMolecules: setRealignedMoleculesA,
                                    setOtherRealignedRepRefs: setRealignedRepRefsA,
                                    setOtherRealignedStructRefs: setRealignedStructRefsB,
                                })}
                                molstarContainerProps={getMolstarContainerProps({
                                    viewer: viewerB,
                                    pluginRef: pluginRefB,
                                    setViewerWrapper: setViewerBWrapper,
                                    setViewerReady: setViewerBReady
                                })}
                            />
                        }
                    />
                </div>
                </SyncProvider>
            </SelectionProvider>
        </ViewerStateProvider>
    );
};

export default App;
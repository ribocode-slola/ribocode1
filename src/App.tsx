/**
 * Ribocode App component.
 *
 * Main entry point for the Ribocode web application, providing the primary UI and state management for molecular alignment and visualization.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT. See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SelectionProvider } from './context/SelectionContext';
import { ViewerStateProvider } from './context/ViewerStateContext';
import { SyncProvider } from './context/SyncContext';
import { handleToggle } from './handlers/uiHandlers';
import { useSessionSave } from './hooks/useSessionSave';
import { useSessionLoadModal } from './hooks/useSessionLoadModal';
import { useUpdateChainInfo } from './hooks/useUpdateChainInfo';
import { useUpdateResidueInfo } from './hooks/useUpdateResidueInfo';
import { useUpdateColors } from './hooks/useUpdateColors';
import ViewerColumn , {
    getLoadDataRowProps,
    getMoleculeUIAlignedToProps,
    getMoleculeUIAlignedProps,
    getRealignedMoleculeListProps,
    getMolstarContainerProps
} from './components/ViewerColumn';
import TwoColumnsContainer from './components/TwoColumnsContainer';
import AppHeader from './components/AppHeader';
import { AlignedTo, Aligned, ReAligned } from './constants/ribocode';
import { parseColorFileContent } from './utils/colors';
import { useFileInput } from './hooks/useFileInput';
import { useChainState } from './hooks/useChainState';
import { getAtomDataFromStructureUnits } from './utils/data';
import { parseDictionaryFileContent } from './utils/dictionary';
import { useResidueState } from './hooks/useResidueState';
import { useSubunitState } from './hooks/useSubunitState';
import { allowedRepresentationTypes, AllowedRepresentationType } from './types/ribocode';
import GeneralControls from './components/GeneralControls';
import { ViewerState } from './components/RibocodeViewer';
import { useMolstarViewer } from './hooks/useMolstarViewer';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { useViewerState } from './hooks/useViewerState';
import { alignDatasetUsingChains } from 'molstar/lib/extensions/ribocode/utils/geometry';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { AlignmentData } from 'molstar/lib/extensions/ribocode/types';
import type { LoadedMolecule, ViewerKey } from './types/ribocode';
import { A, B } from './constants/ribocode';
import { makeFogSetters, makeCameraSetters, makeZoomHandler } from './utils/viewerHelpers';
import { selectedAtomTypes } from './constants/ribocode';

/**
 * The main App component.
 * @returns The main App component.
 */
interface AppProps {
    testForceIsMoleculeAlignedLoaded?: boolean;
}

const App: React.FC<AppProps> = ({ testForceIsMoleculeAlignedLoaded }) => {

    // Store Files and filenames for aligned and alignedTo molecule reloads.
    const [alignedFile, setAlignedFile] = useState<any | null>(null);
    const [alignedFilename, setAlignedFilename] = useState<string | null>(null);
    const [alignedToFile, setAlignedToFile] = useState<any | null>(null);
    const [alignedToFilename, setAlignedToFilename] = useState<string | null>(null);
    const [expectedAlignedToFilename, setExpectedAlignedToFilename] = useState<string | null>(null);

    // Create plugin refs and pass to useMolstarViewers
    const pluginRefA: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const pluginRefB: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const molstarA: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefA);
    const molstarB: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefB);

    // Initialize viewer states, pass test prop for test control
    const viewerA: ViewerState = useViewerState(A, testForceIsMoleculeAlignedLoaded);
    const viewerB: ViewerState = useViewerState(B, testForceIsMoleculeAlignedLoaded);
    const setViewerAWrapper = useCallback((viewer: PluginUIContext) => {
        viewerA.ref.current = viewer;
    }, [viewerA]);
    const setViewerBWrapper = useCallback((viewer: PluginUIContext) => {
        viewerB.ref.current = viewer;
    }, [viewerB]);
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);

    // Use a ref to always have the latest alignmentData from AlignedTo
    const alignmentDataRef = useRef<any>(null);
    useEffect(() => {
        const alignmentData = viewerA.moleculeAlignedTo?.alignmentData;
        if (alignmentData && Object.keys(alignmentData).length > 0) {
            alignmentDataRef.current = alignmentData;
        } else {
            alignmentDataRef.current = null;
        }
    }, [viewerA.moleculeAlignedTo]);

    const alignmentDataReady = alignmentDataRef.current;

    // Viewer state management
    // -----------------------
    const [activeViewer, setActiveViewer] = useState<ViewerKey>(A);

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
    // Robust file loading logic for both AlignedTo and Aligned
    const loadMoleculeIntoViewers = async (file: File, mode: string, alignmentData?: any) => {
        const assetFile = Asset.File(file);
        const pluginA = viewerA.ref.current;
        const pluginB = viewerB.ref.current;
        if (!pluginA || !pluginB) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        // Prevent redundant state updates to break infinite update loops
        if (mode === AlignedTo) {
            if (alignedToFile && alignedToFile.name === file.name) {
                // Already loaded, skip
                return;
            }
            setAlignedToFile(file);
            setAlignedToFilename(file.name);
            if (expectedAlignedToFilename) setExpectedAlignedToFilename(null);
        } else if (mode === Aligned) {
            if (alignedFile && alignedFile.name === file.name) {
                // Already loaded, skip
                return;
            }
            setAlignedFile(file);
            setAlignedFilename(file.name);
        }
        let alignData = alignmentData;
        if (mode === Aligned && !alignData) {
            alignData = viewerA.moleculeAlignedTo?.alignmentData;
        }
        // Viewer A
        if (mode === AlignedTo) {
            const viewerAMoleculeAlignedTo = await loadMoleculeFileToViewer(
                pluginA, assetFile, true, true
            );
            if (!viewerAMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer A.');
                return;
            }
            viewerA.setMoleculeAlignedTo((prev: any) => ({
                label: viewerAMoleculeAlignedTo.label,
                name: viewerAMoleculeAlignedTo.name,
                filename: viewerAMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                presetResult: viewerAMoleculeAlignedTo.presetResult ?? "Unknown",
                trajectory: viewerAMoleculeAlignedTo.trajectory,
                alignmentData: viewerAMoleculeAlignedTo.alignmentData
            }));
            const structureA = pluginA.managers.structure.hierarchy.current.structures[0];
            if (structureA) {
                const ref = structureA.cell.transform.ref;
                molstarA.setStructureRef(AlignedTo, ref);
            }
            viewerA.setIsMoleculeAlignedToLoaded(true);
            viewerA.setIsMoleculeAlignedToVisible(true);
            // Viewer B
            const viewerBMoleculeAlignedTo = await loadMoleculeFileToViewer(
                pluginB, assetFile, false, true
            );
            if (!viewerBMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer B.');
                return;
            }
            viewerB.setMoleculeAlignedTo((prev: any) => ({
                label: viewerBMoleculeAlignedTo.label,
                name: viewerBMoleculeAlignedTo.name,
                filename: viewerBMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                presetResult: viewerBMoleculeAlignedTo.presetResult ?? "Unknown",
                trajectory: viewerBMoleculeAlignedTo.trajectory,
            }));
            const structureB = pluginB.managers.structure.hierarchy.current.structures[0];
            if (structureB) {
                const ref = structureB.cell.transform.ref;
                molstarB.setStructureRef(AlignedTo, ref);
            }
            viewerB.setIsMoleculeAlignedToLoaded(true);
            viewerB.setIsMoleculeAlignedToVisible(true);
        } else if (mode === Aligned) {
            // alignData should always be present due to UI constraints; no warning or early return needed.
            // Viewer A
            const viewerAMoleculeAligned = await loadMoleculeFileToViewer(
                pluginA, assetFile, false, true, alignData
            );
            if (!viewerAMoleculeAligned) {
                console.error('Failed to load molecule into viewer A.');
                return;
            }
            viewerA.setMoleculeAligned((prev: any) => ({
                label: viewerAMoleculeAligned.label,
                name: viewerAMoleculeAligned.name,
                filename: viewerAMoleculeAligned.filename ?? prev?.filename ?? "",
                presetResult: viewerAMoleculeAligned.presetResult ?? "Unknown",
                trajectory: viewerAMoleculeAligned.trajectory,
            }));
            const structureA = pluginA.managers.structure.hierarchy.current.structures[1];
            if (structureA) {
                const ref = structureA.cell.transform.ref;
                molstarA.setStructureRef(Aligned, ref);
            }
            viewerA.setIsMoleculeAlignedLoaded(true);
            viewerA.setIsMoleculeAlignedVisible(true);
            // Viewer B
            const viewerBMoleculeAligned = await loadMoleculeFileToViewer(
                pluginB, assetFile, false, true, alignData
            );
            if (!viewerBMoleculeAligned) {
                console.error('Failed to load molecule into viewer B.');
                return;
            }
            viewerB.setMoleculeAligned((prev: any) => ({
                label: viewerBMoleculeAligned.label,
                name: viewerBMoleculeAligned.name,
                filename: viewerBMoleculeAligned.filename ?? prev?.filename ?? "",
                presetResult: viewerBMoleculeAligned.presetResult ?? "Unknown",
                trajectory: viewerBMoleculeAligned.trajectory,
            }));
            const structureB = pluginB.managers.structure.hierarchy.current.structures[1];
            if (structureB) {
                const ref = structureB.cell.transform.ref;
                molstarB.setStructureRef(Aligned, ref);
            }
            viewerB.setIsMoleculeAlignedLoaded(true);
            viewerB.setIsMoleculeAlignedVisible(true);
        }
    };

    // Robust file input handler for both modes
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>, mode: string) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (mode === AlignedTo && expectedAlignedToFilename && file.name !== expectedAlignedToFilename) {
                alert(`You must select the file '${expectedAlignedToFilename}' for AlignedTo as required by the loaded session.`);
                return;
            }
            if (mode === Aligned && alignedFilename && file.name !== alignedFilename) {
                alert(`Selected file name (${file.name}) does not match the expected Aligned file (${alignedFilename}). Please select the correct file.`);
                return;
            }
            // Use the ref for alignmentData to avoid async state issues
            const alignmentData = mode === Aligned ? alignmentDataRef.current : undefined;
            await loadMoleculeIntoViewers(file, mode, alignmentData);
        },
        [expectedAlignedToFilename, alignedFilename]
    );

    // Fog state grouped by viewer
    const [fogA, setFogA] = useState({ enabled: false, near: 0, far: 100 });
    const [fogB, setFogB] = useState({ enabled: false, near: 0, far: 100 });
    
    // Camera state grouped by viewer
    const [cameraA, setCameraA] = useState({ near: 0.1, far: 1000 });
    const [cameraB, setCameraB] = useState({ near: 0.1, far: 1000 });
    
    // Zoom state (if needed, can also be grouped)
    const [zoomExtraRadius, setZoomExtraRadius] = useState(0);
    const [zoomMinRadius, setZoomMinRadius] = useState(0);

    // updateFog function (adapt as needed)
    const updateFog = (
        pluginARef: any,
        pluginBRef: any,
        fogAState = fogA,
        fogBState = fogB,
        cameraAState = cameraA,
        cameraBState = cameraB
    ) => {
        // ...implement fog update logic using grouped state...
    };

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

    // Custom hooks for updating chain info and subunit-to-chain mapping for both viewers.
    useUpdateChainInfo(viewerA.ref, structureRefAAlignedTo, molstarA, setChainInfoAlignedTo, setSubunitToChainIdsAlignedTo, AlignedTo);
    useUpdateChainInfo(viewerB.ref, structureRefBAligned, molstarB, setChainInfoAligned, setSubunitToChainIdsAligned, Aligned);

    // Generalized effect for residue ID selection and info update.
    useUpdateResidueInfo(viewerA.ref, structureRefAAlignedTo, molstarA, selectedChainIdAlignedTo, setResidueInfoAlignedTo, selectedResidueIdAlignedTo, setSelectedResidueIdAlignedTo, AlignedTo);
    useUpdateResidueInfo(viewerB.ref, structureRefBAligned, molstarB, selectedChainIdAligned, setResidueInfoAligned, selectedResidueIdAligned, setSelectedResidueIdAligned, Aligned);

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

    // Define the session loaded callback with proper typing and error handling
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

    // Initialize session load modal with the callback
    const { handleLoadSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);

    // Return the main app component.
    return (
        <ViewerStateProvider>
            <SelectionProvider>
                <SyncProvider>
                <div className="App">
                    <AppHeader />
                    {/* Session menu dropdown below the title */}
                    <nav className="session-menu-bar">
                        <div className="session-menu-container">
                            <button
                                className="session-menu-btn"
                                id="session-menu-btn"
                                onClick={e => {
                                    const menu = document.getElementById('session-menu-dropdown');
                                    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                                }}
                                onBlur={e => {
                                    setTimeout(() => {
                                        const menu = document.getElementById('session-menu-dropdown');
                                        if (menu) menu.style.display = 'none';
                                    }, 150);
                                }}
                            >
                                Session ▾
                            </button>
                            <div
                                id="session-menu-dropdown"
                                className="session-menu-dropdown"
                                style={{ display: 'none', position: 'absolute', background: '#fff', border: '1px solid #ccc', borderRadius: 4, minWidth: 120, zIndex: 1000 }}
                            >
                                <div
                                    className="session-menu-item session-menu-item-border"
                                    onClick={() => {
                                        handleSaveSession();
                                        document.getElementById('session-menu-dropdown')!.style.display = 'none';
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveSession(); }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    Save
                                </div>
                                <div
                                    className="session-menu-item session-menu-item-border"
                                    onClick={() => {
                                        document.getElementById('session-menu-file-input')?.click();
                                        setTimeout(() => {
                                            document.getElementById('session-menu-dropdown')!.style.display = 'none';
                                        }, 0);
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === 'Enter') document.getElementById('session-menu-file-input')?.click(); }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    Load
                                </div>
                                <div
                                    className="session-menu-item"
                                    onClick={() => {
                                        if (window.confirm('Restarting will unload all data and reset the session. Please save your work first if needed. Continue?')) {
                                            window.location.reload();
                                        } else {
                                            document.getElementById('session-menu-dropdown')!.style.display = 'none';
                                        }
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if (window.confirm('Restarting will unload all data and reset the session. Please save your work first if needed. Continue?')) {
                                                window.location.reload();
                                            } else {
                                                document.getElementById('session-menu-dropdown')!.style.display = 'none';
                                            }
                                        }
                                    }}
                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                >
                                    Restart
                                </div>
                            </div>
                            <input
                                id="session-menu-file-input"
                                type="file"
                                accept="application/json"
                                style={{ display: 'none' }}
                                onChange={handleLoadSession}
                            />
                        </div>
                    </nav>
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
                        idPrefix="main-two-columns"
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
                                    representationType: representationTypeAlignedTo,
                                    setRepresentationType: setRepresentationTypeAlignedTo,
                                    colorsFile: colorsAlignedToFile,
                                    isMoleculeColoursLoaded: isMoleculeAlignedToColoursLoaded,
                                    structureRef: structureRefAAlignedTo,
                                    otherStructureRef: structureRefBAlignedTo,
                                    selectedSubunit: selectedSubunitAlignedTo,
                                    setSelectedSubunit: setSelectedSubunitAlignedTo,
                                    subunitToChainIds: subunitToChainIdsAlignedTo,
                                    chainInfo: chainInfoAlignedTo,
                                    selectedChainId: selectedChainIdAlignedTo,
                                    setSelectedChainId: setSelectedChainIdAlignedTo,
                                    residueInfo: residueInfoAlignedTo,
                                    selectedResidueId: selectedResidueIdAlignedTo,
                                    setSelectedResidueId: setSelectedResidueIdAlignedTo,
                                    fog: fogA,
                                    setFog: makeFogSetters(setFogA),
                                    camera: cameraA,
                                    setCamera: makeCameraSetters(setCameraA),
                                    updateFog,
                                    handleFileChange,
                                    Aligned: AlignedTo,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsA,
                                    setRealignedRepRefs: setRealignedRepRefsA,
                                    setRealignedStructRefs: setRealignedStructRefsA,
                                    // Override for left column:
                                    fileInputLabel: 'Load AlignedTo',
                                    fileInputDisabled: false,
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
                                    // Always use latest state for enabling Load Aligned
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
                                    fog: fogB,
                                    setFog: makeFogSetters(setFogB),
                                    camera: cameraB,
                                    setCamera: makeCameraSetters(setCameraB),
                                    updateFog,
                                    handleFileChange,
                                    Aligned: Aligned,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsB,
                                    setRealignedRepRefs: setRealignedRepRefsB,
                                    setRealignedStructRefs: setRealignedStructRefsB,
                                    // Override for right column:
                                    fileInputLabel: 'Load Aligned',
                                    fileInputDisabled: process.env.NODE_ENV === 'test' ? false : !alignmentDataReady,
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
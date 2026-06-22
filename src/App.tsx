/**
 * Ribocode App component.
 *
 * Main entry point for the Ribocode web application, providing the primary UI and state management for molecular alignment and visualization.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT. See LICENSE file for more info.
 *
 * @author Copilot, Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-11
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConfirm } from './hooks/useConfirm';
import { SelectionProvider } from './context/SelectionContext';
import { ViewerStateProvider } from './context/ViewerStateContext';
import { SyncProvider } from './context/SyncContext';
import { handleToggle } from './handlers/uiHandlers';
import { useSessionSave } from './hooks/useSessionSave';
import { useSessionSaveAll } from './hooks/useSessionSaveAll';
import { useSessionLoadModal } from './hooks/useSessionLoadModal';
import { useUpdateChainInfo } from './hooks/useUpdateChainInfo';
import { useUpdateResidueInfo } from './hooks/useUpdateResidueInfo';
import { useUpdateColors } from './hooks/useUpdateColors';
import { PluginCommands as MolPluginCommands } from 'molstar/lib/mol-plugin/commands';
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
import { getStructureRepresentations } from './utils/structure';
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
import type { LoadedMolecule, ViewerKey, MoleculeMode } from './types/ribocode';
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

interface SessionRepresentationSpec {
    type: AllowedRepresentationType;
    colorTheme: { name: string; params?: Record<string, unknown> };
    visible: boolean;
}

interface SerializableCameraSnapshot {
    position: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    radius: number;
}

interface SessionUiState {
    zoom?: {
        extraRadius: number;
        minRadius: number;
    };
    selections?: {
        alignedTo?: {
            subunit?: string;
            chainId?: string;
            residueId?: string;
        };
        aligned?: {
            subunit?: string;
            chainId?: string;
            residueId?: string;
        };
    };
    syncEnabled?: boolean;
    activeViewer?: ViewerKey;
    cameraSnapshots?: {
        viewerA?: SerializableCameraSnapshot;
        viewerB?: SerializableCameraSnapshot;
    };
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

    // Use custom confirmation hook
    const confirm = useConfirm();

    // Molecule loading logic extracted to useMoleculeLoader
    // Robust file loading logic for both AlignedTo and Aligned
    const normalizeSessionRepresentation = useCallback((rep: any): SessionRepresentationSpec | null => {
        const typeCandidate = rep?.params?.values?.type?.name ?? rep?.type;
        if (!typeCandidate || !allowedRepresentationTypes.includes(typeCandidate as AllowedRepresentationType)) {
            return null;
        }
        const colorThemeCandidate = rep?.params?.values?.colorTheme ?? rep?.colorTheme;
        if (typeof colorThemeCandidate === 'string') {
            return {
                type: typeCandidate as AllowedRepresentationType,
                colorTheme: { name: colorThemeCandidate, params: {} },
                visible: rep?.visible !== false
            };
        }
        if (colorThemeCandidate && typeof colorThemeCandidate.name === 'string') {
            return {
                type: typeCandidate as AllowedRepresentationType,
                colorTheme: {
                    name: colorThemeCandidate.name,
                    params: colorThemeCandidate.params ?? {}
                },
                visible: rep?.visible !== false
            };
        }
        return {
            type: typeCandidate as AllowedRepresentationType,
            colorTheme: { name: 'default', params: {} },
            visible: rep?.visible !== false
        };
    }, []);

    const serializeRepresentationsForMode = useCallback((
        molstar: ReturnType<typeof useMolstarViewer>,
        pluginRef: React.RefObject<PluginUIContext | null>,
        mode: MoleculeMode
    ): SessionRepresentationSpec[] => {
        const plugin = pluginRef.current;
        const structureRef = molstar.structureRefs[mode];
        if (!plugin || !structureRef) {
            return [];
        }
        const rawReps = getStructureRepresentations(plugin, structureRef);
        const normalized = rawReps
            .map((rep: any) => normalizeSessionRepresentation(rep))
            .filter((rep: SessionRepresentationSpec | null): rep is SessionRepresentationSpec => !!rep);
        console.log(`[serializeRepresentationsForMode] ${mode}: captured ${rawReps.length} reps, normalized to ${normalized.length}:`, normalized.map(r => `${r.type}(${r.visible ? 'visible' : 'hidden'})`).join(', '));
        return normalized;
    }, [normalizeSessionRepresentation]);

    const getSerializableCameraSnapshot = useCallback((viewerRef: React.RefObject<PluginUIContext | null>): SerializableCameraSnapshot | undefined => {
        const snapshot = viewerRef.current?.canvas3d?.camera?.getSnapshot?.();
        if (!snapshot) return undefined;
        const toTuple3 = (value: any): [number, number, number] | null => {
            if (!value || value.length < 3) return null;
            const x = Number(value[0]);
            const y = Number(value[1]);
            const z = Number(value[2]);
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
            return [x, y, z];
        };
        const position = toTuple3(snapshot.position);
        const target = toTuple3(snapshot.target);
        const up = toTuple3(snapshot.up);
        const radius = Number(snapshot.radius);
        if (!position || !target || !up || !Number.isFinite(radius)) return undefined;
        return { position, target, up, radius };
    }, []);

    const applySerializableCameraSnapshot = useCallback((viewerRef: React.RefObject<PluginUIContext | null>, snapshot?: SerializableCameraSnapshot) => {
        if (!snapshot) return;
        const camera = viewerRef.current?.canvas3d?.camera;
        if (!camera || typeof camera.setState !== 'function') return;
        camera.setState({
            ...camera.state,
            position: [...snapshot.position] as any,
            target: [...snapshot.target] as any,
            up: [...snapshot.up] as any,
            radius: snapshot.radius,
        });
        viewerRef.current?.canvas3d?.requestDraw?.();
    }, []);

    const waitForRepresentationRef = useCallback(async (
        molstar: ReturnType<typeof useMolstarViewer>,
        mode: MoleculeMode,
        repId: string,
        timeoutMs = 3000
    ): Promise<string | null> => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            // Use the ref (always current) rather than repIdMap state (stale closure)
            const repRef = molstar.repIdMapRef?.current?.[mode]?.[repId];
            if (repRef) {
                console.log(`[waitForRepresentationRef] Found ref for ${mode}/${repId.substring(0, 6)} after ${Date.now() - start}ms`);
                return repRef;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        console.warn(`[waitForRepresentationRef] Timeout waiting for ref ${mode}/${repId.substring(0, 6)} after ${timeoutMs}ms`);
        return null;
    }, []);

    const setRepresentationVisible = useCallback(async (
        plugin: PluginUIContext | null,
        repRef: string,
        visible: boolean
    ): Promise<void> => {
        if (!plugin) {
            console.warn(`[setRepresentationVisible] Plugin is null for ref ${repRef.substring(repRef.length - 6)}`);
            return;
        }
        const cell = plugin.state.data?.cells?.get?.(repRef);
        if (cell) {
            const isVisible = cell?.state?.isHidden !== true;
            console.log(`[setRepresentationVisible] Ref ${repRef.substring(repRef.length - 6)}: currently ${isVisible ? 'visible' : 'hidden'}, wanting ${visible ? 'visible' : 'hidden'}`);
            if (isVisible === visible) {
                console.log(`[setRepresentationVisible] No change needed for ${repRef.substring(repRef.length - 6)}`);
                return;
            }
        } else {
            console.warn(`[setRepresentationVisible] Cell not found for ref ${repRef.substring(repRef.length - 6)}`);
        }
        console.log(`[setRepresentationVisible] Toggling ${repRef.substring(repRef.length - 6)} to ${visible ? 'visible' : 'hidden'}`);
        await MolPluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
    }, []);

    const restoreSessionRepresentations = useCallback(async (
        mode: MoleculeMode,
        repsA: SessionRepresentationSpec[],
        repsB: SessionRepresentationSpec[],
        refA: string | null,
        refB: string | null,
        pluginA: PluginUIContext | null,
        pluginB: PluginUIContext | null
    ): Promise<void> => {
        console.log(`[restoreSessionRepresentations] Mode=${mode}, repsA=${repsA.length}, repsB=${repsB.length}`);
        const restoreForViewer = async (
            reps: SessionRepresentationSpec[],
            molstar: ReturnType<typeof useMolstarViewer>,
            structureRef: string | null,
            plugin: PluginUIContext | null,
            viewerName: string
        ) => {
            if (!reps.length || !structureRef) {
                console.log(`[restoreForViewer] Skipping ${viewerName}: reps.length=${reps.length}, structureRef=${structureRef ? 'set' : 'null'}`);
                return;
            }
            console.log(`[restoreForViewer] Restoring ${reps.length} reps to ${viewerName}`);

            const existingReps = plugin ? getStructureRepresentations(plugin, structureRef) : [];
            const usedExistingRepRefs = new Set<string>();
            const getColorThemeName = (theme: any): string => {
                if (typeof theme === 'string') return theme;
                return theme?.name ?? 'default';
            };

            for (const rep of reps) {
                const exactMatch = existingReps.find(existing =>
                    !usedExistingRepRefs.has(existing.repRef) &&
                    existing.type === rep.type &&
                    getColorThemeName(existing.colorTheme) === getColorThemeName(rep.colorTheme)
                );
                const typeOnlyMatch = existingReps.find(existing =>
                    !usedExistingRepRefs.has(existing.repRef) &&
                    existing.type === rep.type
                );
                const existingMatch = exactMatch ?? typeOnlyMatch;

                if (existingMatch && plugin) {
                    usedExistingRepRefs.add(existingMatch.repRef);
                    console.log(`[restoreForViewer] Reusing existing ${rep.type} in ${viewerName}`);
                    if (existingMatch.visible !== rep.visible) {
                        await setRepresentationVisible(plugin, existingMatch.repRef, rep.visible);
                    }
                    continue;
                }

                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2));

                await molstar.addRepresentation(mode, structureRef, rep.type, rep.colorTheme, repId);

                if (!rep.visible && plugin) {
                    const repRef = await waitForRepresentationRef(molstar, mode, repId);
                    if (repRef) {
                        console.log(`[restoreForViewer] Hiding ${rep.type} in ${viewerName}`);
                        await setRepresentationVisible(plugin, repRef, false);
                    } else {
                        console.warn(`[restoreForViewer] Failed to find ref for restored ${rep.type} in ${viewerName}`);
                    }
                }
            }
        };

        await restoreForViewer(repsA, molstarA, refA, pluginA, 'Viewer A');
        await restoreForViewer(repsB, molstarB, refB, pluginB, 'Viewer B');
    }, [molstarA, molstarB, setRepresentationVisible, waitForRepresentationRef]);

    const loadMoleculeIntoViewers = async (
        file: File,
        mode: string,
        alignmentData?: any,
        sessionRepresentationsA: SessionRepresentationSpec[] = [],
        sessionRepresentationsB: SessionRepresentationSpec[] = []
    ): Promise<LoadedMolecule | undefined> => {
        const assetFile = Asset.File(file);
        const pluginA = viewerA.ref.current;
        const pluginB = viewerB.ref.current;
        if (!pluginA || !pluginB) {
            console.error('One or both viewers are not initialized.');
            return undefined;
        }
        // Prevent redundant state updates to break infinite update loops
        if (mode === AlignedTo) {
            if (alignedToFile && alignedToFile.name === file.name) {
                // Already loaded, skip
                return viewerA.moleculeAlignedTo as LoadedMolecule | undefined;
            }
            setAlignedToFile(file);
            setAlignedToFilename(file.name);
            if (expectedAlignedToFilename) setExpectedAlignedToFilename(null);
            // Ensure the loader button disappears after upload
            viewerA.setIsMoleculeAlignedToLoaded(true);

            // Load into Viewer A
            const viewerAMoleculeAlignedTo = await loadMoleculeFileToViewer(
                pluginA, assetFile, true, true
            );
            if (!viewerAMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer A.');
                return undefined;
            }
            viewerA.setMoleculeAlignedTo((prev: any) => ({
                label: viewerAMoleculeAlignedTo.label,
                name: viewerAMoleculeAlignedTo.name,
                filename: viewerAMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                presetResult: viewerAMoleculeAlignedTo.presetResult ?? "Unknown",
                trajectory: viewerAMoleculeAlignedTo.trajectory,
                alignmentData: viewerAMoleculeAlignedTo.alignmentData
            }));
            viewerA.setIsMoleculeAlignedToVisible(true);
            let refAAlignedTo: string | null = null;
            const structAAlignedTo = pluginA.managers.structure.hierarchy.current.structures[0];
            if (structAAlignedTo) {
                refAAlignedTo = structAAlignedTo.cell.transform.ref;
                molstarA.setStructureRef(AlignedTo, refAAlignedTo);
            }

            // Load into Viewer B
            const viewerBMoleculeAlignedTo = await loadMoleculeFileToViewer(
                pluginB, assetFile, true, true
            );
            if (!viewerBMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer B.');
                return undefined;
            }
            viewerB.setMoleculeAlignedTo((prev: any) => ({
                label: viewerBMoleculeAlignedTo.label,
                name: viewerBMoleculeAlignedTo.name,
                filename: viewerBMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                presetResult: viewerBMoleculeAlignedTo.presetResult ?? "Unknown",
                trajectory: viewerBMoleculeAlignedTo.trajectory,
                alignmentData: viewerBMoleculeAlignedTo.alignmentData
            }));
            viewerB.setIsMoleculeAlignedToLoaded(true);
            viewerB.setIsMoleculeAlignedToVisible(true);
                let refBAlignedTo: string | null = null;
                const structBAlignedTo = pluginB.managers.structure.hierarchy.current.structures[0];
                if (structBAlignedTo) {
                    refBAlignedTo = structBAlignedTo.cell.transform.ref;
                    molstarB.setStructureRef(AlignedTo, refBAlignedTo);
                }

            await restoreSessionRepresentations(
                AlignedTo,
                sessionRepresentationsA,
                sessionRepresentationsB,
                refAAlignedTo,
                refBAlignedTo,
                pluginA,
                pluginB
            );

            return viewerAMoleculeAlignedTo as LoadedMolecule;

        } else if (mode === Aligned) {
            if (alignedFile && alignedFile.name === file.name) {
                // Already loaded, skip
                return viewerA.moleculeAligned as LoadedMolecule | undefined;
            }
            setAlignedFile(file);
            setAlignedFilename(file.name);
            const alignData = alignmentData ?? viewerA.moleculeAlignedTo?.alignmentData;
            let refAAligned: string | null = null;
            let refBAligned: string | null = null;

            // Load into Viewer A
            const assetFileA = Asset.File(file);
            const pluginA = viewerA.ref.current;
            let viewerAMoleculeAligned = null;
            if (pluginA) {
                viewerAMoleculeAligned = await loadMoleculeFileToViewer(
                    pluginA, assetFileA, false, true, alignData
                );
            }
            if (viewerAMoleculeAligned) {
                viewerA.setMoleculeAligned((prev: any) => ({
                    label: viewerAMoleculeAligned.label,
                    name: viewerAMoleculeAligned.name,
                    filename: viewerAMoleculeAligned.filename ?? file.name,
                    presetResult: viewerAMoleculeAligned.presetResult ?? "Unknown",
                    trajectory: viewerAMoleculeAligned.trajectory,
                    alignmentData: viewerAMoleculeAligned.alignmentData
                }));
                viewerA.setIsMoleculeAlignedLoaded(true);
                viewerA.setIsMoleculeAlignedVisible(true);
                const structAAligned = pluginA?.managers?.structure?.hierarchy?.current?.structures[1]
                    ?? pluginA?.managers?.structure?.hierarchy?.current?.structures[0];
                if (structAAligned) {
                    refAAligned = structAAligned.cell.transform.ref;
                    molstarA.setStructureRef(Aligned, refAAligned);
                }
            }

            // Load into Viewer B and update state/filename for UI
            const assetFileB = Asset.File(file);
            const pluginB = viewerB.ref.current;
            let viewerBMoleculeAligned = null;
            if (pluginB) {
                viewerBMoleculeAligned = await loadMoleculeFileToViewer(
                    pluginB, assetFileB, false, true, alignData
                );
            }
            if (viewerBMoleculeAligned) {
                viewerB.setMoleculeAligned((prev: any) => ({
                    label: viewerBMoleculeAligned.label,
                    name: viewerBMoleculeAligned.name,
                    filename: viewerBMoleculeAligned.filename ?? file.name,
                    presetResult: viewerBMoleculeAligned.presetResult ?? "Unknown",
                    trajectory: viewerBMoleculeAligned.trajectory,
                    alignmentData: viewerBMoleculeAligned.alignmentData
                }));
                viewerB.setIsMoleculeAlignedLoaded(true);
                viewerB.setIsMoleculeAlignedVisible(true);
                setAlignedFilename(file.name); // Ensure filename is set for UI
                const structBAligned = pluginB?.managers?.structure?.hierarchy?.current?.structures[1]
                    ?? pluginB?.managers?.structure?.hierarchy?.current?.structures[0];
                if (structBAligned) {
                    refBAligned = structBAligned.cell.transform.ref;
                    molstarB.setStructureRef(Aligned, refBAligned);
                }

            }

            await restoreSessionRepresentations(
                Aligned,
                sessionRepresentationsA,
                sessionRepresentationsB,
                refAAligned,
                refBAligned,
                pluginA,
                pluginB
            );

            return (viewerAMoleculeAligned ?? viewerBMoleculeAligned ?? undefined) as LoadedMolecule | undefined;
        }

        return undefined;
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
    useUpdateColors(
        viewerB.ref.current,
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
    useUpdateColors(
        viewerB.ref.current,
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
        insCode: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode,
        zoomExtraRadius,
        zoomMinRadius
    });
    const residueZoomAAligned = makeZoomHandler({
        pluginRef: viewerA.ref,
        structureRef: structureRefAAligned,
        property: 'residue-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerB.ref,
        residueId: selectedResidueIdAligned,
        insCode: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode,
        zoomExtraRadius,
        zoomMinRadius
    });
    const residueZoomBAlignedTo = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAlignedTo,
        property: 'residue-test',
        chainId: selectedChainIdAlignedTo,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref,
        residueId: selectedResidueIdAlignedTo,
        insCode: residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode,
        zoomExtraRadius,
        zoomMinRadius
    });
    const residueZoomBAligned = makeZoomHandler({
        pluginRef: viewerB.ref,
        structureRef: structureRefBAligned,
        property: 'residue-test',
        chainId: selectedChainIdAligned,
        sync: syncEnabled,
        syncPluginRef: viewerA.ref,
        residueId: selectedResidueIdAligned,
        insCode: residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode,
        zoomExtraRadius,
        zoomMinRadius
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
            moleculeAlignedTo: viewerA.moleculeAlignedTo
                ? {
                    filename: viewerA.moleculeAlignedTo.filename,
                    alignmentData: viewerA.moleculeAlignedTo.alignmentData,
                    representations: serializeRepresentationsForMode(molstarA, pluginRefA, AlignedTo),
                    // add other serializable fields as needed
                }
                : null,
            moleculeAligned: viewerA.moleculeAligned
                ? {
                    filename: viewerA.moleculeAligned.filename,
                    alignmentData: viewerA.moleculeAligned.alignmentData,
                    representations: serializeRepresentationsForMode(molstarA, pluginRefA, Aligned),
                    // add other serializable fields as needed
                }
                : null,
        },
        viewerB: {
            moleculeAlignedTo: viewerB.moleculeAlignedTo
                ? {
                    filename: viewerB.moleculeAlignedTo.filename,
                    alignmentData: viewerB.moleculeAlignedTo.alignmentData,
                    representations: serializeRepresentationsForMode(molstarB, pluginRefB, AlignedTo),
                }
                : null,
            moleculeAligned: viewerB.moleculeAligned
                ? {
                    filename: viewerB.moleculeAligned.filename,
                    alignmentData: viewerB.moleculeAligned.alignmentData,
                    representations: serializeRepresentationsForMode(molstarB, pluginRefB, Aligned),
                }
                : null,
        },
        uiState: {
            zoom: {
                extraRadius: zoomExtraRadius,
                minRadius: zoomMinRadius,
            },
            selections: {
                alignedTo: {
                    subunit: selectedSubunitAlignedTo,
                    chainId: selectedChainIdAlignedTo,
                    residueId: selectedResidueIdAlignedTo,
                },
                aligned: {
                    subunit: selectedSubunitAligned,
                    chainId: selectedChainIdAligned,
                    residueId: selectedResidueIdAligned,
                },
            },
            syncEnabled,
            activeViewer,
            cameraSnapshots: {
                viewerA: getSerializableCameraSnapshot(viewerA.ref),
                viewerB: getSerializableCameraSnapshot(viewerB.ref),
            },
        } as SessionUiState,
    }));

    const handleSaveSessionAll = useSessionSaveAll(
        () => ({
            viewerA: {
                moleculeAlignedTo: viewerA.moleculeAlignedTo
                    ? {
                        filename: viewerA.moleculeAlignedTo.filename,
                        alignmentData: viewerA.moleculeAlignedTo.alignmentData,
                        representations: serializeRepresentationsForMode(molstarA, pluginRefA, AlignedTo),
                    }
                    : null,
                moleculeAligned: viewerA.moleculeAligned
                    ? {
                        filename: viewerA.moleculeAligned.filename,
                        alignmentData: viewerA.moleculeAligned.alignmentData,
                        representations: serializeRepresentationsForMode(molstarA, pluginRefA, Aligned),
                    }
                    : null,
            },
            viewerB: {
                moleculeAlignedTo: viewerB.moleculeAlignedTo
                    ? {
                        filename: viewerB.moleculeAlignedTo.filename,
                        alignmentData: viewerB.moleculeAlignedTo.alignmentData,
                        representations: serializeRepresentationsForMode(molstarB, pluginRefB, AlignedTo),
                    }
                    : null,
                moleculeAligned: viewerB.moleculeAligned
                    ? {
                        filename: viewerB.moleculeAligned.filename,
                        alignmentData: viewerB.moleculeAligned.alignmentData,
                        representations: serializeRepresentationsForMode(molstarB, pluginRefB, Aligned),
                    }
                    : null,
            },
            uiState: {
                zoom: {
                    extraRadius: zoomExtraRadius,
                    minRadius: zoomMinRadius,
                },
                selections: {
                    alignedTo: {
                        subunit: selectedSubunitAlignedTo,
                        chainId: selectedChainIdAlignedTo,
                        residueId: selectedResidueIdAlignedTo,
                    },
                    aligned: {
                        subunit: selectedSubunitAligned,
                        chainId: selectedChainIdAligned,
                        residueId: selectedResidueIdAligned,
                    },
                },
                syncEnabled,
                activeViewer,
                cameraSnapshots: {
                    viewerA: getSerializableCameraSnapshot(viewerA.ref),
                    viewerB: getSerializableCameraSnapshot(viewerB.ref),
                },
            } as SessionUiState,
        }),
        () => {
            const embeddedFiles: Record<string, File | null | undefined> = {};
            if (alignedToFile?.name) embeddedFiles[alignedToFile.name] = alignedToFile;
            if (alignedFile?.name) embeddedFiles[alignedFile.name] = alignedFile;
            return embeddedFiles;
        }
    );

    // Define the session loaded callback with proper typing and error handling
    const onSessionLoaded = useCallback(async (session: any, files: Record<string, File>) => {
        // Map filenames to semantic keys for compatibility
        const getFilename = (obj: any) => obj && typeof obj.filename === 'string' ? obj.filename : undefined;
        const getRepresentations = (obj: any): SessionRepresentationSpec[] => {
            if (!Array.isArray(obj?.representations)) return [];
            return obj.representations
                .map((rep: any) => normalizeSessionRepresentation(rep))
                .filter((rep: SessionRepresentationSpec | null): rep is SessionRepresentationSpec => !!rep);
        };
        const firstNonEmptyRepresentations = (...sources: any[]): SessionRepresentationSpec[] => {
            for (const src of sources) {
                const reps = getRepresentations(src);
                if (reps.length > 0) return reps;
            }
            return [];
        };
        const alignedToFilename = getFilename(session.viewerA?.alignedTo) || getFilename(session.viewerA?.moleculeAlignedTo);
        const alignedFilename = getFilename(session.viewerB?.aligned) || getFilename(session.viewerB?.moleculeAligned);
        // Fallback: try viewerB.alignedTo or viewerA.aligned
        const altAlignedToFilename = getFilename(session.viewerB?.alignedTo) || getFilename(session.viewerB?.moleculeAlignedTo);
        const altAlignedFilename = getFilename(session.viewerA?.aligned) || getFilename(session.viewerA?.moleculeAligned);
        const alignedToRepresentationsA = firstNonEmptyRepresentations(
            session.viewerA?.alignedTo,
            session.viewerA?.moleculeAlignedTo,
            session.viewerB?.alignedTo,
            session.viewerB?.moleculeAlignedTo
        );
        const alignedToRepresentationsB = firstNonEmptyRepresentations(
            session.viewerB?.alignedTo,
            session.viewerB?.moleculeAlignedTo,
            session.viewerA?.alignedTo,
            session.viewerA?.moleculeAlignedTo
        );
        const alignedRepresentationsA = firstNonEmptyRepresentations(
            session.viewerA?.aligned,
            session.viewerA?.moleculeAligned,
            session.viewerB?.aligned,
            session.viewerB?.moleculeAligned
        );
        const alignedRepresentationsB = firstNonEmptyRepresentations(
            session.viewerB?.aligned,
            session.viewerB?.moleculeAligned,
            session.viewerA?.aligned,
            session.viewerA?.moleculeAligned
        );

        // Try to get the files by filename
        const alignedToFile = (alignedToFilename && files[alignedToFilename]) || (altAlignedToFilename && files[altAlignedToFilename]);
        const alignedFile = (alignedFilename && files[alignedFilename]) || (altAlignedFilename && files[altAlignedFilename]);

        let loadedAny = false;
        try {
            if (alignedToFile) {
                const alignedToMolecule = await loadMoleculeIntoViewers(
                    alignedToFile,
                    AlignedTo,
                    undefined,
                    alignedToRepresentationsA,
                    alignedToRepresentationsB
                ) as LoadedMolecule | undefined;
                loadedAny = true;
                if (alignedFile) {
                    const restoredAlignmentData = alignedToMolecule?.alignmentData ?? alignmentDataRef.current;
                    // Defensive runtime check for alignmentData
                    if (!restoredAlignmentData) {
                        alert('AlignedTo alignment data not available after load. Cannot load Aligned file.');
                    } else {
                        await loadMoleculeIntoViewers(
                            alignedFile,
                            Aligned,
                            restoredAlignmentData,
                            alignedRepresentationsA,
                            alignedRepresentationsB
                        );
                    }
                }
            } else if (alignedFile) {
                await loadMoleculeIntoViewers(
                    alignedFile,
                    Aligned,
                    undefined,
                    alignedRepresentationsA,
                    alignedRepresentationsB
                );
                loadedAny = true;
            }
            const uiState = session?.uiState as SessionUiState | undefined;
            if (uiState?.zoom) {
                if (Number.isFinite(uiState.zoom.extraRadius)) setZoomExtraRadius(uiState.zoom.extraRadius);
                if (Number.isFinite(uiState.zoom.minRadius)) setZoomMinRadius(uiState.zoom.minRadius);
            }
            if (uiState?.selections?.alignedTo) {
                if (typeof uiState.selections.alignedTo.subunit === 'string') setSelectedSubunitAlignedTo(uiState.selections.alignedTo.subunit as any);
                if (typeof uiState.selections.alignedTo.chainId === 'string') setSelectedChainIdAlignedTo(uiState.selections.alignedTo.chainId);
                if (typeof uiState.selections.alignedTo.residueId === 'string') setSelectedResidueIdAlignedTo(uiState.selections.alignedTo.residueId);
            }
            if (uiState?.selections?.aligned) {
                if (typeof uiState.selections.aligned.subunit === 'string') setSelectedSubunitAligned(uiState.selections.aligned.subunit as any);
                if (typeof uiState.selections.aligned.chainId === 'string') setSelectedChainIdAligned(uiState.selections.aligned.chainId);
                if (typeof uiState.selections.aligned.residueId === 'string') setSelectedResidueIdAligned(uiState.selections.aligned.residueId);
            }
            if (typeof uiState?.syncEnabled === 'boolean') {
                setSyncEnabled(uiState.syncEnabled);
            }
            if (uiState?.activeViewer === A || uiState?.activeViewer === B) {
                setActiveViewer(uiState.activeViewer);
            }
            if (uiState?.cameraSnapshots) {
                applySerializableCameraSnapshot(viewerA.ref, uiState.cameraSnapshots.viewerA);
                applySerializableCameraSnapshot(viewerB.ref, uiState.cameraSnapshots.viewerB);
            }

            if (!loadedAny) {
                alert('Session loaded, but could not automatically reload datasets. Please reload the required files manually.');
            }
        } catch (e) {
            alert('Error loading session: ' + (e instanceof Error ? e.message : String(e)));
        }
    }, [
        loadMoleculeIntoViewers,
        normalizeSessionRepresentation,
        applySerializableCameraSnapshot,
        setSelectedSubunitAlignedTo,
        setSelectedSubunitAligned,
        setSelectedChainIdAlignedTo,
        setSelectedChainIdAligned,
        setSelectedResidueIdAlignedTo,
        setSelectedResidueIdAligned,
    ]);

    // Initialize session load modal with the callback
    const { handleLoadSession, handleLoadAllSession, SessionLoadModal } = useSessionLoadModal(onSessionLoaded);

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
                                    if (menu) {
                                        const willOpen = menu.style.display !== 'block';
                                        menu.style.display = willOpen ? 'block' : 'none';
                                        console.log(`[SessionMenu] Menu ${willOpen ? 'opened' : 'closed'} by button click`);
                                    }
                                }}
                                onBlur={e => {
                                    if (process.env.NODE_ENV !== 'test') {
                                        setTimeout(() => {
                                            const menu = document.getElementById('session-menu-dropdown');
                                            if (menu) {
                                                menu.style.display = 'none';
                                                console.log('[SessionMenu] Menu closed by blur');
                                            }
                                        }, 150);
                                    }
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
                                        void handleSaveSessionAll();
                                        document.getElementById('session-menu-dropdown')!.style.display = 'none';
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveSessionAll(); }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    Save All
                                </div>
                                <div
                                    className="session-menu-item session-menu-item-border"
                                    onClick={() => {
                                        console.log('[SessionMenu] Load menu item clicked');
                                        if (confirm('Loading a session will unload all current data and replace the session. Please save your work first if needed. Continue?')) {
                                            console.log('[SessionMenu] Triggering file input for session load');
                                            document.getElementById('session-menu-file-input')?.click();
                                        }
                                        setTimeout(() => {
                                            const dropdown = document.getElementById('session-menu-dropdown');
                                            if (dropdown) dropdown.style.display = 'none';
                                        }, 0);
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            console.log('[SessionMenu] Load menu item activated by Enter key');
                                            if (confirm('Loading a session will unload all current data and replace the session. Please save your work first if needed. Continue?')) {
                                                console.log('[SessionMenu] Triggering file input for session load (Enter)');
                                                document.getElementById('session-menu-file-input')?.click();
                                            }
                                            setTimeout(() => {
                                                const dropdown = document.getElementById('session-menu-dropdown');
                                                if (dropdown) dropdown.style.display = 'none';
                                            }, 0);
                                        }
                                    }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    Load
                                </div>
                                <div
                                    className="session-menu-item session-menu-item-border"
                                    onClick={() => {
                                        console.log('[SessionMenu] Load All menu item clicked');
                                        if (confirm('Loading a session will unload all current data and replace the session. Please save your work first if needed. Continue?')) {
                                            console.log('[SessionMenu] Triggering file input for session load all');
                                            document.getElementById('session-menu-file-input-all')?.click();
                                        }
                                        setTimeout(() => {
                                            const dropdown = document.getElementById('session-menu-dropdown');
                                            if (dropdown) dropdown.style.display = 'none';
                                        }, 0);
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            console.log('[SessionMenu] Load All menu item activated by Enter key');
                                            if (confirm('Loading a session will unload all current data and replace the session. Please save your work first if needed. Continue?')) {
                                                console.log('[SessionMenu] Triggering file input for session load all (Enter)');
                                                document.getElementById('session-menu-file-input-all')?.click();
                                            }
                                            setTimeout(() => {
                                                const dropdown = document.getElementById('session-menu-dropdown');
                                                if (dropdown) dropdown.style.display = 'none';
                                            }, 0);
                                        }
                                    }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    Load All
                                </div>
                                <div
                                    className="session-menu-item"
                                    onClick={() => {
                                        if (confirm('Restarting will unload all data and reset the session. Please save your work first if needed. Continue?')) {
                                            window.location.reload();
                                        } else {
                                            const dropdown = document.getElementById('session-menu-dropdown');
                                            if (dropdown) dropdown.style.display = 'none';
                                        }
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if (confirm('Restarting will unload all data and reset the session. Please save your work first if needed. Continue?')) {
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
                                onChange={e => {
                                    console.log('[SessionMenu] File input changed (session load)');
                                    handleLoadSession(e);
                                }}
                            />
                            <input
                                id="session-menu-file-input-all"
                                type="file"
                                accept="application/json"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    console.log('[SessionMenu] File input changed (session load all)');
                                    handleLoadAllSession(e);
                                }}
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
                        syncDisabled={!viewerA.isMoleculeAlignedLoaded || !viewerB.isMoleculeAlignedLoaded}
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
                                loadDataRowPropsAlignedTo={getLoadDataRowProps({
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
                                    fileInputLabel: 'Load AlignedTo',
                                    fileInputDisabled: false,
                                })}
                                loadDataRowPropsAligned={getLoadDataRowProps({
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
                                    fog: fogA,
                                    setFog: makeFogSetters(setFogA),
                                    camera: cameraA,
                                    setCamera: makeCameraSetters(setCameraA),
                                    updateFog,
                                    handleFileChange,
                                    Aligned: Aligned,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsA,
                                    setRealignedRepRefs: setRealignedRepRefsA,
                                    setRealignedStructRefs: setRealignedStructRefsA,
                                    fileInputLabel: 'Load Aligned',
                                    fileInputDisabled: !viewerA.isMoleculeAlignedToLoaded,
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
                                loadDataRowPropsAlignedTo={getLoadDataRowProps({
                                    viewer: viewerB,
                                    otherViewer: viewerA,
                                    molstar: molstarB,
                                    otherMolstar: molstarA,
                                    realignedStructRefs: realignedStructRefsB,
                                    otherRealignedStructRefs: realignedStructRefsA,
                                    isMoleculeAlignedLoaded: false, // Only matters for Aligned loader
                                    isMoleculeAlignedToLoaded: viewerB.isMoleculeAlignedToLoaded, // Only matters for AlignedTo loader
                                    viewerReady: viewerBReady,
                                    otherViewerReady: viewerAReady,
                                    representationType: representationTypeAlignedTo,
                                    setRepresentationType: setRepresentationTypeAlignedTo,
                                    colorsFile: colorsAlignedToFile,
                                    isMoleculeColoursLoaded: isMoleculeAlignedToColoursLoaded,
                                    structureRef: structureRefBAlignedTo,
                                    otherStructureRef: structureRefAAlignedTo,
                                    selectedSubunit: selectedSubunitAlignedTo,
                                    setSelectedSubunit: setSelectedSubunitAlignedTo,
                                    subunitToChainIds: subunitToChainIdsAlignedTo,
                                    chainInfo: chainInfoAlignedTo,
                                    selectedChainId: selectedChainIdAlignedTo,
                                    setSelectedChainId: setSelectedChainIdAlignedTo,
                                    residueInfo: residueInfoAlignedTo,
                                    selectedResidueId: selectedResidueIdAlignedTo,
                                    setSelectedResidueId: setSelectedResidueIdAlignedTo,
                                    fog: fogB,
                                    setFog: makeFogSetters(setFogB),
                                    camera: cameraB,
                                    setCamera: makeCameraSetters(setCameraB),
                                    updateFog,
                                    handleFileChange,
                                    Aligned: AlignedTo,
                                    allowedRepresentationTypes,
                                    syncEnabled,
                                    realignedRepRefs: realignedRepRefsB,
                                    setRealignedRepRefs: setRealignedRepRefsB,
                                    setRealignedStructRefs: setRealignedStructRefsB,
                                    fileInputLabel: 'Load AlignedTo',
                                    fileInputDisabled: false,
                                })}
                                loadDataRowPropsAligned={getLoadDataRowProps({
                                    viewer: viewerB,
                                    otherViewer: viewerA,
                                    molstar: molstarB,
                                    otherMolstar: molstarA,
                                    realignedStructRefs: realignedStructRefsB,
                                    otherRealignedStructRefs: realignedStructRefsA,
                                    isMoleculeAlignedLoaded: !!(viewerB.moleculeAligned && viewerB.moleculeAligned.filename),
                                    isMoleculeAlignedToLoaded: viewerB.isMoleculeAlignedToLoaded,
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
                                    fileInputLabel: 'Load Aligned',
                                    fileInputDisabled: !viewerB.isMoleculeAlignedToLoaded,
                                    // Ensure loadedFilename is always passed explicitly for Aligned
                                    loadedFilename: viewerB.moleculeAligned?.filename || viewerB.moleculeAligned?.name || viewerB.moleculeAligned?.label || '',
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
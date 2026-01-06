/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MoleculeMode, AlignedTo, Aligned, ReAligned } from './types/molecule';
import { parseColorFileContent, registerThemeIfNeeded } from './utils/colors';
import { getAtomDataFromStructureUnits } from './utils/data';
import { parseDictionaryFileContent } from './utils/dictionary';
import { ResidueLabelInfo } from './utils/residue';
import { RibosomeSubunitType, getSubunitToChainIds } from './utils/subunit';
import RepresentationSelectButton, { allowedRepresentationTypes, AllowedRepresentationType } from './components/buttons/select/Representation';
import SyncButton from './components/buttons/Sync';
import LoadDataRow from './components/LoadMolecule';
import MoleculeUI from './components/Molecule';
import MolstarContainer from './components/MolstarContainer';
import { SyncProvider } from './context/SyncContext';
import { toggleVisibility, ViewerKey, ViewerState } from './components/RibocodeViewer';
import { useMolstarViewer } from './hooks/useMolstarViewer';
import { loadMoleculeFileToViewer, Molecule } from 'molstar/lib/extensions/ribocode/structure';
import { alignDatasetUsingChains } from 'molstar/lib/extensions/ribocode/utils/geometry';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
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
    /**
     * Custom hook to manage viewer state.
     * @param viewerKey The key identifying the viewer ('A' or 'B').
     * @returns The viewer state object.
     */
    function useViewerState(viewerKey: ViewerKey): ViewerState {
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
            moleculeAlignedTo: moleculeAlignedTo,
            setMoleculeAlignedTo: setMoleculeAlignedTo,
            moleculeAligned: moleculeAligned,
            setMoleculeAligned: setMoleculeAligned,
            isMoleculeAlignedToLoaded: isMoleculeAlignedToLoaded,
            setIsMoleculeAlignedToLoaded: setIsMoleculeAlignedToLoaded,
            isMoleculeAlignedLoaded: isMoleculeAlignedLoaded,
            setIsMoleculeAlignedLoaded: setIsMoleculeAlignedLoaded,
            isMoleculeAlignedToVisible: isMoleculeAlignedToVisible,
            setIsMoleculeAlignedToVisible: setIsMoleculeAlignedToVisible,
            isMoleculeAlignedVisible: isMoleculeAlignedVisible,
            setIsMoleculeAlignedVisible: setIsMoleculeAlignedVisible,
            ref: ref,
            fileInputRef: fileInputRef,
            handleFileInputButtonClick: handleFileInputButtonClick,
            setViewerRef: setViewerRef,
            viewerKey: viewerKey
        };
    }

    /**
     * Generic file input hook.
     * @param parseFn Function to parse file content.
     * @param initialValue Initial value for the data state.
     * @returns An object containing data, setData, inputRef, handleButtonClick, and handleFileChange.
     */
    function useFileInput<T>(
        parseFn: (text: string, file: File) => Promise<T>,
        initialValue: T
    ) {
        // State and refs for file input handling.
        const [data, setData] = useState<T>(initialValue);
        const inputRef = useRef<HTMLInputElement>(null);
        // Handlers for button click and file change.
        const handleButtonClick = () => {
            inputRef.current?.click();
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const text = reader.result as string;
                    const parsed = await parseFn(text, file); // Pass both text and file
                    setData(parsed);
                    console.log('data:', parsed);
                };
                reader.readAsText(file);
            }
        };
        return { data, setData, inputRef, handleButtonClick, handleFileChange };
    }

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
    // Add state for subunitToChainIds
    const [subunitToChainIdsAlignedTo, setSubunitToChainIdsAlignedTo] = useState<Map<RibosomeSubunitType, Set<string>>>(new Map([
        ['All', new Set()],
        ['Large', new Set()],
        ['Small', new Set()],
        ['Other', new Set()],
    ]));
    const [selectedSubunitAlignedTo, setSelectedSubunitAlignedTo] = useState<RibosomeSubunitType>('All');
    const [subunitToChainIdsAligned, setSubunitToChainIdsAligned] = useState<Map<RibosomeSubunitType, Set<string>>>(new Map([
        ['All', new Set()],
        ['Large', new Set()],
        ['Small', new Set()],
        ['Other', new Set()],
    ]));
    const [selectedSubunitAligned, setSelectedSubunitAligned] = useState<RibosomeSubunitType>('All');
    // Chain ID selection state.
    const [chainInfoAlignedTo, setChainInfoAlignedTo] = useState<{
        chainLabels: Map<string, string>;
    }>({ chainLabels: new Map() });
    const [selectedChainIdAlignedTo, setSelectedChainIdAlignedTo] = useState<string>('');
    const [chainInfoAligned, setChainInfoAligned] = useState<{
        chainLabels: Map<string, string>;
    }>({ chainLabels: new Map() });
    const [selectedChainIdAligned, setSelectedChainIdAligned] = useState<string>('');
    // Residue ID selection state.
    const [residueInfoAlignedTo, setResidueInfoAlignedTo] = useState<{
        residueLabels: Map<string, ResidueLabelInfo>;
        residueToAtomIds: Record<string, string[]>;
    }>({ residueLabels: new Map(), residueToAtomIds: {} });
    const [selectedResidueIdAlignedTo, setSelectedResidueIdAlignedTo] = useState<string>('');
    const [residueInfoAligned, setResidueInfoAligned] = useState<{
        residueLabels: Map<string, ResidueLabelInfo>;
        residueToAtomIds: Record<string, string[]>;
    }>({ residueLabels: new Map(), residueToAtomIds: {} });
    const [selectedResidueIdAligned, setSelectedResidueIdAligned] = useState<string>('');

    /**
     * Generalized utility to load molecule into both viewers
     * @param file The file to load.
     * @param mode The file change mode ('AlignedTo' or 'Aligned').
     * @param alignmentData Optional alignment data for aligned molecules.
     * @returns Promise that resolves when loading is complete.
     */
    const loadMoleculeIntoViewers = async (file: File, mode: MoleculeMode, alignmentData?: AlignmentData) => {
        const assetFile = Asset.File(new File([file], file.name));
        const pluginA = viewerA.ref.current!;
        const pluginB = viewerB.ref.current!;
        if (mode === AlignedTo) {
            // Viewer A
            const viewerAMoleculeAlignedTo = await loadMoleculeFileToViewer(
                pluginA, assetFile, true, true
            );
            if (!viewerAMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer A.');
                return;
            }
            viewerA.setMoleculeAlignedTo(prev => ({
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
            const viewerBMoleculeAlignedTo: Molecule | undefined = await loadMoleculeFileToViewer(
                pluginB, assetFile, false, true
            );
            if (!viewerBMoleculeAlignedTo) {
                console.error('Failed to load molecule into viewer B.');
                return;
            }
            viewerB.setMoleculeAlignedTo(prev => ({
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
            // Require alignedTo data to be loaded
            if (!viewerA.moleculeAlignedTo?.alignmentData) {
                console.error(AlignedTo + ' molecule must be loaded before loading aligned molecule.');
                return;
            }
            setAlignedFile(file); // Store File for reloads
            const alignData = alignmentData ?? viewerA.moleculeAlignedTo.alignmentData;
            // Viewer A
            const viewerAMoleculeAligned: Molecule | undefined = await loadMoleculeFileToViewer(
                pluginA, assetFile, false, true, alignData
            );
            if (!viewerAMoleculeAligned) {
                console.error('Failed to load molecule into viewer A.');
                return;
            }
            viewerA.setMoleculeAligned(prev => ({
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
            const viewerBMoleculeAligned: Molecule | undefined = await loadMoleculeFileToViewer(
                pluginB, assetFile, false, true, alignData
            );
            if (!viewerBMoleculeAligned) {
                console.error('Failed to load molecule into viewer B.');
                return;
            }
            viewerB.setMoleculeAligned(prev => ({
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
        } else if (mode === ReAligned) {
            // Require alignedTo data to be loaded
            if (!viewerA.moleculeAlignedTo?.alignmentData) {
                console.error(AlignedTo + ' molecule must be loaded before loading realigned molecule.');
                return;
            }
            const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
            const label = `Re-aligned: ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`;
            // Load in Viewer A
            const molA = await loadMoleculeFileToViewer(pluginA, assetFile, false, true, alignmentData);
            let structRefA = null;
            if (pluginA.managers.structure.hierarchy.current.structures.length > 0) {
                structRefA = pluginA.managers.structure.hierarchy.current.structures.at(-1)?.cell?.transform.ref;
            }
            if (structRefA) {
                molstarA.setStructureRef(id, structRefA);
                // Always refresh representation refs after structure load
                molstarA.refreshRepresentationRefs(id, structRefA);
                setTimeout(() => {
                    setRealignedRepRefsA(prev => ({ ...prev, [id]: molstarA.representationRefs[id] || [] }));
                }, 500);
                setRealignedStructRefsA(prev => ({ ...prev, [id]: structRefA }));
            }
            setRealignedMoleculesA(prev => [...prev, { id, file: file, label, from: selectedChainIdAlignedTo, to: selectedChainIdAligned }]);
            // Load in Viewer B
            const molB = await loadMoleculeFileToViewer(pluginB, assetFile, false, true, alignmentData);
            let structRefB = null;
            if (pluginB.managers.structure.hierarchy.current.structures.length > 0) {
                structRefB = pluginB.managers.structure.hierarchy.current.structures.at(-1)?.cell?.transform.ref;
            }
            if (structRefB) {
                molstarB.setStructureRef(id, structRefB);
                molstarB.refreshRepresentationRefs(id, structRefB);
                setTimeout(() => {
                    setRealignedRepRefsB(prev => ({ ...prev, [id]: molstarB.representationRefs[id] || [] }));
                }, 500);
                setRealignedStructRefsB(prev => ({ ...prev, [id]: structRefB }));
            }
            setRealignedMoleculesB(prev => [...prev, { id, file: file, label, from: selectedChainIdAlignedTo, to: selectedChainIdAligned }]);
            console.log('Realignment added to Viewer A and B models.');
        }
    };

    // Handle file changes for molecule loading.
    const handleFileChange = useCallback(
        async (
            e: React.ChangeEvent<HTMLInputElement>,
            mode: MoleculeMode
        ) => {
            const pluginA = viewerA.ref.current;
            const pluginB = viewerB.ref.current;
            if (!pluginA || !pluginB) {
                console.error('One or both viewers are not initialized.');
                return;
            }
            try {
                const file = e.target.files?.[0];
                if (!file) return;
                await loadMoleculeIntoViewers(file, mode, undefined);
            } catch (err) {
                console.error('Error loading molecule:', err);
            }
        },
        [viewerA, viewerB]
    );

    // Fog control state and updater

    // Fog state for each dataset (shared between viewers)
    const [fogAEnabled, setFogAEnabled] = useState(true);
    const [fogANear, setFogANear] = useState(0.5);
    const [fogAFar, setFogAFar] = useState(2.0);
    const [fogBEnabled, setFogBEnabled] = useState(true);
    const [fogBNear, setFogBNear] = useState(0.5);
    const [fogBFar, setFogBFar] = useState(2.0);
    
    // Helper to update fog in both viewers for a dataset
    const updateFog = useCallback((pluginA: any, pluginB: any, enabled: any, near: any, far: any, cameraNear: any, cameraFar: any) => {
        const fogProps = { camera: { fog: enabled, fogNear: near, fogFar: far, near: cameraNear, far: cameraFar } };
        [pluginA, pluginB].forEach((plugin, idx) => {
            if (plugin?.canvas3d) {
                plugin.canvas3d.setProps(fogProps);
                // Try to set camera near/far directly if possible
                if (plugin.canvas3d.camera) {
                    if (typeof plugin.canvas3d.camera.near === 'number') plugin.canvas3d.camera.near = cameraNear;
                    if (typeof plugin.canvas3d.camera.far === 'number') plugin.canvas3d.camera.far = cameraFar;
                    if (typeof plugin.canvas3d.camera.updateProjectionMatrix === 'function') plugin.canvas3d.camera.updateProjectionMatrix();
                }
                // Force redraw
                if (typeof plugin.canvas3d.requestDraw === 'function') plugin.canvas3d.requestDraw();
                // Log camera parameters for debugging
                const camProps = plugin.canvas3d.props?.camera;
                let camNear = undefined, camFar = undefined;
                if (plugin.canvas3d.camera) {
                    camNear = plugin.canvas3d.camera.near;
                    camFar = plugin.canvas3d.camera.far;
                }
                console.log(`[updateFog] Viewer ${idx === 0 ? 'A' : 'B'} camera props:`, camProps, 'actual near:', camNear, 'actual far:', camFar);
            }
        });
    }, []);
    // State for zoom-to-residue options
    const [zoomExtraRadius, setZoomExtraRadius] = useState<number>(20);
    const [zoomMinRadius, setZoomMinRadius] = useState<number>(16);

    // Camera near/far state for each dataset
    const [cameraANear, setCameraANear] = useState(0.1);
    const [cameraAFar, setCameraAFar] = useState(100);
    const [cameraBNear, setCameraBNear] = useState(0.1);
    const [cameraBFar, setCameraBFar] = useState(100);

    /**
     * Handle toggling visibility of a molecule.
     * @param viewer The viewer state.
     * @param moleculeKey The key of the molecule to toggle.
     * @param setVisible The setter function for visibility state.
     * @param isVisible The current visibility state.
     */
    async function handleToggle(viewer: any, moleculeKey: string, setVisible: (v: boolean) => void, isVisible: boolean) {
        const molecule = viewer[moleculeKey];
        const model = molecule?.presetResult && (molecule.presetResult as any).model;
        if (model) {
            await toggleVisibility(viewer, model);
            setVisible(!isVisible);
        }
    }

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
    function useUpdateColors(
        colorFileData: Array<Record<string, string>>,
        setIsColorsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
        themeName: string,
        deps: any[]
    ) {
        useEffect(() => {
            if (colorFileData && colorFileData.length > 0) {
                setIsColorsLoaded(true);
                // Build and set the chain color map before registering the theme
                const themeChainColorMap = new Map<string, Color>();
                colorFileData.forEach(row => {
                    if (row.pdb_chain && row.color) {
                        try {
                            themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                        } catch {
                            console.warn(`Invalid color: ${row.color}`);
                        }
                    }
                });
                chainColorMaps.set(themeName, themeChainColorMap);
                // Register the custom theme on both plugins before updating representations
                if (viewerA.ref.current) {
                    registerThemeIfNeeded(viewerA.ref.current, themeName, chainColorMaps);
                }
                if (viewerB.ref.current) {
                    registerThemeIfNeeded(viewerB.ref.current, themeName, chainColorMaps);
                }
                // Do not update representations here; only register the theme and set color map
            }
        }, [colorFileData, setIsColorsLoaded, themeName, ...deps]);
    }

    // Use the reusable effect for both color sets
    useUpdateColors(
        colorsAlignedToFile.data,
        setIsMoleculeAlignedToColoursLoaded,
        themeNameAlignedTo,
        [viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo, representationTypeAlignedTo, structureRefAAlignedTo, structureRefBAlignedTo]
    );
    useUpdateColors(
        colorsAlignedFile.data,
        setIsMoleculeAlignedColoursLoaded,
        themeNameAligned,
        [viewerA.moleculeAligned, viewerB.moleculeAligned, representationTypeAligned, structureRefAAligned, structureRefBAligned]
    );

    /**
     * Reusable effect for updating chain IDs.
     * @param pluginRef The plugin ref (viewerA.ref or viewerB.ref).
     * @param structureRef The structure ref to get chain IDs from.
     * @param molstar The molstar viewer hook instance.
     * @param setChainInfo Function to set the chain IDs state.
     * @param label Label for logging purposes.
     * @param deps Additional dependencies for the effect.
     */
    function useUpdateChainInfo(
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        molstar: ReturnType<typeof useMolstarViewer>,
        setChainInfo: React.Dispatch<React.SetStateAction<{ chainLabels: Map<string, string>; }>>,
        setSubunitToChainIds: React.Dispatch<React.SetStateAction<Map<RibosomeSubunitType, Set<string>>>>,
        label: string
    ) {
        useEffect(() => {
            console.log(`Updating chain IDs for ${label}`);
            const plugin = pluginRef.current;
            if (!plugin || !structureRef) return;
            const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
                s => s.cell.transform.ref === structureRef
            )?.cell.obj?.data;
            if (!structureObj) return;
            setChainInfo(molstar.getChainInfo(structureObj));
            // Compute subunitToChainIds for this structureObj
            const subunitMap = getSubunitToChainIds(structureObj).subunitToChainIds;
            console.log(`[Subunit Debug] subunitToChainIds for ${label}:`, subunitMap);
            for (const [subunit, ids] of subunitMap.entries()) {
                console.log(`[Subunit Debug] ${subunit}:`, Array.from(ids));
            }
            setSubunitToChainIds(subunitMap);
        }, [pluginRef, structureRef, label]);
    }

    // Use useUpdateChainInfo for both viewers
    useUpdateChainInfo(viewerA.ref, structureRefAAlignedTo, molstarA,
        setChainInfoAlignedTo, setSubunitToChainIdsAlignedTo, AlignedTo);
    useUpdateChainInfo(viewerB.ref, structureRefBAligned, molstarB,
        setChainInfoAligned, setSubunitToChainIdsAligned, Aligned);

    // Generalized effect for residue ID selection
    function useUpdateResidueInfo(
        viewerRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        molstar: ReturnType<typeof useMolstarViewer>,
        selectedChainId: string,
        setResidueInfo: React.Dispatch<React.SetStateAction<{ residueLabels: Map<string, ResidueLabelInfo>; residueToAtomIds: Record<string, string[]> }>>,
        selectedResidueId: string,
        setSelectedResidueId: React.Dispatch<React.SetStateAction<string>>,
        label: string
    ) {
        useEffect(() => {
            // Only update residue IDs when a chain is selected
            if (!selectedChainId) {
                setResidueInfo({ residueLabels: new Map(), residueToAtomIds: {} });
                setSelectedResidueId('');
                return;
            }
            console.log(`Updating Residue IDs for ${label}, chain:`, selectedChainId);
            const plugin = viewerRef.current;
            if (!plugin) return;
            const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
                s => s.cell.transform.ref === structureRef
            )?.cell.obj?.data;
            if (!structureObj) return;
            // Filter residue IDs to only those in the selected chain
            const residueInfo = molstar.getResidueInfo(structureObj, selectedChainId);
            setResidueInfo(residueInfo);
            // Reset selected residue if not in new list
            if (!residueInfo.residueLabels.has(selectedResidueId)) {
                setSelectedResidueId('');
            }
        }, [viewerRef, structureRef, selectedChainId]);
    }

    // Use useUpdateResidueIds
    // viewerA AlignedTo
    useUpdateResidueInfo(
        viewerA.ref,
        structureRefAAlignedTo,
        molstarA,
        selectedChainIdAlignedTo,
        setResidueInfoAlignedTo,
        selectedResidueIdAlignedTo,
        setSelectedResidueIdAlignedTo,
        AlignedTo
    );
    // viewerB Aligned
    useUpdateResidueInfo(
        viewerB.ref,
        structureRefBAligned,
        molstarB,
        selectedChainIdAligned,
        setResidueInfoAligned,
        selectedResidueIdAligned,
        setSelectedResidueIdAligned,
        Aligned
    );

    // --- Shared chain/residue loci and focus utilities ---
    /**
     * Get the loci for a given chain in a structure.
     */
    function getChainLoci(plugin: PluginUIContext, structureRef: string, chainId: string) {
        const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRef
        )?.cell.obj?.data;
        if (!structureObj) return null;
        const qb = MolScriptBuilder.struct.generator.atomGroups({
            'chain-test': MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                chainId
            ])
        });
        const compiled = compile(qb);
        const ctx = new QueryContext(structureObj);
        const selection = compiled(ctx);
        return StructureSelection.toLociWithSourceUnits(selection);
    }

    /**
     * Focus the camera on a chain loci, with optional sync to another plugin.
     */
    function focusLociOnChain(
        plugin: PluginUIContext,
        structureRef: string,
        chainId: string,
        syncPlugin?: PluginUIContext
    ) {
        const loci = getChainLoci(plugin, structureRef, chainId);
        if (!loci) return;
        plugin.managers.camera.focusLoci(loci);
        if (syncPlugin) {
            syncPlugin.managers.camera.focusLoci(loci);
        }
    }

    /**
     * Get the loci for a given residue in a chain.
     * Enhanced to allow optional insertion code for precise selection.
     * @param plugin The Mol* plugin instance.
     * @param structureRef The structure reference.
     * @param chainId The chain identifier.
     * @param residueId The residue identifier.
     * @param insCode Optional insertion code for the residue.
     * @returns The loci for the specified residue, or null if not found.
     */
    function getResidueLoci(
        plugin: PluginUIContext,
        structureRef: string,
        chainId: string,
        residueId: string,
        insCode?: string
    ) {
        const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRef
        )?.cell.obj?.data;
        if (!structureObj) return null;
        // Build query with optional insertion code
        const parsedResidueId = (typeof residueId === 'string' && !isNaN(Number(residueId))) ? Number(residueId) : residueId;
        const tests: any = {
            'chain-test': MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                chainId
            ]),
            'residue-test': MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
                parsedResidueId
            ])
        };
        if (typeof insCode === 'string' && insCode.length > 0) {
            tests['inscode-test'] = MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.pdbx_PDB_ins_code(),
                insCode
            ]);
        }
        //console.log('[getResidueLoci] Query params:', { chainId, residueId, insCode });
        const qb = MolScriptBuilder.struct.generator.atomGroups(tests);
        const compiled = compile(qb);
        const ctx = new QueryContext(structureObj);
        const selection = compiled(ctx);
        // DEBUG: Log all auth_asym_id and auth_seq_id for the selected chain
        try {
            if (structureObj && structureObj.units) {
                let found = false;
                for (const unit of structureObj.units) {
                    if (unit.kind !== 0) continue; // Only atomic units
                    const { chainIndex, residueIndex, elements, model } = unit;
                    const chains = model.atomicHierarchy.chains;
                    const residues = model.atomicHierarchy.residues;
                    for (let i = 0; i < elements.length; i++) {
                        const atomIdx = elements[i];
                        const chainIdx = chainIndex[atomIdx];
                        let asymId = '';
                        if (chains && chains.auth_asym_id) {
                            if (typeof chains.auth_asym_id.value === 'function') {
                                asymId = (chains.auth_asym_id.value as (idx: number) => string)(chainIdx);
                            } else if (Array.isArray(chains.auth_asym_id.value)) {
                                asymId = (chains.auth_asym_id.value as unknown as any[])[chainIdx];
                            }
                        }
                        if (asymId !== chainId) continue;
                        const resIdx = residueIndex[atomIdx];
                        let seqId = '';
                        if (residues && residues.auth_seq_id) {
                            if (typeof residues.auth_seq_id.value === 'function') {
                                seqId = (residues.auth_seq_id.value as (idx: number) => any)(resIdx)?.toString();
                            } else if (Array.isArray(residues.auth_seq_id.value)) {
                                seqId = (residues.auth_seq_id.value as unknown as any[])[resIdx]?.toString();
                            }
                        }
                        let insCode = '';
                        if (residues && residues.pdbx_PDB_ins_code) {
                            if (typeof residues.pdbx_PDB_ins_code.value === 'function') {
                                insCode = (residues.pdbx_PDB_ins_code.value as (idx: number) => any)(resIdx) || '';
                            } else if (Array.isArray(residues.pdbx_PDB_ins_code.value)) {
                                insCode = (residues.pdbx_PDB_ins_code.value as unknown as any[])[resIdx] || '';
                            }
                        }
                        if (!found) {
                            found = true;
                            //console.log('[getResidueLoci] Listing all residues for chain', chainId);
                        }
                        //console.log(`[getResidueLoci] chainId: ${asymId}, auth_seq_id: ${seqId}, insCode: '${insCode}'`);
                    }
                }
            }
        } catch (e) {
            console.warn('[getResidueLoci] Error logging residues:', e);
        }

        return StructureSelection.toLociWithSourceUnits(selection);
    }

    /**
     * Focus the camera on a residue loci, with optional sync to another plugin.
     */
    function focusLociOnResidue(
        plugin: PluginUIContext,
        structureRef: string,
        chainId: string,
        residueId: string,
        insCode?: string,
        syncPlugin?: PluginUIContext
    ) {
        const loci = getResidueLoci(plugin, structureRef, chainId, residueId, insCode);
        if (!loci) return;
        const focusOptions = { extraRadius: zoomExtraRadius, minRadius: zoomMinRadius };
        plugin.managers.camera.focusLoci(loci, focusOptions);
        if (syncPlugin) {
            syncPlugin.managers.camera.focusLoci(loci, focusOptions);
        }
    }

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
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
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

    // Create chain zoomA handlers.
    const chainZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        structureRefAAlignedTo,
        'chain-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerB.ref
    );
    const chainZoomAAligned = createZoomHandler(
        viewerA.ref,
        structureRefAAligned,
        'chain-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerB.ref
    );

    // Create chain zoomB handlers.
    const chainZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        structureRefBAlignedTo,
        'chain-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerA.ref
    );
    const chainZoomBAligned = createZoomHandler(
        viewerB.ref,
        structureRefBAligned,
        'chain-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerA.ref
    );

    // Create Residue zoomA handlers.
    const residueZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        structureRefAAlignedTo,
        'residue-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerB.ref,
        selectedResidueIdAlignedTo,
        residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    );
    const residueZoomAAligned = createZoomHandler(
        viewerA.ref,
        structureRefAAligned,
        'residue-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerB.ref,
        selectedResidueIdAligned,
        residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
    );

    // Create Residue zoomB handlers.
    const residueZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        structureRefBAlignedTo,
        'residue-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerA.ref,
        selectedResidueIdAlignedTo,
        residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    );
    const residueZoomBAligned = createZoomHandler(
        viewerB.ref,
        structureRefBAligned,
        'residue-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerA.ref,
        selectedResidueIdAligned,
        residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
    );

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

    // Track realigned molecules with from/to chain IDs to prevent duplicates
    const [realignedMoleculesA, setRealignedMoleculesA] = useState<Array<{ id: string, file: File, label: string, from: string, to: string }>>([]);
    const [realignedMoleculesB, setRealignedMoleculesB] = useState<Array<{ id: string, file: File, label: string, from: string, to: string }>>([]);

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
            /**
             * Utility to get all Representation3D nodes for a structure.
             * @param plugin The Mol* plugin instance.
             * @param structureRef The structure reference to reload.
             */
            function getStructureRepresentations(plugin: any, structureRef: string) {
                const state = plugin.state.data;
                const reps = [];
                const children = state.tree.children.get(structureRef)?.toArray() || [];
                for (const childRef of children) {
                    const cell = state.cells.get(childRef);
                    if (cell?.obj?.type?.name === 'Structure Component') {
                        const compChildren = state.tree.children.get(childRef)?.toArray() || [];
                        for (const repRef of compChildren) {
                            const repCell = state.cells.get(repRef);
                            if (repCell?.obj?.type?.name === 'Representation3D') {
                                reps.push({
                                    type: repCell.obj?.type?.name,
                                    params: repCell.params,
                                    colorTheme: repCell.obj?.props?.colorTheme,
                                    repRef: repRef
                                });
                            }
                        }
                    }
                }
                return reps;
            }
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

    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.7.0 (<a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a>)</h1>
                <div className="General-Controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <label>
                            Residue Zoom extraRadius:
                            <input
                                type="number"
                                value={zoomExtraRadius}
                                min={0}
                                max={100}
                                step={1}
                                style={{ width: 60, marginLeft: 4 }}
                                onChange={e => setZoomExtraRadius(Number(e.target.value))}
                            />
                        </label>
                        <label>
                            minRadius:
                            <input
                                type="number"
                                value={zoomMinRadius}
                                min={0}
                                max={100}
                                step={1}
                                style={{ width: 60, marginLeft: 4 }}
                                onChange={e => setZoomMinRadius(Number(e.target.value))}
                            />
                        </label>
                    </div>
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedToLoaded}
                        syncEnabled={syncEnabled}
                        setSyncEnabled={setSyncEnabled}
                    />
                    <button
                        disabled={!selectedChainIdAlignedTo || !selectedChainIdAligned || realignmentExists}
                        onClick={handleRealignToChains}
                    >
                        {selectedChainIdAlignedTo && selectedChainIdAligned
                            ? realignmentExists
                              ? `Already re-aligned: ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`
                              : `Re-align : ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`
                            : 'Re-align to Chains'}
                    </button>
                    {/* File inputs for dictionary and alignment files temporarily commented out as there is no logic using them.
                    <button
                        onClick={dictionaryFile.handleButtonClick}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    >
                        Load Dictionary
                    </button>
                    <input
                        type="file"
                        accept=".csv,.txt"
                        style={{ display: 'none' }}
                        ref={dictionaryFile.inputRef}
                        onChange={dictionaryFile.handleFileChange}
                    />
                    <button
                        onClick={alignmentFile.handleButtonClick}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    >
                        Load Alignment
                    </button>
                    <input
                        type="file"
                        accept=".csv,.txt"
                        style={{ display: 'none' }}
                        ref={alignmentFile.inputRef}
                        onChange={alignmentFile.handleFileChange}
                    />
                    */}
                </div>
                <div className="Two-Columns-Container">
                    <div className="Column">
                        <LoadDataRow
                            viewerTitle={viewerA.moleculeAlignedTo ? AlignedTo + `: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}` : ""}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            onFileInputClick={viewerA.handleFileInputButtonClick}
                            fileInputRef={viewerA.fileInputRef}
                            onFileChange={e => handleFileChange(e, AlignedTo)}
                            fileInputDisabled={!viewerAReady || !viewerBReady}
                            fileInputLabel={`Load ` + AlignedTo}
                            representationType={representationTypeAlignedTo}
                            onRepresentationTypeChange={setRepresentationTypeAlignedTo}
                            representationTypeDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            representationTypeSelector={
                                <RepresentationSelectButton
                                    label="Select Representation"
                                    options={[...allowedRepresentationTypes]}
                                    selected={representationTypeAlignedTo}
                                    onSelect={option => setRepresentationTypeAlignedTo(option as AllowedRepresentationType)}
                                    disabled={!viewerA.isMoleculeAlignedToLoaded}
                                />
                            }
                            onAddColorsClick={colorsAlignedToFile.handleButtonClick}
                            addColorsDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            onAddRepresentationClick={() => {
                                // Add representation for alignedTo in both viewers
                                let colorTheme;
                                if (isMoleculeAlignedToColoursLoaded) {
                                    colorTheme = { name: AlignedTo + '-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for both viewers
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                if (viewerA.moleculeAlignedTo && structureRefAAlignedTo) {
                                    molstarA.addRepresentation(
                                        AlignedTo,
                                        structureRefAAlignedTo,
                                        representationTypeAlignedTo,
                                        colorTheme,
                                        repId
                                    );
                                }
                                if (viewerB.moleculeAlignedTo && structureRefBAlignedTo) {
                                    molstarB.addRepresentation(
                                        AlignedTo,
                                        structureRefBAlignedTo,
                                        representationTypeAlignedTo,
                                        colorTheme,
                                        repId
                                    );
                                }
                            }}
                            addRepresentationDisabled={!viewerA.isMoleculeAlignedToLoaded || !structureRefAAlignedTo}
                            colorsInputRef={colorsAlignedToFile.inputRef}
                            onColorsFileChange={colorsAlignedToFile.handleFileChange}
                            selectedSubunit={selectedSubunitAlignedTo}
                            onSelectSubunit={setSelectedSubunitAlignedTo}
                            subunitSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            chainInfo={chainInfoAlignedTo}
                            selectedChainId={selectedChainIdAlignedTo}
                            onSelectChainId={setSelectedChainIdAlignedTo}
                            chainSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            residueInfo={residueInfoAlignedTo}
                            selectedResidueId={selectedResidueIdAlignedTo}
                            onSelectResidueId={setSelectedResidueIdAlignedTo}
                            residueSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            fogEnabled={fogAEnabled}
                            fogNear={fogANear}
                            fogFar={fogAFar}
                            onFogEnabledChange={val => {
                                setFogAEnabled(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, val, fogANear, fogAFar, cameraANear, cameraAFar);
                            }}
                            onFogNearChange={val => {
                                setFogANear(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogAEnabled, val, fogAFar, cameraANear, cameraAFar);
                            }}
                            onFogFarChange={val => {
                                setFogAFar(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogAEnabled, fogANear, val, cameraANear, cameraAFar);
                            }}
                            cameraNear={cameraANear}
                            cameraFar={cameraAFar}
                            onCameraNearChange={val => {
                                setCameraANear(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogAEnabled, fogANear, fogAFar, val, cameraAFar);
                            }}
                            onCameraFarChange={val => {
                                setCameraAFar(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogAEnabled, fogANear, fogAFar, cameraANear, val);
                            }}
                            subunitToChainIds={subunitToChainIdsAlignedTo}
                        />
                        <MoleculeUI
                            key={molstarA.representationRefs[AlignedTo]?.join('-') || A + '-' + AlignedTo}
                            label={viewerA.moleculeAlignedTo?.label ?? AlignedTo}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerAAlignedTo.handleButtonClick}
                            chainZoomLabel={selectedChainIdAlignedTo && chainInfoAlignedTo.chainLabels.has(selectedChainIdAlignedTo)
                                ? chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo) ?? ''
                                : ''}
                            onChainZoom={chainZoomAAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || ''}
                            onResidueZoom={residueZoomAAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA);
                                } else {
                                    // fallback for legacy/edge
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, AlignedTo, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[AlignedTo][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[AlignedTo].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[AlignedTo][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarA.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(repRef);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                        />
                        <MoleculeUI
                            key={molstarA.representationRefs[Aligned]?.join('-') || A + '-' + Aligned}
                            label={viewerA.moleculeAligned?.label ?? Aligned}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerAAligned.handleButtonClick}
                            chainZoomLabel={selectedChainIdAligned && chainInfoAligned.chainLabels.has(selectedChainIdAligned)
                                ? chainInfoAligned.chainLabels.get(selectedChainIdAligned) ?? ''
                                : ''}
                            onChainZoom={chainZoomAAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || ''}
                            onResidueZoom={residueZoomAAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerA.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, Aligned, molstarA, false),
                                            deleteRepresentation(ref, Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, Aligned, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[Aligned][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarA.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(repRef);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                        />
                        {/* Render all re-aligned molecules for Viewer A */}
                        {realignedMoleculesA.map(mol => {
                            const plugin = viewerA.ref.current;
                            const repRefs = molstarA.representationRefs[mol.id] || [];
                            let isVisible = false;
                            if (plugin && repRefs.length > 0) {
                                isVisible = repRefs.some(ref => {
                                    const cell = plugin.state?.data?.cells?.get(ref);
                                    return cell?.state?.isHidden !== true;
                                });
                            }
                            // Use 'to' chain for zoom
                            const chainId = mol.to;
                            const chainLabel = chainInfoAligned.chainLabels.get(chainId) || chainId || '';
                            const chainZoomHandler = createZoomHandler(
                                viewerA.ref,
                                realignedStructRefsA[mol.id],
                                'chain-test',
                                chainId,
                                false
                            );
                            // Residue zoom: use selected residue for aligned chain if available
                            const residueId = selectedResidueIdAligned;
                            const residueLabel = residueInfoAligned.residueLabels.get(residueId)?.name || '';
                            const residueZoomHandler = createZoomHandler(
                                viewerA.ref,
                                realignedStructRefsA[mol.id],
                                'residue-test',
                                chainId,
                                false,
                                undefined,
                                residueId,
                                residueInfoAligned.residueLabels.get(residueId)?.insCode
                            );
                            return (
                                <MoleculeUI
                                    key={mol.id}
                                    label={mol.label}
                                    plugin={plugin}
                                    isVisible={isVisible}
                                    onToggleVisibility={() => {
                                        repRefs.forEach(ref => {
                                            const plugin = molstarA.pluginRef.current;
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
                                    }}
                                    chainZoomLabel={chainLabel}
                                    onChainZoom={chainZoomHandler.handleButtonClick}
                                    chainZoomDisabled={!chainId}
                                    residueZoomLabel={residueLabel}
                                    onResidueZoom={residueZoomHandler.handleButtonClick}
                                    residueZoomDisabled={!residueId}
                                    isLoaded={true}
                                    forceUpdate={forceUpdate}
                                    representationRefs={repRefs}
                                    onDeleteRepresentation={ref => {
                                        const repId = Object.entries(molstarA.repIdMap[mol.id] || {}).find(([id, r]) => r === ref)?.[0];
                                        if (repId) {
                                            deleteRepresentation(molstarA.repIdMap[mol.id][repId], mol.id, molstarA);
                                        } else {
                                            deleteRepresentation(ref, mol.id, molstarA);
                                        }
                                        if (realignedStructRefsA[mol.id]) molstarA.refreshRepresentationRefs(mol.id, realignedStructRefsA[mol.id]);
                                        forceUpdate();
                                    }}
                                    onToggleRepVisibility={ref => {
                                        const plugin = molstarA.pluginRef.current;
                                        if (!plugin) return;
                                        const cell = plugin.state?.data?.cells?.get(ref);
                                        if (cell) {
                                            import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                                PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                                                plugin.canvas3d?.requestDraw?.();
                                                forceUpdate();
                                            });
                                        }
                                    }}
                                    onRemove={async () => {
                                        async function removeTopNode(molstar: any, structRef: any) {
                                            if (!structRef || !molstar.pluginRef.current) return;
                                            const plugin = molstar.pluginRef.current;
                                            const state = plugin.state.data;
                                            const cell = state.cells.get(structRef);
                                            if (cell) {
                                                console.log('Mol* REMOVE: structRef', structRef, 'type:', cell.obj?.type?.name, 'label:', cell.obj?.label);
                                            } else {
                                                console.warn('Mol* REMOVE: structRef', structRef, 'not found in state.cells');
                                            }
                                            await import('molstar/lib/mol-plugin/commands').then(async ({ PluginCommands }) => {
                                                await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: structRef }]);
                                            });
                                        }
                                        await Promise.all([
                                            removeTopNode(molstarA, realignedStructRefsA[mol.id]),
                                            removeTopNode(molstarB, realignedStructRefsB[mol.id])
                                        ]);
                                        setRealignedMoleculesA(prev => prev.filter(m => m.id !== mol.id));
                                        setRealignedMoleculesB(prev => prev.filter(m => m.id !== mol.id));
                                        setRealignedRepRefsA(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedRepRefsB(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedStructRefsA(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedStructRefsB(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        forceUpdate();
                                    }}
                                />
                            );
                        })}
                        <MolstarContainer
                            ref={pluginRefA}
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className='Column'>
                        <LoadDataRow
                            viewerTitle={viewerB.moleculeAligned ? Aligned + `: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}` : ""}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            onFileInputClick={viewerB.handleFileInputButtonClick}
                            fileInputRef={viewerB.fileInputRef}
                            onFileChange={e => handleFileChange(e, Aligned)}
                            fileInputDisabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                            fileInputLabel={`Load ${Aligned}`}
                            representationType={representationTypeAligned}
                            onRepresentationTypeChange={setRepresentationTypeAligned}
                            representationTypeDisabled={!viewerB.isMoleculeAlignedLoaded}
                            representationTypeSelector={
                                <RepresentationSelectButton
                                    label="Select Representation"
                                    options={[...allowedRepresentationTypes]}
                                    selected={representationTypeAligned}
                                    onSelect={option => setRepresentationTypeAligned(option as AllowedRepresentationType)}
                                    disabled={!viewerB.isMoleculeAlignedLoaded}
                                />
                            }
                            onAddColorsClick={colorsAlignedFile.handleButtonClick}
                            addColorsDisabled={!viewerB.isMoleculeAlignedLoaded}
                            onAddRepresentationClick={() => {
                                // Add representation for aligned and all realigned molecules in both viewers
                                let colorTheme;
                                if (isMoleculeAlignedColoursLoaded) {
                                    colorTheme = { name: Aligned + '-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for all
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                // Aligned in A
                                if (viewerA.moleculeAligned && structureRefAAligned) {
                                    molstarA.addRepresentation(
                                        Aligned,
                                        structureRefAAligned,
                                        representationTypeAligned,
                                        colorTheme,
                                        repId
                                    );
                                }
                                // Aligned in B
                                if (viewerB.moleculeAligned && structureRefBAligned) {
                                    molstarB.addRepresentation(
                                        Aligned,
                                        structureRefBAligned,
                                        representationTypeAligned,
                                        colorTheme,
                                        repId
                                    );
                                }
                                // Realigned in A
                                Object.entries(realignedStructRefsA).forEach(([id, structRef]) => {
                                    if (structRef) {
                                        molstarA.addRepresentation(
                                            id,
                                            structRef,
                                            representationTypeAligned,
                                            colorTheme,
                                            repId
                                        );
                                    }
                                });
                                // Realigned in B
                                Object.entries(realignedStructRefsB).forEach(([id, structRef]) => {
                                    if (structRef) {
                                        molstarB.addRepresentation(
                                            id,
                                            structRef,
                                            representationTypeAligned,
                                            colorTheme,
                                            repId
                                        );
                                    }
                                });
                            }}
                            addRepresentationDisabled={!viewerB.isMoleculeAlignedLoaded || !structureRefBAligned}
                            colorsInputRef={colorsAlignedFile.inputRef}
                            onColorsFileChange={colorsAlignedFile.handleFileChange}
                            selectedSubunit={selectedSubunitAligned}
                            onSelectSubunit={setSelectedSubunitAligned}
                            subunitSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                            chainInfo={chainInfoAligned}
                            selectedChainId={selectedChainIdAligned}
                            onSelectChainId={setSelectedChainIdAligned}
                            chainSelectDisabled={!viewerB.isMoleculeAlignedToLoaded}
                            residueInfo={residueInfoAligned}
                            selectedResidueId={selectedResidueIdAligned}
                            onSelectResidueId={setSelectedResidueIdAligned}
                            residueSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                            fogEnabled={fogBEnabled}
                            fogNear={fogBNear}
                            fogFar={fogBFar}
                            onFogEnabledChange={val => {
                                setFogBEnabled(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, val, fogBNear, fogBFar, cameraBNear, cameraBFar);
                            }}
                            onFogNearChange={val => {
                                setFogBNear(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogBEnabled, val, fogBFar, cameraBNear, cameraBFar);
                            }}
                            onFogFarChange={val => {
                                setFogBFar(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogBEnabled, fogBNear, val, cameraBNear, cameraBFar);
                            }}
                            cameraNear={cameraBNear}
                            cameraFar={cameraBFar}
                            onCameraNearChange={val => {
                                setCameraBNear(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogBEnabled, fogBNear, fogBFar, val, cameraBFar);
                            }}
                            onCameraFarChange={val => {
                                setCameraBFar(val);
                                updateFog(viewerA.ref.current, viewerB.ref.current, fogBEnabled, fogBNear, fogBFar, cameraBNear, val);
                            }}
                            subunitToChainIds={subunitToChainIdsAligned}
                        />
                        <MoleculeUI
                            key={molstarB.representationRefs[AlignedTo]?.join('-') || B + `-` + AlignedTo}
                            label={viewerB.moleculeAlignedTo?.label ?? AlignedTo}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerBAlignedTo.handleButtonClick}
                            chainZoomLabel={selectedChainIdAlignedTo && chainInfoAlignedTo.chainLabels.has(selectedChainIdAlignedTo)
                                ? chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo) ?? ''
                                : ''}
                            onChainZoom={chainZoomBAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || ''}
                            onResidueZoom={residueZoomBAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerB.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, AlignedTo, molstarB);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerB
                                const repId = Object.entries(molstarB.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarB.repIdMap[Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarB.representationRefs[Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarB.representationRefs[Aligned][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarB.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(ref);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                        />
                        <MoleculeUI
                            key={molstarB.representationRefs[Aligned]?.join('-') || B + `-` + Aligned}
                            label={viewerB.moleculeAligned?.label ?? Aligned}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerBAligned.handleButtonClick}
                            chainZoomLabel={selectedChainIdAligned && chainInfoAligned.chainLabels.has(selectedChainIdAligned)
                                ? chainInfoAligned.chainLabels.get(selectedChainIdAligned) ?? ''
                                : ''}
                            onChainZoom={chainZoomBAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || ''}
                            onResidueZoom={residueZoomBAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, Aligned, molstarA, false),
                                            deleteRepresentation(ref, Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, Aligned, molstarB);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                [molstarA, molstarB].forEach(molstar => {
                                    const plugin = molstar.pluginRef.current;
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
                            }}
                        />
                        {/* Render all re-aligned molecules for Viewer B */}
                        {realignedMoleculesB.map(mol => {
                            const plugin = viewerB.ref.current;
                            const repRefs = molstarB.representationRefs[mol.id] || [];
                            let isVisible = false;
                            if (plugin && repRefs.length > 0) {
                                isVisible = repRefs.some(ref => {
                                    const cell = plugin.state?.data?.cells?.get(ref);
                                    return cell?.state?.isHidden !== true;
                                });
                            }
                            // Use 'to' chain for zoom
                            const chainId = mol.to;
                            const chainLabel = chainInfoAligned.chainLabels.get(chainId) || chainId || '';
                            const chainZoomHandler = createZoomHandler(
                                viewerB.ref,
                                realignedStructRefsB[mol.id],
                                'chain-test',
                                chainId,
                                false
                            );
                            // Residue zoom: use selected residue for aligned chain if available
                            const residueId = selectedResidueIdAligned;
                            const residueLabel = residueInfoAligned.residueLabels.get(residueId)?.name || '';
                            const residueZoomHandler = createZoomHandler(
                                viewerB.ref,
                                realignedStructRefsB[mol.id],
                                'residue-test',
                                chainId,
                                false,
                                undefined,
                                residueId,
                                residueInfoAligned.residueLabels.get(residueId)?.insCode
                            );
                            return (
                                <MoleculeUI
                                    key={mol.id}
                                    label={mol.label}
                                    plugin={plugin}
                                    isVisible={isVisible}
                                    onToggleVisibility={() => {
                                        repRefs.forEach(ref => {
                                            const plugin = molstarB.pluginRef.current;
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
                                    }}
                                    chainZoomLabel={chainLabel}
                                    onChainZoom={chainZoomHandler.handleButtonClick}
                                    chainZoomDisabled={!chainId}
                                    residueZoomLabel={residueLabel}
                                    onResidueZoom={residueZoomHandler.handleButtonClick}
                                    residueZoomDisabled={!residueId}
                                    isLoaded={true}
                                    forceUpdate={forceUpdate}
                                    representationRefs={repRefs}
                                    onDeleteRepresentation={ref => {
                                        const repId = Object.entries(molstarB.repIdMap[mol.id] || {}).find(([id, r]) => r === ref)?.[0];
                                        if (repId) {
                                            deleteRepresentation(molstarB.repIdMap[mol.id][repId], mol.id, molstarB);
                                        } else {
                                            deleteRepresentation(ref, mol.id, molstarB);
                                        }
                                        if (realignedStructRefsB[mol.id]) molstarB.refreshRepresentationRefs(mol.id, realignedStructRefsB[mol.id]);
                                        forceUpdate();
                                    }}
                                    onToggleRepVisibility={ref => {
                                        const plugin = molstarB.pluginRef.current;
                                        if (!plugin) return;
                                        const cell = plugin.state?.data?.cells?.get(ref);
                                        if (cell) {
                                            import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                                PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                                                plugin.canvas3d?.requestDraw?.();
                                                forceUpdate();
                                            });
                                        }
                                    }}
                                    onRemove={async () => {
                                        async function removeAllReps(molstar: any, structRef: any) {
                                            if (!structRef || !molstar.pluginRef.current) return;
                                            const plugin = molstar.pluginRef.current;
                                            const state = plugin.state.data;
                                            const repsToRemove = [];
                                            const children = state.tree.children.get(structRef)?.toArray?.() || [];
                                            for (const childRef of children) {
                                                const cell = state.cells.get(childRef);
                                                if (cell?.obj?.type?.name === 'Structure Component') {
                                                    const compChildren = state.tree.children.get(childRef)?.toArray?.() || [];
                                                    for (const repRef of compChildren) {
                                                        const repCell = state.cells.get(repRef);
                                                        if (repCell?.obj?.type?.name === 'Representation3D') {
                                                            repsToRemove.push(repRef);
                                                        }
                                                    }
                                                } else if (cell?.obj?.type?.name === 'Representation3D') {
                                                    repsToRemove.push(childRef);
                                                }
                                            }
                                            for (const repRef of repsToRemove) {
                                                await deleteRepresentation(repRef, mol.id, molstar, false);
                                            }
                                        }
                                        await Promise.all([
                                            removeAllReps(molstarA, realignedStructRefsA[mol.id]),
                                            removeAllReps(molstarB, realignedStructRefsB[mol.id])
                                        ]);
                                        if (realignedStructRefsA[mol.id]) molstarA.refreshRepresentationRefs(mol.id, realignedStructRefsA[mol.id]);
                                        if (realignedStructRefsB[mol.id]) molstarB.refreshRepresentationRefs(mol.id, realignedStructRefsB[mol.id]);
                                        setRealignedMoleculesA(prev => prev.filter(m => m.id !== mol.id));
                                        setRealignedMoleculesB(prev => prev.filter(m => m.id !== mol.id));
                                        setRealignedRepRefsA(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedRepRefsB(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedStructRefsA(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        setRealignedStructRefsB(prev => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                                        forceUpdate();
                                    }}
                                />
                            );
                        })}
                        <MolstarContainer
                            ref={pluginRefB}
                            viewerKey={viewerB.viewerKey}
                            setViewer={setViewerBWrapper}
                            onMouseDown={() => setActiveViewer(viewerB.viewerKey)}
                            onReady={() => setViewerBReady(true)}
                        />
                    </div>
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;